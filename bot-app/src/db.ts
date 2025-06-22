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

  // Create the requests table if it doesn't exist
  const createTableQuery = `
        CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY,
            user_id TEXT,
            timestamp TEXT,
            used_tokens INTEGER
        )
    `;

  db.exec(createTableQuery);
  console.log("Database initialized successfully");
}

export function addRequest(userId: string, usedTokens: number): void {
  const timestamp = new Date().toISOString();

  const insertStatement = db.prepare(`
        INSERT INTO requests (user_id, timestamp, used_tokens)
        VALUES (?, ?, ?)
    `);

  insertStatement.run(userId, timestamp, usedTokens);
  console.log(`Request logged: User ${userId}, Tokens: ${usedTokens}`);
}
