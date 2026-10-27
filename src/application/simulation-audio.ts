import { HistoryError, type HistoryRepository } from "../domain/history";
import type {
  SimulationRepository,
  SimulationAudioRepository,
  SyntheticAudio,
} from "../domain/simulation";
import type { SyntheticSpeech } from "../domain/simulation";
type Repo = SimulationRepository &
  SimulationAudioRepository &
  HistoryRepository;
type Work = { controller: AbortController; promise: Promise<SyntheticAudio> };
const globalAudio = globalThis as typeof globalThis & {
  soulfireSyntheticAudio?: Map<string, Work>;
};
const work = (globalAudio.soulfireSyntheticAudio ||= new Map<string, Work>());
const key = (owner: string, id: string, turn: number) =>
  `${owner}:${id}:${turn}`;
export function cancelSyntheticAudio(owner: string, id: string) {
  for (const [k, v] of work)
    if (k.startsWith(`${owner}:${id}:`)) v.controller.abort();
}
export async function ensureSimulationAudio(
  owner: string,
  id: string,
  turn: number,
  signal: AbortSignal,
  repo: Repo,
  speech: SyntheticSpeech,
) {
  signal.throwIfAborted();
  const run = await repo.run(owner, id);
  if (
    run.config.mode !== "voice" ||
    !Number.isInteger(turn) ||
    turn < 0 ||
    turn >= run.cursor
  )
    throw new HistoryError(
      400,
      "A finalized synthetic voice turn is required.",
    );
  const cached = await repo.audio(owner, id, turn);
  if (cached) return cached;
  const k = key(owner, id, turn);
  if (work.has(k))
    throw new HistoryError(
      409,
      "This synthetic turn is already being voiced. Retry playback shortly; no model call is needed.",
    );
  if (work.size >= 2)
    throw new HistoryError(
      429,
      "Local speech is busy. Retry the saved turn shortly.",
    );
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal.addEventListener("abort", abort, { once: true });
  const promise = (async () => {
    const detail = await repo.read(owner, id);
    const event = detail.events.find(
      (e) => e.eventKey === `simulation:${turn}` && e.kind === "message",
    );
    if (!event?.role || !event.text)
      throw new HistoryError(404, "Synthetic turn not found.");
    controller.signal.throwIfAborted();
    const audio = await speech.synthesize(
      event.text,
      event.role,
      controller.signal,
    );
    controller.signal.throwIfAborted();
    await repo.saveAudio(owner, id, turn, audio);
    return audio;
  })();
  const item = { controller, promise };
  work.set(k, item);
  if (signal.aborted) controller.abort();
  try {
    return await promise;
  } finally {
    signal.removeEventListener("abort", abort);
    if (work.get(k) === item) work.delete(k);
  }
}
