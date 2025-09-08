import { Database as SQLiteDatabase } from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { app } from 'electron';
import { Screenshot, TextContent, Statistics, WindowInfo } from '../common/types';

export class Database {
  private db: SQLiteDatabase | null = null;
  private dbPath: string;
  private isInitialized: boolean = false;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'screenwatcher.db');
  }

  // 初始化数据库
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      this.db = new SQLiteDatabase(this.dbPath, (err) => {
        if (err) {
          console.error('Database connection failed:', err);
          reject(err);
          return;
        }

        this.createTables()
          .then(() => {
            this.isInitialized = true;
            console.log('Database initialized successfully');
            resolve();
          })
          .catch(reject);
      });
    });
  }

  // 创建数据表
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not connected');

    const run = promisify(this.db.run.bind(this.db));

    // 截图记录表
    await run(`
      CREATE TABLE IF NOT EXISTS screenshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp DATETIME NOT NULL,
        window_title TEXT,
        app_name TEXT,
        image_path TEXT,
        image_data TEXT,
        content_hash TEXT UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 文本内容表
    await run(`
      CREATE TABLE IF NOT EXISTS text_contents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        screenshot_id INTEGER,
        content TEXT NOT NULL,
        bounding_box TEXT,
        confidence REAL,
        language TEXT,
        word_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (screenshot_id) REFERENCES screenshots(id) ON DELETE CASCADE
      )
    `);

    // 关键词表
    await run(`
      CREATE TABLE IF NOT EXISTS keywords (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL UNIQUE,
        priority INTEGER DEFAULT 1,
        color TEXT DEFAULT '#FF6B6B',
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 分析结果表
    await run(`
      CREATE TABLE IF NOT EXISTS analysis_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_id INTEGER,
        analysis_type TEXT,
        result_data TEXT,
        confidence REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (content_id) REFERENCES text_contents(id) ON DELETE CASCADE
      )
    `);

    // 应用统计表
    await run(`
      CREATE TABLE IF NOT EXISTS app_statistics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_name TEXT NOT NULL,
        capture_count INTEGER DEFAULT 1,
        text_count INTEGER DEFAULT 0,
        last_capture DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(app_name)
      )
    `);

    // 创建索引以优化查询性能
    await run('CREATE INDEX IF NOT EXISTS idx_screenshots_timestamp ON screenshots(timestamp)');
    await run('CREATE INDEX IF NOT EXISTS idx_screenshots_hash ON screenshots(content_hash)');
    await run('CREATE INDEX IF NOT EXISTS idx_text_content_screenshot ON text_contents(screenshot_id)');
    await run('CREATE INDEX IF NOT EXISTS idx_text_content_created ON text_contents(created_at)');
    await run('CREATE INDEX IF NOT EXISTS idx_keywords_active ON keywords(is_active)');

    // 创建全文搜索索引（FTS5）
    await run(`
      CREATE VIRTUAL TABLE IF NOT EXISTS text_search 
      USING fts5(content, app_name, window_title, content=text_contents)
    `);

    // 创建触发器以保持 FTS 表同步
    await run(`
      CREATE TRIGGER IF NOT EXISTS text_contents_ai 
      AFTER INSERT ON text_contents BEGIN
        INSERT INTO text_search(rowid, content, app_name, window_title) 
        SELECT 
          new.id, 
          new.content, 
          (SELECT app_name FROM screenshots WHERE id = new.screenshot_id),
          (SELECT window_title FROM screenshots WHERE id = new.screenshot_id);
      END
    `);

    await run(`
      CREATE TRIGGER IF NOT EXISTS text_contents_ad 
      AFTER DELETE ON text_contents BEGIN
        DELETE FROM text_search WHERE rowid = old.id;
      END
    `);
  }

  // 保存截图
  async saveScreenshot(screenshot: Omit<Screenshot, 'id' | 'createdAt'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));

    // 检查是否已存在相同内容哈希的截图
    const existing = await this.getScreenshotByHash(screenshot.contentHash);
    if (existing) {
      return existing.id;
    }

    const result = await run(`
      INSERT INTO screenshots (timestamp, window_title, app_name, image_path, content_hash)
      VALUES (?, ?, ?, ?, ?)
    `, [
      screenshot.timestamp.toISOString(),
      screenshot.windowTitle,
      screenshot.appName,
      screenshot.imagePath,
      screenshot.contentHash
    ]);

    // 更新应用统计
    await this.updateAppStatistics(screenshot.appName || 'Unknown', 1, 0);

    return (result as any).lastID;
  }

  // 保存文本内容
  async saveTextContent(textContent: Omit<TextContent, 'id' | 'createdAt'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));

    const wordCount = textContent.content.trim().split(/\s+/).length;
    const boundingBoxJson = textContent.boundingBox ? JSON.stringify(textContent.boundingBox) : null;

    const result = await run(`
      INSERT INTO text_contents (screenshot_id, content, bounding_box, confidence, language, word_count)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      textContent.screenshotId,
      textContent.content,
      boundingBoxJson,
      textContent.confidence,
      textContent.language,
      wordCount
    ]);

    // 更新应用统计中的文本数量
    const screenshot = await this.getScreenshotById(textContent.screenshotId);
    if (screenshot) {
      await this.updateAppStatistics(screenshot.appName || 'Unknown', 0, 1);
    }

    return (result as any).lastID;
  }

  // 根据哈希获取截图
  async getScreenshotByHash(contentHash: string): Promise<Screenshot | null> {
    if (!this.db) throw new Error('Database not initialized');

    const get = promisify(this.db.get.bind(this.db));

    const row = await get(
      'SELECT * FROM screenshots WHERE content_hash = ?',
      [contentHash]
    ) as any;

    return row ? this.mapScreenshotRow(row) : null;
  }

  // 根据 ID 获取截图
  async getScreenshotById(id: number): Promise<Screenshot | null> {
    if (!this.db) throw new Error('Database not initialized');

    const get = promisify(this.db.get.bind(this.db));

    const row = await get(
      'SELECT * FROM screenshots WHERE id = ?',
      [id]
    ) as any;

    return row ? this.mapScreenshotRow(row) : null;
  }

  // 搜索文本内容
  async searchTextContent(query: string, options: {
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
    appName?: string;
  } = {}): Promise<{
    results: (TextContent & { screenshot: Screenshot })[];
    total: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    const { limit = 50, offset = 0, startDate, endDate, appName } = options;
    const all = promisify(this.db.all.bind(this.db));
    const get = promisify(this.db.get.bind(this.db));

    // 构建搜索条件
    let whereClause = '';
    const params: any[] = [query];

    if (startDate || endDate || appName) {
      const conditions: string[] = [];
      
      if (startDate) {
        conditions.push('s.timestamp >= ?');
        params.push(startDate.toISOString());
      }
      
      if (endDate) {
        conditions.push('s.timestamp <= ?');
        params.push(endDate.toISOString());
      }
      
      if (appName) {
        conditions.push('s.app_name = ?');
        params.push(appName);
      }

      if (conditions.length > 0) {
        whereClause = ' AND ' + conditions.join(' AND ');
      }
    }

    // 执行搜索查询
    const searchQuery = `
      SELECT 
        tc.*,
        s.timestamp as screenshot_timestamp,
        s.window_title,
        s.app_name,
        s.image_path,
        s.content_hash,
        s.created_at as screenshot_created_at,
        ts.rank
      FROM text_search ts
      JOIN text_contents tc ON ts.rowid = tc.id
      JOIN screenshots s ON tc.screenshot_id = s.id
      WHERE text_search MATCH ?${whereClause}
      ORDER BY ts.rank DESC
      LIMIT ? OFFSET ?
    `;

    const results = await all(searchQuery, [...params, limit, offset]) as any[];

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM text_search ts
      JOIN text_contents tc ON ts.rowid = tc.id
      JOIN screenshots s ON tc.screenshot_id = s.id
      WHERE text_search MATCH ?${whereClause}
    `;

    const countResult = await get(countQuery, params.slice(0, -2)) as any;

    return {
      results: results.map(row => ({
        ...this.mapTextContentRow(row),
        screenshot: this.mapScreenshotRow({
          id: row.screenshot_id,
          timestamp: row.screenshot_timestamp,
          window_title: row.window_title,
          app_name: row.app_name,
          image_path: row.image_path,
          content_hash: row.content_hash,
          created_at: row.screenshot_created_at,
        }),
      })),
      total: countResult.total,
    };
  }

  // 获取统计信息
  async getStatistics(timeRange: { start: Date; end: Date }): Promise<Statistics> {
    if (!this.db) throw new Error('Database not initialized');

    const get = promisify(this.db.get.bind(this.db));
    const all = promisify(this.db.all.bind(this.db));

    const startISO = timeRange.start.toISOString();
    const endISO = timeRange.end.toISOString();

    // 今日截图数
    const todayCaptures = await get(`
      SELECT COUNT(*) as count 
      FROM screenshots 
      WHERE timestamp >= ? AND timestamp <= ?
    `, [startISO, endISO]) as any;

    // 今日文本数
    const todayTexts = await get(`
      SELECT COUNT(*) as count 
      FROM text_contents tc
      JOIN screenshots s ON tc.screenshot_id = s.id
      WHERE s.timestamp >= ? AND s.timestamp <= ?
    `, [startISO, endISO]) as any;

    // 总文本数
    const totalTexts = await get('SELECT COUNT(*) as count FROM text_contents') as any;

    // 平均置信度
    const avgConfidence = await get(`
      SELECT AVG(confidence) as avg 
      FROM text_contents tc
      JOIN screenshots s ON tc.screenshot_id = s.id
      WHERE s.timestamp >= ? AND s.timestamp <= ?
    `, [startISO, endISO]) as any;

    // 热门应用
    const topApps = await all(`
      SELECT app_name, COUNT(*) as count
      FROM screenshots
      WHERE timestamp >= ? AND timestamp <= ?
        AND app_name IS NOT NULL
      GROUP BY app_name
      ORDER BY count DESC
      LIMIT 5
    `, [startISO, endISO]) as any[];

    return {
      todayCaptures: todayCaptures.count,
      todayTexts: todayTexts.count,
      totalTexts: totalTexts.count,
      averageConfidence: Math.round((avgConfidence.avg || 0) * 100) / 100,
      topApps: topApps.map(app => ({
        appName: app.app_name,
        count: app.count,
      })),
    };
  }

  // 更新应用统计
  private async updateAppStatistics(appName: string, captureIncrement: number, textIncrement: number): Promise<void> {
    if (!this.db) return;

    const run = promisify(this.db.run.bind(this.db));

    await run(`
      INSERT INTO app_statistics (app_name, capture_count, text_count, last_capture)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(app_name) DO UPDATE SET
        capture_count = capture_count + ?,
        text_count = text_count + ?,
        last_capture = CURRENT_TIMESTAMP
    `, [appName, captureIncrement, textIncrement, captureIncrement, textIncrement]);
  }

  // 清理旧数据
  async cleanupOldData(retentionDays: number): Promise<{ deletedScreenshots: number; deletedTexts: number }> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // 删除旧截图（级联删除会自动删除相关文本）
    const result = await run(`
      DELETE FROM screenshots 
      WHERE created_at < ?
    `, [cutoffDate.toISOString()]) as any;

    // 清理 FTS 表中的孤儿记录
    await run('DELETE FROM text_search WHERE rowid NOT IN (SELECT id FROM text_contents)');

    // 清理应用统计中长时间未活跃的应用
    await run(`
      DELETE FROM app_statistics 
      WHERE last_capture < ? AND capture_count < 10
    `, [cutoffDate.toISOString()]);

    return {
      deletedScreenshots: result.changes,
      deletedTexts: 0, // 级联删除，无法单独统计
    };
  }

  // 数据库优化
  async optimize(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run.bind(this.db));

    // 执行 VACUUM 以压缩数据库
    await run('VACUUM');

    // 重建 FTS 索引
    await run('INSERT INTO text_search(text_search) VALUES("rebuild")');

    // 更新统计信息
    await run('ANALYZE');
  }

  // 导出数据
  async exportData(format: 'json' | 'csv' = 'json'): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const all = promisify(this.db.all.bind(this.db));

    const data = await all(`
      SELECT 
        s.timestamp,
        s.window_title,
        s.app_name,
        tc.content,
        tc.confidence,
        tc.language,
        tc.word_count
      FROM screenshots s
      LEFT JOIN text_contents tc ON s.id = tc.screenshot_id
      ORDER BY s.timestamp DESC
    `) as any[];

    if (format === 'json') {
      return JSON.stringify(data, null, 2);
    } else {
      // CSV 格式
      if (data.length === 0) return '';

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => 
            JSON.stringify(row[header] || '')
          ).join(',')
        )
      ].join('\n');

      return csvContent;
    }
  }

  // 映射截图行数据
  private mapScreenshotRow(row: any): Screenshot {
    return {
      id: row.id,
      timestamp: new Date(row.timestamp),
      windowTitle: row.window_title,
      appName: row.app_name,
      imagePath: row.image_path,
      contentHash: row.content_hash,
      createdAt: new Date(row.created_at),
    };
  }

  // 映射文本内容行数据
  private mapTextContentRow(row: any): TextContent {
    return {
      id: row.id,
      screenshotId: row.screenshot_id,
      content: row.content,
      boundingBox: row.bounding_box ? JSON.parse(row.bounding_box) : undefined,
      confidence: row.confidence,
      language: row.language,
      createdAt: new Date(row.created_at),
    };
  }

  // 关闭数据库连接
  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.db = null;
            this.isInitialized = false;
            resolve();
          }
        });
      });
    }
  }
}