import { usesLocalSynthesis } from "../domain/simulation";
import { HistoryError, type HistoryRepository } from "../domain/history";
import type {
  SimulationRepository,
  SimulationAudioRepository,
} from "../domain/simulation";
import type { ModelProvider } from "./companion";
import type { SyntheticSpeech } from "../domain/simulation";
import { advanceSimulation } from "./simulations";
import {
  ensureSimulationAudio,
  cancelSyntheticAudio,
} from "./simulation-audio";
type Repo = SimulationRepository &
  HistoryRepository &
  SimulationAudioRepository;
type Job = {
  owner: string;
  id: string;
  controller: AbortController;
  done: Promise<void>;
  phase: "generating" | "synthesizing";
};
export class SimulationJobs {
  private jobs = new Map<string, Job>();
  active(owner: string) {
    return [...this.jobs.values()]
      .filter((j) => j.owner === owner)
      .map((j) => ({ id: j.id, phase: j.phase }));
  }
  cancel(owner: string, id: string) {
    this.jobs.get(`${owner}:${id}`)?.controller.abort();
    cancelSyntheticAudio(owner, id);
  }
  async wait(owner: string, id: string) {
    await this.jobs.get(`${owner}:${id}`)?.done;
  }
  async start(
    owner: string,
    id: string,
    repo: Repo,
    model: (claim: string) => ModelProvider,
    speech: SyntheticSpeech,
  ) {
    const run = await repo.run(owner, id),
      key = `${owner}:${id}`;
    if (this.jobs.has(key)) {
      if (this.jobs.get(key)!.controller.signal.aborted)
        throw new HistoryError(
          409,
          "The prior job is stopping. Retry resume shortly.",
        );
      return;
    }
    if (run.config.delivery !== "background")
      throw new HistoryError(400, "Only background runs use a server job.");
    if (run.status !== "ready")
      throw new HistoryError(
        409,
        "Run is not ready. Resume an interrupted run explicitly.",
      );
    if (this.jobs.size >= 2 || this.active(owner).length)
      throw new HistoryError(
        429,
        "A background simulation is already running. Stop it before launching another.",
      );
    const controller = new AbortController();
    const job: Job = {
      owner,
      id,
      controller,
      phase: "generating",
      done: Promise.resolve(),
    };
    this.jobs.set(key, job);
    job.done = (async () => {
      const timer = setTimeout(
        () => controller.abort(),
        Math.max(1, 600000 - (Date.now() - Date.parse(run.createdAt))),
      );
      try {
        let next = run;
        for (const turn of run.audioPending || []) {
          job.phase = "synthesizing";
          await ensureSimulationAudio(
            owner,
            id,
            turn,
            controller.signal,
            repo,
            speech,
          );
        }
        while (next.cursor < 4) {
          controller.signal.throwIfAborted();
          job.phase = "generating";
          const result = await advanceSimulation(
            owner,
            id,
            next.cursor,
            controller.signal,
            repo,
            model,
          );
          next = result.run;
          if (usesLocalSynthesis(next)) {
            job.phase = "synthesizing";
            await ensureSimulationAudio(
              owner,
              id,
              next.cursor - 1,
              controller.signal,
              repo,
              speech,
            );
          }
        }
      } catch {
        // The application stores generation failure/cancellation. Audio failure leaves saved text intact.
        // A stopped/deleted/restarted run must never be changed by this old job.
      } finally {
        clearTimeout(timer);
        if (this.jobs.get(key) === job) this.jobs.delete(key);
      }
    })();
  }
}
const host = globalThis as typeof globalThis & {
  soulfireSimulationJobs?: SimulationJobs;
};
export const simulationJobs = (host.soulfireSimulationJobs ||=
  new SimulationJobs());
