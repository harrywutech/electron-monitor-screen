import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { app } from 'electron';
import { OCRResult, OCRError } from '../common/types';

export class OCRService {
  private tempDir: string;
  private isInitialized: boolean = false;

  constructor() {
    this.tempDir = path.join(app.getPath('temp'), 'screenwatcher-ocr');
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 创建临时目录
      if (!existsSync(this.tempDir)) {
        await mkdir(this.tempDir, { recursive: true });
      }
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize OCR service:', error);
      throw new OCRError('OCR service initialization failed');
    }
  }

  // 使用 macOS 系统的 OCR 功能（通过 AppleScript 调用 VisionKit）
  async recognizeTextMacOS(imageDataURL: string): Promise<OCRResult> {
    try {
      await this.initialize();

      // 将 base64 图像数据保存为临时文件
      const imagePath = await this.saveImageFromDataURL(imageDataURL);

      // 使用 AppleScript 调用 VisionKit OCR
      const script = `
        use framework "Vision"
        use framework "AppKit"
        use scripting additions

        set imagePath to POSIX file "${imagePath}"
        set imageData to (current application's NSData's dataWithContentsOfFile:imagePath)
        set image to (current application's NSImage's alloc()'s initWithData:imageData)
        
        -- Create Vision request
        set request to current application's VNRecognizeTextRequest's alloc()'s init()
        request's setRecognitionLevel:(current application's VNRequestTextRecognitionLevelAccurate)
        request's setUsesLanguageCorrection:true
        
        -- Perform request
        set handler to current application's VNImageRequestHandler's alloc()'s initWithCGImage:(image's CGImageForProposedRect:(missing value) context:(missing value) hints:(missing value)) options:(current application's NSDictionary's dictionary())
        
        set {result, requestError} to handler's performRequests:{request} |error|:(reference)
        
        if requestError is not missing value then
            return "ERROR: " & (requestError's localizedDescription() as string)
        end if
        
        -- Extract text results
        set textResults to {}
        set observations to request's results()
        repeat with observation in observations
            set recognizedText to observation's topCandidates:1
            if (count of recognizedText) > 0 then
                set textCandidate to item 1 of recognizedText
                set end of textResults to (textCandidate's |string|() as string)
            end if
        end repeat
        
        return textResults as string
      `;

      const result = await this.executeAppleScript(script);
      
      // 清理临时文件
      await this.cleanupTempFile(imagePath);

      if (result.startsWith('ERROR:')) {
        throw new OCRError(result.substring(7));
      }

      return {
        text: result,
        boundingBoxes: [], // AppleScript 版本暂不提供边界框
        confidence: 0.9, // 默认置信度
        language: 'zh-CN', // 默认语言
      };

    } catch (error) {
      console.error('OCR recognition failed:', error);
      throw new OCRError(`Text recognition failed: ${error}`);
    }
  }

  // 使用 Tesseract OCR 作为备选方案
  async recognizeTextTesseract(imageDataURL: string, languages: string[] = ['chi_sim', 'eng']): Promise<OCRResult> {
    try {
      await this.initialize();

      const imagePath = await this.saveImageFromDataURL(imageDataURL);
      const outputPath = path.join(this.tempDir, `ocr_output_${Date.now()}`);

      return new Promise((resolve, reject) => {
        const langString = languages.join('+');
        const args = [imagePath, outputPath, '-l', langString, '--psm', '6', '--oem', '3'];
        
        const tesseract = spawn('tesseract', args);
        
        let stderr = '';
        tesseract.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        tesseract.on('close', async (code) => {
          try {
            await this.cleanupTempFile(imagePath);

            if (code !== 0) {
              reject(new OCRError(`Tesseract failed with code ${code}: ${stderr}`));
              return;
            }

            // 读取 OCR 结果
            const fs = require('fs').promises;
            const textContent = await fs.readFile(`${outputPath}.txt`, 'utf-8');
            
            // 清理输出文件
            await this.cleanupTempFile(`${outputPath}.txt`);

            resolve({
              text: textContent.trim(),
              boundingBoxes: [],
              confidence: 0.8,
              language: langString,
            });

          } catch (error) {
            reject(new OCRError(`Failed to read OCR result: ${error}`));
          }
        });

        tesseract.on('error', (error) => {
          reject(new OCRError(`Tesseract spawn error: ${error.message}`));
        });
      });

    } catch (error) {
      console.error('Tesseract OCR failed:', error);
      throw new OCRError(`Tesseract recognition failed: ${error}`);
    }
  }

  // 自动选择最佳 OCR 方法
  async recognizeText(imageDataURL: string, options: {
    languages?: string[];
    quality?: 'fast' | 'balanced' | 'high';
  } = {}): Promise<OCRResult> {
    const { languages = ['chi_sim', 'eng'], quality = 'balanced' } = options;

    try {
      // macOS 系统优先使用 VisionKit
      if (process.platform === 'darwin') {
        try {
          return await this.recognizeTextMacOS(imageDataURL);
        } catch (error) {
          console.warn('macOS OCR failed, falling back to Tesseract:', error);
          // 如果 macOS OCR 失败，尝试 Tesseract
        }
      }

      // 使用 Tesseract 作为备选方案
      return await this.recognizeTextTesseract(imageDataURL, languages);

    } catch (error) {
      console.error('All OCR methods failed:', error);
      throw new OCRError('Text recognition failed with all available methods');
    }
  }

  // 执行 AppleScript
  private executeAppleScript(script: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const osascript = spawn('osascript', ['-e', script]);
      
      let stdout = '';
      let stderr = '';

      osascript.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      osascript.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      osascript.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`AppleScript failed with code ${code}: ${stderr}`));
        } else {
          resolve(stdout.trim());
        }
      });

      osascript.on('error', (error) => {
        reject(error);
      });
    });
  }

  // 将 Data URL 保存为临时图像文件
  private async saveImageFromDataURL(dataURL: string): Promise<string> {
    try {
      const matches = dataURL.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid data URL format');
      }

      const [, extension, base64Data] = matches;
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `ocr_input_${Date.now()}.${extension}`;
      const filePath = path.join(this.tempDir, fileName);

      await writeFile(filePath, buffer);
      return filePath;
    } catch (error) {
      throw new OCRError(`Failed to save image: ${error}`);
    }
  }

  // 清理临时文件
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      console.warn(`Failed to cleanup temp file ${filePath}:`, error);
    }
  }

  // 检查 OCR 可用性
  async checkAvailability(): Promise<{
    macOSVision: boolean;
    tesseract: boolean;
  }> {
    const availability = {
      macOSVision: false,
      tesseract: false,
    };

    // 检查 macOS Vision 框架
    if (process.platform === 'darwin') {
      try {
        const result = await this.executeAppleScript('use framework "Vision"');
        availability.macOSVision = true;
      } catch (error) {
        console.warn('macOS Vision framework not available:', error);
      }
    }

    // 检查 Tesseract
    try {
      await new Promise((resolve, reject) => {
        const tesseract = spawn('tesseract', ['--version']);
        tesseract.on('close', (code) => {
          if (code === 0) {
            availability.tesseract = true;
          }
          resolve(undefined);
        });
        tesseract.on('error', () => resolve(undefined));
        
        setTimeout(() => resolve(undefined), 3000); // 3秒超时
      });
    } catch (error) {
      console.warn('Tesseract not available:', error);
    }

    return availability;
  }

  // 获取支持的语言列表
  async getSupportedLanguages(): Promise<string[]> {
    try {
      if (process.platform === 'darwin') {
        // macOS Vision 支持的语言
        return ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'fr', 'de', 'es', 'it', 'ru'];
      }

      // Tesseract 语言检查
      return new Promise((resolve, reject) => {
        const tesseract = spawn('tesseract', ['--list-langs']);
        
        let stdout = '';
        tesseract.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        tesseract.on('close', (code) => {
          if (code === 0) {
            const languages = stdout.split('\n')
              .slice(1) // 跳过第一行标题
              .filter(lang => lang.trim().length > 0)
              .map(lang => lang.trim());
            resolve(languages);
          } else {
            resolve(['eng', 'chi_sim']); // 默认语言
          }
        });

        tesseract.on('error', () => {
          resolve(['eng', 'chi_sim']); // 默认语言
        });
      });
    } catch (error) {
      return ['eng', 'chi_sim']; // 默认语言
    }
  }

  // 清理服务
  async cleanup(): Promise<void> {
    try {
      if (existsSync(this.tempDir)) {
        const fs = require('fs').promises;
        const files = await fs.readdir(this.tempDir);
        
        await Promise.all(
          files.map(file => 
            this.cleanupTempFile(path.join(this.tempDir, file))
          )
        );
      }
    } catch (error) {
      console.warn('OCR cleanup failed:', error);
    }
  }
}