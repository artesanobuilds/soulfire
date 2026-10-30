import { OpenAIResponses } from "./openai-responses";
import { provider } from "../lib/server";
import { HistoryError } from "../domain/history";
import type { SimulationRepository } from "../domain/simulation";
// Standard gpt-4.1-mini prices verified against official API pricing on 2026-10-24.
// Unknown models require explicitly configured, verified rates; no silent price guessing.
export function simulationRates() {
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const input = Number(process.env.SOULFIRE_SIM_INPUT_USD_PER_MILLION),
    output = Number(process.env.SOULFIRE_SIM_OUTPUT_USD_PER_MILLION);
  if (
    Number.isFinite(input) &&
    input > 0 &&
    Number.isFinite(output) &&
    output > 0
  )
    return { input, output };
  if (
    model === "gpt-4.1-mini" &&
    Date.now() < Date.parse("2026-11-24T00:00:00Z")
  )
    return { input: 0.4, output: 1.6 };
  return null;
}
export function liveSimulationAvailable() {
  return !!process.env.OPENAI_API_KEY && !!simulationRates();
}
export function simulationModel(
  repo: SimulationRepository,
  owner: string,
  id: string,
  claim: string,
  outputLimit = 400,
) {
  if (!Number.isInteger(outputLimit) || outputLimit < 100 || outputLimit > 2200)
    throw new HistoryError(400, "Choose 100 to 2200 simulation output tokens.");
  if (!liveSimulationAvailable())
    throw new HistoryError(
      503,
      "Live simulation requires verified input/output pricing configuration. Fixture mode is available.",
    );
  return new OpenAIResponses(async (path, body, request, contentType) => {
    if (
      path !== "responses" ||
      typeof body !== "string" ||
      Buffer.byteLength(body) > 60000
    )
      throw new HistoryError(
        400,
        "Simulation request exceeded its input bound.",
      );
    const payload = JSON.parse(body);
    if (payload.max_output_tokens > outputLimit)
      throw new HistoryError(400, "Simulation output budget exceeded.");
    // Deliberately conservative byte-count reservation plus framing allowance.
    // This is an estimate using operator-verified prices, not an account billing cap.
    const cost =
      ((Buffer.byteLength(body) + 4096) * simulationRates()!.input +
        outputLimit * simulationRates()!.output) /
      1000000;
    await repo.reserve(owner, id, claim, cost);
    return provider(path, body, request, contentType);
  }, outputLimit);
}
