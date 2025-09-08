const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = null;
    this.isInitialized = false;
  }

  // 初始化数据库
  async initialize() {
    if (this.isInitialized) return;

    try {
      // 确定数据库文件路径
      const userDataPath = app.getPath('userData');
      const dbDir = path.join(userDataPath, 'ScreenWatcher');
      
      // 确保目录存在
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.dbPath = path.join(dbDir, 'screenwatcher.db');
      console.log('Database path:', this.dbPath);

      // 创建或打开数据库连接
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          throw err;
        }
        console.log('Connected to SQLite database');
      });

      // 创建表结构
      await this.createTables();
      
      this.isInitialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  // 创建表结构
  createTables() {
    return new Promise((resolve, reject) => {
      const createTablesSQL = `
        -- 截图表
        CREATE TABLE IF NOT EXISTS screenshots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          image_data TEXT NOT NULL,
          source_name TEXT,
          source_id TEXT,
          file_path TEXT,
          timestamp INTEGER NOT NULL,
          width INTEGER,
          height INTEGER,
          file_size INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- OCR结果表
        CREATE TABLE IF NOT EXISTS ocr_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          screenshot_id INTEGER NOT NULL,
          text_content TEXT,
          confidence REAL,
          language TEXT DEFAULT 'en',
          processing_time INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (screenshot_id) REFERENCES screenshots(id) ON DELETE CASCADE
        );

        -- OCR文本块表（用于存储位置信息）
        CREATE TABLE IF NOT EXISTS ocr_text_blocks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ocr_result_id INTEGER NOT NULL,
          text TEXT,
          confidence REAL,
          x INTEGER,
          y INTEGER,
          width INTEGER,
          height INTEGER,
          line_number INTEGER,
          word_number INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ocr_result_id) REFERENCES ocr_results(id) ON DELETE CASCADE
        );

        -- 应用设置表
        CREATE TABLE IF NOT EXISTS app_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          type TEXT DEFAULT 'string',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- 统计信息表
        CREATE TABLE IF NOT EXISTS statistics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          screenshots_count INTEGER DEFAULT 0,
          ocr_processed_count INTEGER DEFAULT 0,
          total_text_length INTEGER DEFAULT 0,
          processing_time_total INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(date)
        );

        -- 创建索引
        CREATE INDEX IF NOT EXISTS idx_screenshots_timestamp ON screenshots(timestamp);
        CREATE INDEX IF NOT EXISTS idx_screenshots_source ON screenshots(source_name);
        CREATE INDEX IF NOT EXISTS idx_ocr_results_screenshot_id ON ocr_results(screenshot_id);
        CREATE INDEX IF NOT EXISTS idx_ocr_text_content ON ocr_results(text_content);
        CREATE INDEX IF NOT EXISTS idx_statistics_date ON statistics(date);

        -- 创建全文搜索表
        CREATE VIRTUAL TABLE IF NOT EXISTS ocr_search USING fts5(
          text_content,
          screenshot_id,
          timestamp
        );
      `;

      this.db.exec(createTablesSQL, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('Database tables created successfully');
          resolve();
        }
      });
    });
  }

  // 保存截图
  async saveScreenshot(screenshotData) {
    return new Promise((resolve, reject) => {
      const {
        imageData,
        sourceName,
        sourceId,
        filePath,
        timestamp,
        width,
        height,
        fileSize
      } = screenshotData;

      const sql = `
        INSERT INTO screenshots (image_data, source_name, source_id, file_path, timestamp, width, height, file_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [imageData, sourceName, sourceId, filePath, timestamp, width, height, fileSize], function(err) {
        if (err) {
          console.error('Error saving screenshot:', err);
          reject(err);
        } else {
          console.log('Screenshot saved with ID:', this.lastID);
          resolve(this.lastID);
        }
      });
    });
  }

  // 保存OCR结果
  async saveOcrResult(ocrData) {
    return new Promise((resolve, reject) => {
      const {
        screenshotId,
        textContent,
        confidence,
        language,
        processingTime,
        textBlocks
      } = ocrData;

      const sql = `
        INSERT INTO ocr_results (screenshot_id, text_content, confidence, language, processing_time)
        VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [screenshotId, textContent, confidence, language, processingTime], function(err) {
        if (err) {
          console.error('Error saving OCR result:', err);
          reject(err);
          return;
        }

        const ocrResultId = this.lastID;
        console.log('OCR result saved with ID:', ocrResultId);

        // 保存文本块
        if (textBlocks && textBlocks.length > 0) {
          this.saveTextBlocks(ocrResultId, textBlocks)
            .then(() => {
              // 更新全文搜索表
              return this.updateSearchIndex(textContent, screenshotId, Date.now());
            })
            .then(() => resolve(ocrResultId))
            .catch(reject);
        } else {
          // 更新全文搜索表
          this.updateSearchIndex(textContent, screenshotId, Date.now())
            .then(() => resolve(ocrResultId))
            .catch(reject);
        }
      }.bind(this));
    });
  }

  // 保存OCR文本块
  async saveTextBlocks(ocrResultId, textBlocks) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO ocr_text_blocks (ocr_result_id, text, confidence, x, y, width, height, line_number, word_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const stmt = this.db.prepare(sql);
      
      let completed = 0;
      let hasError = false;

      textBlocks.forEach((block, index) => {
        stmt.run([
          ocrResultId,
          block.text,
          block.confidence,
          block.x,
          block.y,
          block.width,
          block.height,
          block.lineNumber || index,
          block.wordNumber || index
        ], (err) => {
          if (err && !hasError) {
            hasError = true;
            stmt.finalize();
            reject(err);
            return;
          }

          completed++;
          if (completed === textBlocks.length && !hasError) {
            stmt.finalize();
            resolve();
          }
        });
      });
    });
  }

  // 更新搜索索引
  async updateSearchIndex(textContent, screenshotId, timestamp) {
    return new Promise((resolve, reject) => {
      const sql = `INSERT INTO ocr_search (text_content, screenshot_id, timestamp) VALUES (?, ?, ?)`;
      
      this.db.run(sql, [textContent, screenshotId, timestamp], (err) => {
        if (err) {
          console.error('Error updating search index:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  // 获取截图列表
  async getScreenshots(filters = {}) {
    return new Promise((resolve, reject) => {
      const { limit = 100, offset = 0, startDate, endDate, sourceName } = filters;
      
      let sql = `
        SELECT s.*, o.text_content, o.confidence as ocr_confidence
        FROM screenshots s
        LEFT JOIN ocr_results o ON s.id = o.screenshot_id
        WHERE 1=1
      `;
      
      const params = [];

      if (startDate) {
        sql += ' AND s.timestamp >= ?';
        params.push(startDate);
      }

      if (endDate) {
        sql += ' AND s.timestamp <= ?';
        params.push(endDate);
      }

      if (sourceName) {
        sql += ' AND s.source_name LIKE ?';
        params.push(`%${sourceName}%`);
      }

      sql += ' ORDER BY s.timestamp DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Error getting screenshots:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 搜索OCR文本
  async searchOcrText(query, limit = 50) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT s.*, o.text_content, o.confidence, 
               highlight(ocr_search, 0, '<mark>', '</mark>') as highlighted_text
        FROM ocr_search
        JOIN screenshots s ON s.id = ocr_search.screenshot_id
        JOIN ocr_results o ON o.screenshot_id = s.id
        WHERE ocr_search MATCH ?
        ORDER BY rank
        LIMIT ?
      `;

      this.db.all(sql, [query, limit], (err, rows) => {
        if (err) {
          console.error('Error searching OCR text:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  // 获取统计信息
  async getStatistics(days = 30) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          COUNT(s.id) as total_screenshots,
          COUNT(o.id) as total_ocr_results,
          AVG(o.confidence) as avg_confidence,
          SUM(LENGTH(o.text_content)) as total_text_length,
          MIN(s.timestamp) as first_screenshot,
          MAX(s.timestamp) as last_screenshot,
          COUNT(DISTINCT s.source_name) as unique_sources
        FROM screenshots s
        LEFT JOIN ocr_results o ON s.id = o.screenshot_id
        WHERE s.timestamp >= ?
      `;

      const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);

      this.db.get(sql, [cutoffDate], (err, row) => {
        if (err) {
          console.error('Error getting statistics:', err);
          reject(err);
        } else {
          resolve(row || {});
        }
      });
    });
  }

  // 删除截图
  async deleteScreenshot(id) {
    return new Promise((resolve, reject) => {
      const sql = `DELETE FROM screenshots WHERE id = ?`;
      
      this.db.run(sql, [id], function(err) {
        if (err) {
          console.error('Error deleting screenshot:', err);
          reject(err);
        } else {
          console.log('Screenshot deleted:', id);
          resolve(this.changes);
        }
      });
    });
  }

  // 清理旧数据
  async cleanOldData(days = 30) {
    return new Promise((resolve, reject) => {
      const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
      const sql = `DELETE FROM screenshots WHERE timestamp < ?`;
      
      this.db.run(sql, [cutoffDate], function(err) {
        if (err) {
          console.error('Error cleaning old data:', err);
          reject(err);
        } else {
          console.log('Cleaned old screenshots:', this.changes);
          resolve(this.changes);
        }
      });
    });
  }

  // 关闭数据库连接
  async close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('Database connection closed');
          }
          this.db = null;
          this.isInitialized = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = DatabaseService;