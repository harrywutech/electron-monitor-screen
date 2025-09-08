const tesseract = require('node-tesseract-ocr');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class OCRService {
  constructor() {
    this.config = {
      lang: 'eng+chi_sim+chi_tra', // 英文 + 简体中文 + 繁体中文
      oem: 1,
      psm: 3,
    };
    this.isInitialized = false;
    this.tempDir = null;
  }

  // 初始化OCR服务
  async initialize() {
    if (this.isInitialized) return;

    try {
      // 创建临时目录
      const userDataPath = app.getPath('userData');
      this.tempDir = path.join(userDataPath, 'ScreenWatcher', 'temp');
      
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }

      console.log('OCR Service initialized');
      this.isInitialized = true;
    } catch (error) {
      console.error('OCR initialization failed:', error);
      throw error;
    }
  }

  // 处理图片OCR
  async processImage(imageData, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    let tempImagePath = null;

    try {
      // 配置选项
      const config = {
        ...this.config,
        ...options
      };

      // 准备图片数据
      tempImagePath = await this.prepareImage(imageData);

      // 执行OCR
      const text = await tesseract.recognize(tempImagePath, config);
      
      const processingTime = Date.now() - startTime;

      console.log(`OCR completed in ${processingTime}ms`);
      console.log('Extracted text length:', text.length);

      // 返回结果
      const result = {
        text: text.trim(),
        confidence: this.calculateConfidence(text), // 简单的置信度计算
        language: config.lang,
        processingTime,
        timestamp: Date.now()
      };

      return result;
    } catch (error) {
      console.error('OCR processing failed:', error);
      throw error;
    } finally {
      // 清理临时文件
      if (tempImagePath && fs.existsSync(tempImagePath)) {
        try {
          fs.unlinkSync(tempImagePath);
        } catch (err) {
          console.error('Failed to clean temp file:', err);
        }
      }
    }
  }

  // 准备图片数据
  async prepareImage(imageData) {
    const timestamp = Date.now();
    const tempImagePath = path.join(this.tempDir, `ocr_${timestamp}.png`);

    try {
      let imageBuffer;

      if (typeof imageData === 'string') {
        if (imageData.startsWith('data:image/')) {
          // Base64 data URL
          const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
          imageBuffer = Buffer.from(base64Data, 'base64');
        } else if (fs.existsSync(imageData)) {
          // 文件路径
          imageBuffer = fs.readFileSync(imageData);
        } else {
          throw new Error('Invalid image data format');
        }
      } else if (Buffer.isBuffer(imageData)) {
        imageBuffer = imageData;
      } else {
        throw new Error('Unsupported image data type');
      }

      // 使用Sharp处理图片，优化OCR识别效果
      await sharp(imageBuffer)
        .resize({ width: 1920, withoutEnlargement: true }) // 限制最大宽度
        .grayscale() // 转为灰度图
        .normalize() // 标准化对比度
        .sharpen() // 锐化
        .png({ quality: 100 }) // 使用PNG格式保存
        .toFile(tempImagePath);

      return tempImagePath;
    } catch (error) {
      console.error('Image preparation failed:', error);
      throw error;
    }
  }

  // 计算置信度（简单实现）
  calculateConfidence(text) {
    if (!text || text.length === 0) return 0;

    // 基于文本特征的简单置信度计算
    let confidence = 0.5; // 基础置信度

    // 文本长度加分
    if (text.length > 10) confidence += 0.1;
    if (text.length > 50) confidence += 0.1;
    if (text.length > 100) confidence += 0.1;

    // 包含常见词汇加分
    const commonWords = ['the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', '的', '和', '或', '在', '于'];
    const wordsFound = commonWords.filter(word => 
      text.toLowerCase().includes(word.toLowerCase())
    ).length;
    confidence += Math.min(wordsFound * 0.02, 0.2);

    // 减少特殊字符的影响
    const specialCharRatio = (text.match(/[^\w\s\u4e00-\u9fff]/g) || []).length / text.length;
    if (specialCharRatio > 0.3) confidence -= 0.2;

    return Math.max(0, Math.min(1, confidence));
  }

  // 批量处理图片
  async processBatch(imageDataArray, options = {}) {
    const results = [];
    
    for (let i = 0; i < imageDataArray.length; i++) {
      try {
        const result = await this.processImage(imageDataArray[i], options);
        results.push({ index: i, success: true, result });
      } catch (error) {
        console.error(`Batch OCR failed for image ${i}:`, error);
        results.push({ index: i, success: false, error: error.message });
      }
    }

    return results;
  }

  // 获取支持的语言
  getSupportedLanguages() {
    return [
      { code: 'eng', name: '英文', native: 'English' },
      { code: 'chi_sim', name: '简体中文', native: '简体中文' },
      { code: 'chi_tra', name: '繁体中文', native: '繁體中文' },
      { code: 'jpn', name: '日文', native: '日本語' },
      { code: 'kor', name: '韩文', native: '한국어' },
      { code: 'fra', name: '法文', native: 'Français' },
      { code: 'deu', name: '德文', native: 'Deutsch' },
      { code: 'spa', name: '西班牙文', native: 'Español' },
      { code: 'rus', name: '俄文', native: 'Русский' },
      { code: 'ara', name: '阿拉伯文', native: 'العربية' }
    ];
  }

  // 设置语言
  setLanguage(languageCode) {
    if (typeof languageCode === 'string') {
      this.config.lang = languageCode;
    } else if (Array.isArray(languageCode)) {
      this.config.lang = languageCode.join('+');
    }
    console.log('OCR language set to:', this.config.lang);
  }

  // 设置OCR配置
  setConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    console.log('OCR config updated:', this.config);
  }

  // 清理临时文件
  async cleanup() {
    if (!this.tempDir || !fs.existsSync(this.tempDir)) return;

    try {
      const files = fs.readdirSync(this.tempDir);
      const cutoffTime = Date.now() - (60 * 60 * 1000); // 1小时前

      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath);
          console.log('Cleaned temp file:', file);
        }
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  // macOS Vision Framework集成（如果可用）
  async processMacOSVision(imageData) {
    if (process.platform !== 'darwin') {
      throw new Error('macOS Vision Framework is only available on macOS');
    }

    // 这里可以集成macOS的Vision Framework
    // 由于需要原生模块，这里提供一个接口框架
    try {
      // 如果有Vision Framework的Node.js绑定，可以在这里调用
      // const visionResult = await nativeVision.recognizeText(imageData);
      // return visionResult;
      
      // 暂时回退到Tesseract
      console.log('macOS Vision Framework not available, falling back to Tesseract');
      return await this.processImage(imageData);
    } catch (error) {
      console.error('Vision Framework failed, falling back to Tesseract:', error);
      return await this.processImage(imageData);
    }
  }
}

module.exports = OCRService;