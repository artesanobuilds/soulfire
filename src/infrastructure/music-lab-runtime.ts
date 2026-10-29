import { readFile, stat, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { homedir } from "node:os";
import { z } from "zod";
import { currentCataloguePolicySchema } from "../domain/current-catalogue";
import {
  musicSampleSchema,
  type MusicSample,
  type MusicAvailability,
  type MusicModel,
} from "../domain/music-lab";
export const runtimeModelSchema = z
  .object({
    root: z.string().min(1),
    python: z.string().min(1),
    checkpointDir: z.string().min(1),
    codeRevision: z.string().regex(/^[a-f0-9]{40}$/),
    weightsRevision: z.string().regex(/^[a-f0-9]{40}$/),
    executionApproved: z.literal(true),
    termsAccepted: z.boolean(),
  })
  .strict();
export const runtimeConfigSchema = z
  .object({
    ace: runtimeModelSchema.optional(),
    stable: runtimeModelSchema.optional(),
  })
  .strict();
export type ModelRuntime = z.infer<typeof runtimeModelSchema>;
export function musicLabDirectory() {
  return (
    process.env.SOULFIRE_MUSIC_LAB_DIR ||
    join(
      process.env.SOULFIRE_DATA_DIR ||
        join(homedir(), "Library", "Application Support", "soulfire"),
      "music-lab",
    )
  );
}
export async function musicRuntime() {
  try {
    const bytes = await readFile(join(musicLabDirectory(), "runtime.json"));
    if (bytes.length > 10000) return {};
    return runtimeConfigSchema.parse(JSON.parse(bytes.toString()));
  } catch {
    return {};
  }
}
export async function modelAvailability(): Promise<MusicAvailability[]> {
  const config = await musicRuntime();
  return Promise.all(
    (["ace", "stable"] as const).map(async (model) => {
      const runtime = config[model];
      const version =
        model === "ace"
          ? "acestep-v15-turbo · MLX · no LM rewriting"
          : "Stable Audio 3 Small-Music · MLX";
      if (model === "stable" && !runtime?.termsAccepted)
        return {
          model,
          version,
          ready: false,
          state: "license-pending" as const,
          message:
            "Model access requires your explicit Stability Community License and Gemma terms acceptance on Hugging Face, plus any applicable commercial registration. Nothing has been accepted by this app.",
        };
      if (!runtime)
        return {
          model,
          version,
          ready: false,
          state: "installation-pending" as const,
          message:
            "Local runtime setup is pending. No model, API or sample is being simulated.",
        };
      const paths =
        model === "ace"
          ? [
              runtime.python,
              join(runtime.checkpointDir, "acestep-v15-turbo", "config.json"),
              join(
                runtime.checkpointDir,
                "acestep-v15-turbo",
                "model.safetensors",
              ),
              join(
                runtime.checkpointDir,
                "vae",
                "diffusion_pytorch_model.safetensors",
              ),
              join(
                runtime.checkpointDir,
                "Qwen3-Embedding-0.6B",
                "model.safetensors",
              ),
              join(runtime.checkpointDir, "vae", "config.json"),
              join(
                runtime.checkpointDir,
                "Qwen3-Embedding-0.6B",
                "config.json",
              ),
            ]
          : [
              runtime.python,
              join(runtime.root, "scripts", "sa3_mlx.py"),
              join(runtime.checkpointDir, "dit_sm-music_f16.npz"),
              join(runtime.checkpointDir, "t5gemma_f16.npz"),
              join(runtime.checkpointDir, "same_s_decoder_f32.npz"),
            ];
      const ok = (
        await Promise.all(
          paths.map((p) =>
            stat(p).then(
              (info) => info.isFile() && info.size > 0,
              () => false,
            ),
          ),
        )
      ).every(Boolean);
      return {
        model,
        version,
        ready: ok,
        state: ok ? ("ready" as const) : ("weights-missing" as const),
        message: ok
          ? "Local runtime and required files found. Generation still runs only on request."
          : "The configured runtime or required model files are missing. No automatic download or fallback will occur.",
      };
    }),
  );
}
export async function musicCatalog(
  includeRetired = false,
): Promise<MusicSample[]> {
  const base = join(musicLabDirectory(), "samples");
  let names: string[] = [];
  try {
    names = await readdir(base);
  } catch {
    return [];
  }
  const items = await Promise.all(
    names
      .filter((n) => /^[a-f0-9-]{36}$/.test(n))
      .slice(0, 200)
      .map(async (id) => {
        try {
          const bytes = await readFile(join(base, id, "sample.json"));
          if (bytes.length > 20000) return null;
          const item = musicSampleSchema.parse(JSON.parse(bytes.toString()));
          return item.id === id ? item : null;
        } catch {
          return null;
        }
      }),
  );
  const policy = await musicCataloguePolicy();
  if (
    policy?.seedSampleIds.some(
      (id) => !items.some((sample) => sample?.id === id),
    )
  )
    throw Error(
      "The published catalogue is incomplete. Earlier audio is retained; nothing was substituted.",
    );
  const retired = new Set(policy?.retiredSampleIds || []);
  return items
    .filter((s): s is MusicSample => !!s)
    .filter((s) => includeRetired || !retired.has(s.id))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export async function musicCataloguePolicy() {
  let bytes: Buffer;
  try {
    bytes = await readFile(join(musicLabDirectory(), "catalogue.json"));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw e;
  }
  if (bytes.length > 100000)
    throw Error("The local catalogue manifest exceeds its bound.");
  return currentCataloguePolicySchema.parse(JSON.parse(bytes.toString()));
}
export async function musicSample(id: string) {
  if (!/^[a-f0-9-]{36}$/.test(id)) return null;
  try {
    const bytes = await readFile(
      join(musicLabDirectory(), "samples", id, "sample.json"),
    );
    if (bytes.length > 20000) return null;
    const sample = musicSampleSchema.parse(JSON.parse(bytes.toString()));
    return sample.id === id ? sample : null;
  } catch {
    return null;
  }
}
export async function ensureMusicStorage() {
  await mkdir(join(musicLabDirectory(), "samples"), { recursive: true });
}
export async function getModelRuntime(model: MusicModel) {
  const config = await musicRuntime();
  return config[model];
}
export async function musicStorageBytes() {
  let count = 0,
    total = 0;
  async function visit(path: string) {
    for (const item of await readdir(path, { withFileTypes: true }).catch(
      () => [],
    )) {
      if (++count > 10000)
        throw Error("Local result inventory exceeds its bound.");
      const next = join(path, item.name);
      if (item.isDirectory()) await visit(next);
      else if (item.isFile()) total += (await stat(next)).size;
    }
  }
  await visit(join(musicLabDirectory(), "samples"));
  await visit(join(musicLabDirectory(), "catalogue-staging"));
  await visit(join(musicLabDirectory(), "current-sessions"));
  return total;
}
