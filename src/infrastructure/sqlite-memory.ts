import { DatabaseSync } from "node:sqlite";
import { chmodSync, existsSync, mkdirSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { homedir } from "node:os";
import {
  MemoryConflict,
  memoryContentSchema,
  memoryRecordSchema,
  type MemoryContent,
  type MemoryRepository,
  type MemorySnapshot,
} from "../domain/memory";

export function memoryPath() {
  const folder = resolve(
    process.env.SOULFIRE_DATA_DIR ||
      join(homedir(), "Library", "Application Support", "soulfire"),
  );
  let ancestor = folder;
  while (!existsSync(ancestor)) ancestor = dirname(ancestor);
  const base = join(realpathSync(ancestor), relative(ancestor, folder));
  const rel = relative(realpathSync(process.cwd()), base);
  if (!rel || (!rel.startsWith("..") && !isAbsolute(rel)))
    throw new Error("Memory storage must be outside the project.");
  return join(folder, "memory.sqlite");
}

// One local profile. This is deliberately not an authentication/account system.
// Async contract allows a transactional Postgres adapter without a UI/API rewrite.
export class SqliteMemoryRepository implements MemoryRepository {
  constructor(private readonly file: string) {}
  private open() {
    mkdirSync(dirname(this.file), { recursive: true, mode: 0o700 });
    const db = new DatabaseSync(this.file);
    chmodSync(this.file, 0o600);
    db.exec(
      "PRAGMA busy_timeout=3000; PRAGMA secure_delete=ON; PRAGMA journal_mode=DELETE;",
    );
    const version = Number(
      (db.prepare("PRAGMA user_version").get() as { user_version: number })
        .user_version,
    );
    if (version > 1) {
      db.close();
      throw new Error("Unsupported memory database version.");
    }
    if (version === 0) {
      db.exec(`BEGIN IMMEDIATE;
        CREATE TABLE IF NOT EXISTS profile (id INTEGER PRIMARY KEY CHECK(id=1), revision INTEGER NOT NULL, payload TEXT);
        INSERT OR IGNORE INTO profile VALUES (1,0,NULL);
        PRAGMA user_version=1;
        COMMIT;`);
    }
    return db;
  }
  private snapshot(db: DatabaseSync): MemorySnapshot {
    const row = db
      .prepare("SELECT revision,payload FROM profile WHERE id=1")
      .get() as { revision: number; payload: string | null };
    return {
      revision: row.revision,
      memory: row.payload
        ? memoryRecordSchema.parse(JSON.parse(row.payload))
        : null,
    };
  }
  async read() {
    if (!existsSync(this.file)) return { revision: 0, memory: null };
    const db = this.open();
    try {
      return this.snapshot(db);
    } finally {
      db.close();
    }
  }
  private change(content: MemoryContent | null, expectedRevision: number) {
    const db = this.open();
    try {
      db.exec("BEGIN IMMEDIATE");
      const prior = this.snapshot(db);
      if (prior.revision !== expectedRevision) throw new MemoryConflict();
      const revision = prior.revision + 1;
      const memory = content
        ? memoryRecordSchema.parse({
            schemaVersion: 1,
            revision,
            source: "user_confirmed",
            updatedAt: new Date().toISOString(),
            content,
          })
        : null;
      db.prepare("UPDATE profile SET revision=?, payload=? WHERE id=1").run(
        revision,
        memory ? JSON.stringify(memory) : null,
      );
      db.exec("COMMIT");
      return { revision, memory };
    } catch (error) {
      try {
        db.exec("ROLLBACK");
      } catch {
        /* Preserve the original failure. */
      }
      throw error;
    } finally {
      db.close();
    }
  }
  async replace(content: MemoryContent, expectedRevision: number) {
    return this.change(memoryContentSchema.parse(content), expectedRevision);
  }
  async delete(expectedRevision: number) {
    // Keep a content-free revision tombstone so a late save cannot resurrect data.
    return this.change(null, expectedRevision);
  }
}
export const localMemory = () => new SqliteMemoryRepository(memoryPath());
