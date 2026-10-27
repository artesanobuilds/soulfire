import { scenarioCatalogSchema, type SimulationScenario } from "./scenario";
import { z } from "zod";
import scenarios from "../../simulations/scenarios.json";
import type { Message } from "../lib/schema";
export const simulationVersion = "synthetic-v1";
export const simulationScenarios = scenarioCatalogSchema.parse(scenarios);
export const simulationConfigSchema = z
  .object({
    scenario: z.enum(
      simulationScenarios.map((s) => s.id) as [string, ...string[]],
    ),
    mode: z.enum(["text", "voice"]),
    delivery: z.enum(["witnessed", "background"]),
    engine: z.enum(["fixture", "live-text"]),
    allowPaid: z.boolean().default(false),
    maxCostUsd: z.number().min(0).max(0.25).default(0),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.engine === "live-text" && (!v.allowPaid || v.maxCostUsd <= 0))
      c.addIssue({
        code: "custom",
        message:
          "Model-generated simulations need explicit paid consent and a budget.",
      });
  });
export type SimulationConfig = z.infer<typeof simulationConfigSchema>;
export type SimulationRun = {
  id: string;
  config: SimulationConfig;
  cursor: number;
  status:
    "ready" | "generating" | "paused" | "completed" | "stopped" | "failed";
  claim: string | null;
  createdAt: string;
  reservedCostUsd: number;
  providerRequests: number;
  audioPending?: number[];
  scenarioVersion?: number;
  scenarioSnapshot?: SimulationScenario;
  version: 1;
};
export interface SimulationRepository {
  createRun(owner: string, config: SimulationConfig): Promise<SimulationRun>;
  runs(owner: string): Promise<SimulationRun[]>;
  run(owner: string, id: string): Promise<SimulationRun>;
  claim(owner: string, id: string, cursor: number): Promise<SimulationRun>;
  reserve(
    owner: string,
    id: string,
    claim: string,
    cost: number,
  ): Promise<void>;
  finish(
    owner: string,
    id: string,
    claim: string,
    message: Message,
    model: string,
  ): Promise<SimulationRun>;
  control(
    owner: string,
    id: string,
    action: "pause" | "resume" | "stop" | "fail",
  ): Promise<SimulationRun>;
}
export interface SyntheticUserAdapter {
  next(
    scenario: SimulationScenario,
    prior: Message[],
    signal: AbortSignal,
  ): Promise<Message>;
}
export class FixtureSyntheticUser implements SyntheticUserAdapter {
  async next(scenario: SimulationScenario, prior: Message[]) {
    const turn = scenario.turns[prior.length];
    if (!turn || turn.role !== "user") throw Error("No fixture user turn.");
    return { role: "user" as const, content: turn.text };
  }
}

export type SyntheticAudio = {
  bytes: Uint8Array;
  voice: "am_michael" | "af_heart";
  version: "kokoro-local-v1";
  mime: "audio/wav";
};
export interface SimulationAudioRepository {
  audio(
    owner: string,
    id: string,
    turn: number,
  ): Promise<SyntheticAudio | null>;
  saveAudio(
    owner: string,
    id: string,
    turn: number,
    audio: SyntheticAudio,
  ): Promise<void>;
}

export interface SyntheticSpeech {
  synthesize(
    text: string,
    role: "user" | "assistant",
    signal: AbortSignal,
  ): Promise<SyntheticAudio>;
}

export function scenarioForRun(run: SimulationRun) {
  const scenario =
    run.scenarioSnapshot ||
    simulationScenarios.find((s) => s.id === run.config.scenario);
  if (!scenario) throw Error("Saved simulation scenario is unavailable");
  return scenario;
}
export function usesLocalSynthesis(run: SimulationRun) {
  return (
    run.config.mode === "voice" &&
    (run.config.engine !== "fixture" ||
      scenarioForRun(run).fixtureAudio === "local-tts")
  );
}
