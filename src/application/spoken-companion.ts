import { createHash } from 'node:crypto';
import { runCompanion, type CompanionInput, type ModelProvider } from './companion';
import type { MemoryRepository } from '../domain/memory';
import type { SyntheticSpeech } from '../domain/simulation';

/** Generate once through the text application boundary, then speak the exact accepted message. */
export async function runSpokenCompanion(input: CompanionInput, signal: AbortSignal,
  model: ModelProvider, memory: MemoryRepository, speech: SyntheticSpeech) {
  const result=await runCompanion(input,signal,model,memory);
  signal.throwIfAborted();
  const spokenTextSha256=createHash('sha256').update(result.reply.message,'utf8').digest('hex');
  try {
    const audio=await speech.synthesize(result.reply.message,'assistant',signal);
    signal.throwIfAborted();
    return {...result,audio:{mime:audio.mime,base64:Buffer.from(audio.bytes).toString('base64'),spokenTextSha256},audioError:null};
  }catch(error){
    if(signal.aborted)throw error;
    // A speech failure preserves accepted text. Never regenerate, rewrite, or silently change provider.
    return {...result,audio:null,audioError:'Speech is unavailable. Your complete reply is available to read; no new answer was requested.'};
  }
}
