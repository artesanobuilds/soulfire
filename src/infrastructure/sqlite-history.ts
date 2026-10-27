import type {
  SyntheticAudio,
  SimulationAudioRepository,
  SimulationConfig,
  SimulationRepository,
  SimulationRun,
} from "../domain/simulation";
import {
  simulationScenarios,
  scenarioForRun,
  usesLocalSynthesis,
} from "../domain/simulation";
import type { Message } from "../lib/schema";
import { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { chmodSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { memoryPath } from "./sqlite-memory";
import {
  HistoryError,
  historyEventSchema,
  feedbackSchema,
  redactHistory,
  retentionDays,
  promptVersion,
  type HistoryRepository,
  type HistorySession,
  type HistoryDetail,
  type HistoryInput,
  type Feedback,
} from "../domain/history";
type Row = {
  id: string;
  owner: string;
  created_at: string;
  updated_at: string;
  state: "recording" | "paused";
  synthetic: number;
  scenario: string | null;
  count: number;
};
const clean = (v: unknown) =>
  JSON.parse(
    JSON.stringify(v, (_, x) => (typeof x === "string" ? redactHistory(x) : x)),
  );
export class SqliteHistoryRepository
  implements HistoryRepository, SimulationRepository, SimulationAudioRepository
{
  constructor(
    private file: string,
    private now = () => new Date(),
  ) {}
  private open() {
    mkdirSync(dirname(this.file), { recursive: true, mode: 0o700 });
    const db = new DatabaseSync(this.file);
    try {
      chmodSync(this.file, 0o600);
      db.exec(
        "PRAGMA foreign_keys=ON; PRAGMA secure_delete=ON; PRAGMA journal_mode=DELETE; PRAGMA busy_timeout=3000;",
      );
      const v = Number(
        (db.prepare("PRAGMA user_version").get() as { user_version: number })
          .user_version,
      );
      if (v > 3)
        throw new HistoryError(503, "History database version is unsupported.");
      if (v === 0)
        db.exec(`BEGIN IMMEDIATE;
        CREATE TABLE sessions(id TEXT PRIMARY KEY,owner TEXT NOT NULL,created_at TEXT NOT NULL,updated_at TEXT NOT NULL,state TEXT NOT NULL,synthetic INTEGER NOT NULL,scenario TEXT);
        CREATE INDEX session_owner ON sessions(owner,created_at);
        CREATE TABLE events(id TEXT PRIMARY KEY,session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,event_key TEXT NOT NULL,turn_key TEXT NOT NULL,turn_id TEXT NOT NULL,sequence INTEGER NOT NULL,received_at TEXT NOT NULL,payload TEXT NOT NULL,feedback TEXT,feedback_revision INTEGER NOT NULL DEFAULT 0,UNIQUE(session_id,event_key),UNIQUE(session_id,sequence));
        PRAGMA user_version=1; COMMIT;`);
      if (v <= 1)
        db.exec(
          `BEGIN IMMEDIATE; CREATE TABLE IF NOT EXISTS simulation_runs(id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE, payload TEXT NOT NULL); PRAGMA user_version=2; COMMIT;`,
        );
      if (v <= 2)
        db.exec(`BEGIN IMMEDIATE;
        CREATE TABLE IF NOT EXISTS simulation_audio(session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE, turn INTEGER NOT NULL CHECK(turn BETWEEN 0 AND 3), voice TEXT NOT NULL, version TEXT NOT NULL, bytes BLOB NOT NULL, PRIMARY KEY(session_id,turn));
        PRAGMA user_version=3; COMMIT;`);
      db.prepare("DELETE FROM sessions WHERE created_at < ?").run(
        new Date(this.now().getTime() - retentionDays * 86400000).toISOString(),
      );
      return db;
    } catch (e) {
      db.close();
      throw e;
    }
  }
  private row(db: DatabaseSync, owner: string, id: string) {
    const r = db
      .prepare(
        "SELECT s.*, (SELECT COUNT(*) FROM events e WHERE e.session_id=s.id) AS count FROM sessions s WHERE id=? AND owner=?",
      )
      .get(id, owner) as Row | undefined;
    if (!r)
      throw new HistoryError(404, "Conversation not found or already deleted.");
    return r;
  }
  private summary(r: Row): HistorySession {
    return {
      id: r.id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      state: r.state,
      synthetic: !!r.synthetic,
      scenario: r.scenario,
      schemaVersion: 1,
      consentVersion: 1,
      eventCount: r.count,
    };
  }
  async create(
    owner: string,
    options?: { synthetic: boolean; scenario: string },
  ) {
    const db = this.open();
    try {
      db.exec("BEGIN IMMEDIATE");
      const count = Number(
        (
          db
            .prepare("SELECT COUNT(*) AS n FROM sessions WHERE owner=?")
            .get(owner) as { n: number }
        ).n,
      );
      if (count >= 100)
        throw new HistoryError(
          409,
          "History is full. Delete an older conversation before recording another.",
        );
      const id = randomUUID(),
        time = this.now().toISOString();
      db.prepare("INSERT INTO sessions VALUES(?,?,?,?,?,?,?)").run(
        id,
        owner,
        time,
        time,
        "recording",
        options?.synthetic ? 1 : 0,
        options?.scenario?.slice(0, 100) || null,
      );
      const result = this.summary(this.row(db, owner, id));
      db.exec("COMMIT");
      return result;
    } catch (e) {
      try {
        db.exec("ROLLBACK");
      } catch {}
      throw e;
    } finally {
      db.close();
    }
  }
  async list(owner: string) {
    if (!existsSync(this.file)) return [];
    const db = this.open();
    try {
      return (
        db
          .prepare(
            "SELECT s.*, (SELECT COUNT(*) FROM events e WHERE e.session_id=s.id) AS count FROM sessions s WHERE owner=? ORDER BY created_at DESC LIMIT 100",
          )
          .all(owner) as Row[]
      ).map((r) => this.summary(r));
    } finally {
      db.close();
    }
  }
  async read(owner: string, id: string): Promise<HistoryDetail> {
    if (!existsSync(this.file))
      throw new HistoryError(404, "Conversation not found.");
    const db = this.open();
    try {
      const session = this.summary(this.row(db, owner, id));
      const rows = db
        .prepare("SELECT * FROM events WHERE session_id=? ORDER BY sequence")
        .all(id) as {
        id: string;
        turn_id: string;
        sequence: number;
        received_at: string;
        payload: string;
        feedback: string | null;
        feedback_revision: number;
      }[];
      return {
        session,
        events: rows.map((r) => ({
          ...historyEventSchema.parse(JSON.parse(r.payload)),
          id: r.id,
          turnId: r.turn_id,
          sequence: r.sequence,
          receivedAt: r.received_at,
          feedback: r.feedback
            ? feedbackSchema.parse(JSON.parse(r.feedback))
            : null,
          feedbackRevision: r.feedback_revision,
        })),
      };
    } finally {
      db.close();
    }
  }
  async append(owner: string, id: string, input: HistoryInput[]) {
    if (!input.length || input.length > 10)
      throw new HistoryError(400, "Use one to ten history events.");
    const events = input.map((e) => historyEventSchema.parse(clean(e)));
    if (!existsSync(this.file))
      throw new HistoryError(404, "Conversation not found.");
    const db = this.open();
    try {
      db.exec("BEGIN IMMEDIATE");
      const row = this.row(db, owner, id);
      if (row.state !== "recording")
        throw new HistoryError(
          409,
          "History is paused. New content was not saved.",
        );
      let inserted = 0,
        duplicates = 0,
        count = row.count;
      for (const event of events) {
        const prior = db
          .prepare(
            "SELECT payload FROM events WHERE session_id=? AND event_key=?",
          )
          .get(id, event.eventKey) as { payload: string } | undefined;
        if (prior) {
          if (prior.payload !== JSON.stringify(event))
            throw new HistoryError(
              409,
              "An event key was reused with different content.",
            );
          duplicates++;
          continue;
        }
        if (count >= 200)
          throw new HistoryError(
            409,
            "This conversation reached its history limit. Start a new recording.",
          );
        const turn = db
          .prepare(
            "SELECT turn_id FROM events WHERE session_id=? AND turn_key=? LIMIT 1",
          )
          .get(id, event.turnKey) as { turn_id: string } | undefined;
        db.prepare(
          "INSERT INTO events(id,session_id,event_key,turn_key,turn_id,sequence,received_at,payload) VALUES(?,?,?,?,?,?,?,?)",
        ).run(
          randomUUID(),
          id,
          event.eventKey,
          event.turnKey,
          turn?.turn_id || randomUUID(),
          ++count,
          this.now().toISOString(),
          JSON.stringify(event),
        );
        inserted++;
      }
      db.prepare("UPDATE sessions SET updated_at=? WHERE id=?").run(
        this.now().toISOString(),
        id,
      );
      db.exec("COMMIT");
      return { inserted, duplicates };
    } catch (e) {
      try {
        db.exec("ROLLBACK");
      } catch {}
      throw e;
    } finally {
      db.close();
    }
  }
  async pause(owner: string, id: string) {
    if (!existsSync(this.file))
      throw new HistoryError(404, "Conversation not found.");
    const db = this.open();
    try {
      this.row(db, owner, id);
      db.prepare(
        "UPDATE sessions SET state='paused',updated_at=? WHERE id=? AND owner=?",
      ).run(this.now().toISOString(), id, owner);
    } finally {
      db.close();
    }
  }
  async remove(owner: string, id: string) {
    if (!existsSync(this.file)) return;
    const db = this.open();
    try {
      db.prepare("DELETE FROM sessions WHERE id=? AND owner=?").run(id, owner);
    } finally {
      db.close();
    }
  }
  async feedback(
    owner: string,
    id: string,
    eventId: string,
    value: Feedback,
    revision: number,
  ) {
    const cleanValue = feedbackSchema.parse(clean(value));
    if (!existsSync(this.file))
      throw new HistoryError(404, "Conversation not found.");
    const db = this.open();
    try {
      this.row(db, owner, id);
      const event = db
        .prepare("SELECT payload FROM events WHERE id=? AND session_id=?")
        .get(eventId, id) as { payload: string } | undefined;
      if (!event || JSON.parse(event.payload).role !== "assistant")
        throw new HistoryError(
          400,
          "Feedback belongs to an assistant response.",
        );
      const result = db
        .prepare(
          "UPDATE events SET feedback=?,feedback_revision=feedback_revision+1 WHERE id=? AND session_id=? AND feedback_revision=?",
        )
        .run(JSON.stringify(cleanValue), eventId, id, revision);
      if (!result.changes)
        throw new HistoryError(409, "Feedback changed. Reload before saving.");
    } finally {
      db.close();
    }
  }
  private simulation(
    db: DatabaseSync,
    owner: string,
    id: string,
  ): SimulationRun {
    const session = this.row(db, owner, id);
    if (!session.synthetic)
      throw new HistoryError(403, "This is not a synthetic run.");
    const row = db
      .prepare("SELECT payload FROM simulation_runs WHERE id=?")
      .get(id) as { payload: string } | undefined;
    if (!row) throw new HistoryError(404, "Simulation not found.");
    const run = JSON.parse(row.payload);
    return {
      ...run,
      providerRequests: run.providerRequests || 0,
      audioPending: run.audioPending || [],
    };
  }
  private saveRun(db: DatabaseSync, run: SimulationRun) {
    db.prepare("UPDATE simulation_runs SET payload=? WHERE id=?").run(
      JSON.stringify(run),
      run.id,
    );
  }
  async createRun(owner: string, config: SimulationConfig) {
    const session = await this.create(owner, {
      synthetic: true,
      scenario: config.scenario,
    });
    const run: SimulationRun = {
      id: session.id,
      config,
      scenarioVersion: simulationScenarios.find(
        (s) => s.id === config.scenario,
      )!.version,
      scenarioSnapshot: structuredClone(
        simulationScenarios.find((s) => s.id === config.scenario)!,
      ),
      cursor: 0,
      status: "ready",
      claim: null,
      createdAt: session.createdAt,
      reservedCostUsd: 0,
      providerRequests: 0,
      audioPending: [],
      version: 1,
    };
    const db = this.open();
    try {
      db.prepare("INSERT INTO simulation_runs VALUES(?,?)").run(
        run.id,
        JSON.stringify(run),
      );
      return run;
    } finally {
      db.close();
    }
  }
  async audio(
    owner: string,
    id: string,
    turn: number,
  ): Promise<SyntheticAudio | null> {
    const db = this.open();
    try {
      this.simulation(db, owner, id);
      const row = db
        .prepare(
          "SELECT voice,version,bytes FROM simulation_audio WHERE session_id=? AND turn=?",
        )
        .get(id, turn) as
        | {
            voice: SyntheticAudio["voice"];
            version: SyntheticAudio["version"];
            bytes: Uint8Array;
          }
        | undefined;
      return row ? { ...row, mime: "audio/wav" } : null;
    } finally {
      db.close();
    }
  }
  async saveAudio(
    owner: string,
    id: string,
    turn: number,
    audio: SyntheticAudio,
  ) {
    if (
      !Number.isInteger(turn) ||
      turn < 0 ||
      turn > 3 ||
      audio.bytes.length > 6000000 ||
      audio.bytes.length < 44 ||
      audio.mime !== "audio/wav"
    )
      throw new HistoryError(400, "Synthetic audio exceeds its bounds.");
    const db = this.open();
    try {
      db.exec("BEGIN IMMEDIATE");
      const run = this.simulation(db, owner, id);
      if (run.config.mode !== "voice" || turn >= run.cursor)
        throw new HistoryError(
          409,
          "No finalized synthetic voice turn is available.",
        );
      db.prepare(
        "INSERT OR IGNORE INTO simulation_audio(session_id,turn,voice,version,bytes) VALUES(?,?,?,?,?)",
      ).run(id, turn, audio.voice, audio.version, audio.bytes);
      run.audioPending = (run.audioPending || []).filter((t) => t !== turn);
      this.saveRun(db, run);
      db.exec("COMMIT");
    } catch (e) {
      try {
        db.exec("ROLLBACK");
      } catch {}
      throw e;
    } finally {
      db.close();
    }
  }
  async runs(owner: string) {
    if (!existsSync(this.file)) return [];
    const db = this.open();
    try {
      return (
        db
          .prepare(
            "SELECT r.payload FROM simulation_runs r JOIN sessions s ON s.id=r.id WHERE s.owner=? ORDER BY s.created_at DESC LIMIT 100",
          )
          .all(owner) as { payload: string }[]
      ).map((r) => JSON.parse(r.payload) as SimulationRun);
    } finally {
      db.close();
    }
  }
  async run(owner: string, id: string) {
    const db = this.open();
    try {
      return this.simulation(db, owner, id);
    } finally {
      db.close();
    }
  }
  async claim(owner: string, id: string, cursor: number) {
    const db = this.open();
    try {
      db.exec("BEGIN IMMEDIATE");
      const run = this.simulation(db, owner, id);
      if (run.status !== "ready" || run.cursor !== cursor)
        throw new HistoryError(
          409,
          "Run changed or a turn is already in progress. Reload its state.",
        );
      if (this.now().getTime() - new Date(run.createdAt).getTime() > 600000)
        throw new HistoryError(
          409,
          "This run’s ten-minute window expired. Stop it and start a new run.",
        );
      if (cursor >= 4) throw new HistoryError(409, "Run is complete.");
      run.status = "generating";
      run.claim = randomUUID();
      this.saveRun(db, run);
      db.exec("COMMIT");
      return run;
    } catch (e) {
      try {
        db.exec("ROLLBACK");
      } catch {}
      throw e;
    } finally {
      db.close();
    }
  }
  async reserve(owner: string, id: string, claim: string, cost: number) {
    const db = this.open();
    try {
      db.exec("BEGIN IMMEDIATE");
      const run = this.simulation(db, owner, id);
      if (run.claim !== claim || run.status !== "generating")
        throw new HistoryError(409, "Simulation was interrupted.");
      if (
        !Number.isFinite(cost) ||
        cost < 0 ||
        run.reservedCostUsd + cost > run.config.maxCostUsd
      )
        throw new HistoryError(
          409,
          "The configured simulation cost estimate limit was reached.",
        );
      if (run.providerRequests >= 4)
        throw new HistoryError(
          409,
          "The four-request simulation limit was reached.",
        );
      run.providerRequests++;
      run.reservedCostUsd += cost;
      this.saveRun(db, run);
      db.exec("COMMIT");
    } catch (e) {
      try {
        db.exec("ROLLBACK");
      } catch {}
      throw e;
    } finally {
      db.close();
    }
  }
  async finish(
    owner: string,
    id: string,
    claim: string,
    message: Message,
    model: string,
  ) {
    const db = this.open();
    try {
      db.exec("BEGIN IMMEDIATE");
      const run = this.simulation(db, owner, id),
        session = this.row(db, owner, id);
      if (
        run.claim !== claim ||
        run.status !== "generating" ||
        session.state !== "recording"
      )
        throw new HistoryError(
          409,
          "Simulation stopped; late output was not saved.",
        );
      const expected = run.cursor % 2 === 0 ? "user" : "assistant";
      if (message.role !== expected)
        throw new HistoryError(400, "Unexpected simulation turn role.");
      const event = historyEventSchema.parse(
        clean({
          eventKey: `simulation:${run.cursor}`,
          turnKey: `simulation-pair:${Math.floor(run.cursor / 2)}`,
          kind: "message",
          channel: run.config.mode,
          role: message.role,
          text: message.content,
          clientOrder: run.cursor,
          provenance: {
            source:
              run.config.engine === "fixture" ? "fixture" : "live-synthetic",
            model,
            promptVersion: "synthetic-v1",
            applicationVersion: promptVersion,
            scenarioVersion: run.scenarioVersion || 1,
            playback:
              run.config.mode === "voice" ? "unknown" : "not-applicable",
          },
        }),
      );
      const paired = db
        .prepare(
          "SELECT turn_id FROM events WHERE session_id=? AND turn_key=? LIMIT 1",
        )
        .get(id, event.turnKey) as { turn_id: string } | undefined;
      db.prepare(
        "INSERT INTO events(id,session_id,event_key,turn_key,turn_id,sequence,received_at,payload) VALUES(?,?,?,?,?,?,?,?)",
      ).run(
        randomUUID(),
        id,
        event.eventKey,
        event.turnKey,
        paired?.turn_id || randomUUID(),
        session.count + 1,
        this.now().toISOString(),
        JSON.stringify(event),
      );
      if (usesLocalSynthesis(run))
        run.audioPending = [...(run.audioPending || []), run.cursor];
      run.cursor++;
      run.claim = null;
      run.status =
        run.cursor === scenarioForRun(run).turns.length ? "completed" : "ready";
      this.saveRun(db, run);
      db.prepare("UPDATE sessions SET updated_at=?,state=? WHERE id=?").run(
        this.now().toISOString(),
        run.status === "completed" ? "paused" : "recording",
        id,
      );
      db.exec("COMMIT");
      return run;
    } catch (e) {
      try {
        db.exec("ROLLBACK");
      } catch {}
      throw e;
    } finally {
      db.close();
    }
  }
  async control(
    owner: string,
    id: string,
    action: "pause" | "resume" | "stop" | "fail",
  ) {
    const db = this.open();
    try {
      db.exec("BEGIN IMMEDIATE");
      const run = this.simulation(db, owner, id);
      if (["completed", "stopped", "failed"].includes(run.status)) {
        db.exec("COMMIT");
        return run;
      }
      if (action === "pause" && run.status === "paused") {
        db.exec("COMMIT");
        return run;
      }
      if (action === "resume" && run.status !== "paused")
        throw new HistoryError(409, "Only a paused run can resume.");
      run.claim = null;
      run.status =
        action === "resume"
          ? "ready"
          : action === "pause"
            ? "paused"
            : action === "fail"
              ? "failed"
              : "stopped";
      this.saveRun(db, run);
      if (action !== "resume") {
        const session = this.row(db, owner, id);
        const event = historyEventSchema.parse({
          eventKey: randomUUID(),
          turnKey: "simulation-control",
          kind:
            action === "fail"
              ? "error"
              : action === "stop"
                ? "canceled"
                : "interrupted",
          channel: run.config.mode,
          provenance: {
            source:
              run.config.engine === "fixture" ? "fixture" : "live-synthetic",
            model: "application",
            promptVersion: "synthetic-v1",
            applicationVersion: promptVersion,
            scenarioVersion: run.scenarioVersion || 1,
            playback: action === "pause" ? "interrupted" : "not-applicable",
          },
        });
        if (session.count < 200)
          db.prepare(
            "INSERT INTO events(id,session_id,event_key,turn_key,turn_id,sequence,received_at,payload) VALUES(?,?,?,?,?,?,?,?)",
          ).run(
            randomUUID(),
            id,
            event.eventKey,
            event.turnKey,
            randomUUID(),
            session.count + 1,
            this.now().toISOString(),
            JSON.stringify(event),
          );
      }
      if (action === "stop" || action === "fail")
        db.prepare("UPDATE sessions SET state='paused' WHERE id=?").run(id);
      db.exec("COMMIT");
      return run;
    } catch (e) {
      try {
        db.exec("ROLLBACK");
      } catch {}
      throw e;
    } finally {
      db.close();
    }
  }
}
export const localHistory = () =>
  new SqliteHistoryRepository(join(dirname(memoryPath()), "history.sqlite"));
