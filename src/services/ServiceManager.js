const DatabaseService = require('./database');
const OCRService = require('./ocr');
const Store = require('electron-store');

class ServiceManager {
  constructor() {
    this.database = new DatabaseService();
    this.ocr = new OCRService();
    this.store = new Store({
      name: 'screenwatcher-config',
      defaults: {
        general: {
          autoStart: false,
          startMinimized: true,
          alwaysOnTop: true,
          hideInDock: true,
        },
        capture: {
          interval: 2000,
          quality: 'high',
          autoCapture: false,
          captureAudio: false,
        },
        storage: {
          maxScreenshots: 1000,
          autoCleanup: true,
          cleanupDays: 30,
          encryptData: false,
        },
        appearance: {
          theme: 'dark',
          transparency: 85,
          animations: true,
        }
      }
    });
    this.isInitialized = false;
  }

  // 初始化所有服务
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('Initializing services...');

      // 初始化数据库
      await this.database.initialize();
      console.log('Database service initialized');

      // 初始化OCR服务
      await this.ocr.initialize();
      console.log('OCR service initialized');

      // 设置定时清理任务
      this.setupCleanupTasks();

      this.isInitialized = true;
      console.log('All services initialized successfully');
    } catch (error) {
      console.error('Service initialization failed:', error);
      throw error;
    }
  }

  // 处理新截图
  async handleNewScreenshot(screenshotData) {
    try {
      // 保存截图到数据库
      const screenshotId = await this.database.saveScreenshot({
        imageData: screenshotData.image,
        sourceName: screenshotData.source,
        sourceId: screenshotData.id,
        filePath: null,
        timestamp: screenshotData.timestamp,
        width: null,
        height: null,
        fileSize: null
      });

      console.log('Screenshot saved to database with ID:', screenshotId);

      // 异步处理OCR，不阻塞主流程
      this.processOCR(screenshotId, screenshotData.image).catch(error => {
        console.error('OCR processing failed:', error);
      });

      return screenshotId;
    } catch (error) {
      console.error('Failed to handle screenshot:', error);
      throw error;
    }
  }

  // 处理OCR
  async processOCR(screenshotId, imageData) {
    try {
      console.log('Starting OCR processing for screenshot:', screenshotId);

      // 执行OCR
      const ocrResult = await this.ocr.processImage(imageData);

      // 保存OCR结果
      if (ocrResult && ocrResult.text) {
        await this.database.saveOcrResult({
          screenshotId: screenshotId,
          textContent: ocrResult.text,
          confidence: ocrResult.confidence,
          language: ocrResult.language,
          processingTime: ocrResult.processingTime,
          textBlocks: [] // 可以在这里添加更详细的文本块信息
        });

        console.log('OCR result saved for screenshot:', screenshotId);
        return ocrResult;
      }
    } catch (error) {
      console.error('OCR processing failed for screenshot', screenshotId, ':', error);
      throw error;
    }
  }

  // 获取截图列表
  async getScreenshots(filters = {}) {
    try {
      return await this.database.getScreenshots(filters);
    } catch (error) {
      console.error('Failed to get screenshots:', error);
      throw error;
    }
  }

  // 搜索OCR文本
  async searchOcrText(query, limit = 50) {
    try {
      return await this.database.searchOcrText(query, limit);
    } catch (error) {
      console.error('Failed to search OCR text:', error);
      throw error;
    }
  }

  // 删除截图
  async deleteScreenshot(id) {
    try {
      return await this.database.deleteScreenshot(id);
    } catch (error) {
      console.error('Failed to delete screenshot:', error);
      throw error;
    }
  }

  // 获取统计信息
  async getStatistics(days = 30) {
    try {
      return await this.database.getStatistics(days);
    } catch (error) {
      console.error('Failed to get statistics:', error);
      throw error;
    }
  }

  // 配置管理
  getConfig(key) {
    return this.store.get(key);
  }

  setConfig(key, value) {
    return this.store.set(key, value);
  }

  getAllConfig() {
    return this.store.store;
  }

  resetConfig() {
    this.store.clear();
  }

  // OCR语言设置
  setOcrLanguage(language) {
    this.ocr.setLanguage(language);
    this.setConfig('ocr.language', language);
  }

  getSupportedLanguages() {
    return this.ocr.getSupportedLanguages();
  }

  // 设置清理任务
  setupCleanupTasks() {
    // 每小时清理临时文件
    setInterval(() => {
      this.ocr.cleanup().catch(error => {
        console.error('OCR cleanup failed:', error);
      });
    }, 60 * 60 * 1000); // 1小时

    // 每天检查是否需要清理旧数据
    setInterval(() => {
      const autoCleanup = this.getConfig('storage.autoCleanup');
      const cleanupDays = this.getConfig('storage.cleanupDays') || 30;

      if (autoCleanup) {
        this.database.cleanOldData(cleanupDays).catch(error => {
          console.error('Auto cleanup failed:', error);
        });
      }
    }, 24 * 60 * 60 * 1000); // 24小时
  }

  // 手动清理旧数据
  async cleanOldData(days) {
    try {
      return await this.database.cleanOldData(days);
    } catch (error) {
      console.error('Failed to clean old data:', error);
      throw error;
    }
  }

  // 关闭所有服务
  async shutdown() {
    try {
      console.log('Shutting down services...');
      
      await this.ocr.cleanup();
      await this.database.close();
      
      this.isInitialized = false;
      console.log('All services shut down');
    } catch (error) {
      console.error('Service shutdown failed:', error);
    }
  }
}

module.exports = ServiceManager;