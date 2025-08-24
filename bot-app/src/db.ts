import Database from "better-sqlite3";
import * as path from "path";
import * as fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "bot.db");

let db: Database.Database;

export function init(): void {
  // Ensure the data directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  // Connect to the database
  db = new Database(DB_PATH);

  // Create the total_stats table for overall statistics
  const createStatsTableQuery = `
        CREATE TABLE IF NOT EXISTS total_stats (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            total_requests INTEGER DEFAULT 0,
            total_tokens INTEGER DEFAULT 0,
            last_updated TEXT
        )
    `;

  // Create the request_logs table for individual request logging
  const createLogsTableQuery = `
        CREATE TABLE IF NOT EXISTS request_logs (
            id INTEGER PRIMARY KEY,
            timestamp TEXT,
            used_tokens INTEGER,
            subject TEXT
        )
    `;

  db.exec(createStatsTableQuery);
  db.exec(createLogsTableQuery);

  // Initialize stats row if it doesn't exist
  const initStatsQuery = `
        INSERT OR IGNORE INTO total_stats (id, total_requests, total_tokens, last_updated)
        VALUES (1, 0, 0, datetime('now'))
    `;
  
  db.exec(initStatsQuery);
  console.log("Database initialized successfully with total statistics tracking");
}

export function addRequest(usedTokens: number, subject: string = "general"): void {
  const timestamp = new Date().toISOString();

  // Insert into request_logs for individual logging
  const insertLogStatement = db.prepare(`
        INSERT INTO request_logs (timestamp, used_tokens, subject)
        VALUES (?, ?, ?)
    `);
  insertLogStatement.run(timestamp, usedTokens, subject);

  // Update total statistics
  const updateStatsStatement = db.prepare(`
        UPDATE total_stats 
        SET total_requests = total_requests + 1,
            total_tokens = total_tokens + ?,
            last_updated = datetime('now')
        WHERE id = 1
    `);
  updateStatsStatement.run(usedTokens);

  console.log(`Request logged: Tokens: ${usedTokens}, Subject: ${subject}`);
}

export function getTotalStats(): { totalRequests: number; totalTokens: number; lastUpdated: string } | null {
  const selectStatement = db.prepare(`
        SELECT total_requests, total_tokens, last_updated
        FROM total_stats
        WHERE id = 1
    `);
  
  const result = selectStatement.get() as any;
  if (result) {
    return {
      totalRequests: result.total_requests,
      totalTokens: result.total_tokens,
      lastUpdated: result.last_updated
    };
  }
  return null;
}
