import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

const migrationsDirectory = new URL("../../drizzle/", import.meta.url);
const migration = readdirSync(migrationsDirectory)
  .filter((fileName) => /^\d+.*\.sql$/.test(fileName))
  .sort()
  .map((fileName) => readFileSync(new URL(fileName, migrationsDirectory), "utf8"))
  .join("\n")
  .replaceAll("--> statement-breakpoint", "");

class TestPreparedStatement {
  constructor(database, sql, values = []) {
    this.database = database;
    this.sql = sql;
    this.values = values;
  }

  bind(...values) {
    return new TestPreparedStatement(this.database, this.sql, values);
  }

  async all() {
    const results = this.database.prepare(this.sql).all(...this.values);
    return { success: true, results };
  }

  async first(column) {
    const row = this.database.prepare(this.sql).get(...this.values) || null;
    return column && row ? row[column] : row;
  }

  async run() {
    const result = this.database.prepare(this.sql).run(...this.values);
    return { success: true, meta: { changes: Number(result.changes || 0) } };
  }
}

export function createTestDatabase() {
  const sqlite = new DatabaseSync(":memory:");
  sqlite.exec("PRAGMA foreign_keys = ON");
  sqlite.exec(migration);
  return {
    prepare(sql) {
      return new TestPreparedStatement(sqlite, sql);
    },
    async batch(statements) {
      sqlite.exec("BEGIN");
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        sqlite.exec("COMMIT");
        return results;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
    close() {
      sqlite.close();
    },
  };
}
