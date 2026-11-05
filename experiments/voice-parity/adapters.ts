/** Isolated experiment adapters. Importing this module never opens a connection. */
import { createRequire } from 'node:module';
import { performance } from 'node:perf_hooks';
import { OpenAIResponses } from '../../src/infrastructure/openai-responses';
import { runCompanion } from '../../src/application/companion';
import type { MemoryRepository } from '../../src/domain/memory';

// Provider envelopes are retained verbatim as evidence; configuration and completion fields are checked before use.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Json = Record<string, any>;
export type Http = (body: Json, signal: AbortSignal) => Promise<Json>;
export type Capture = { productionTextRequest: Json; matchedInstructions: string; nativeInstructions: string };
export type Observation = {
  status: string; answer: string; effective_config_verified: boolean; full_turn_verified: boolean;
  timing: Json; raw: Json; pcm?: Buffer; asr?: string;
};
export function shaInputBytes(body: Json) { return Buffer.byteLength(JSON.stringify(body), 'utf8'); }
export function matchedRequest(capture: Capture, input: string): Json {
  return { model: 'gpt-6.1-sol', store: false, instructions: capture.matchedInstructions,
    input: [{ role: 'user', content: input }], max_output_tokens: 900 };
}
export function productionRequest(capture: Capture, input: string): Json {
  return { ...capture.productionTextRequest, input: [{ role: 'user', content: input }] };
}
export function nativeSession(capture: Capture): Json {
  return { type: 'realtime', model: 'gpt-realtime', instructions: capture.matchedInstructions,
    output_modalities: ['audio'], max_output_tokens: 900, tools: [], tool_choice: 'none',
    audio: { input: { format: { type: 'audio/pcm', rate: 24000 },
      transcription: { model: 'gpt-4o-mini-transcribe' }, turn_detection: null, noise_reduction: {type: 'far_field'} },
      output: { format: { type: 'audio/pcm', rate: 24000 }, voice: 'marin', speed: 1 } } };
}
export function verifyNative(effective: Json, expected: Json): boolean {
  const i = effective.audio?.input, o = effective.audio?.output;
  return effective.model === expected.model && effective.instructions === expected.instructions &&
    effective.max_output_tokens === 900 && JSON.stringify(effective.output_modalities) === '["audio"]' &&
    Array.isArray(effective.tools) && effective.tools.length === 0 && effective.tool_choice === 'none' &&
    i?.turn_detection === null && i?.noise_reduction?.type === 'far_field' && i?.transcription?.model === 'gpt-4o-mini-transcribe' &&
    i?.format?.type === 'audio/pcm' && i.format.rate === 24000 &&
    o?.format?.type === 'audio/pcm' && o.format.rate === 24000 && o.voice === 'marin' && o.speed === 1;
}
const noMemory: MemoryRepository = {
  read: async () => { throw Error('Memory must not be accessed'); },
  replace: async () => { throw Error('Memory writes forbidden'); },
  delete: async () => { throw Error('Memory writes forbidden'); },
};
export async function textAdapter(arm: 'production-text' | 'matched-text', capture: Capture,
  input: string, http: Http, signal: AbortSignal): Promise<Observation> {
  const started = performance.now(); let raw: Json = {}, body: Json = {};
  let answer = '', status = 'failed';
  if (arm === 'production-text') {
    const transport = async (_path: string, payload: BodyInit) => {
      body = JSON.parse(String(payload));
      if (JSON.stringify(body) !== JSON.stringify(productionRequest(capture, input)))
        throw Error('Production request differs from frozen request builder; check model override/source drift');
      raw = await http(body, signal);
      return Response.json(raw);
    };
    try {
      const result = await runCompanion({ messages: [{ role: 'user', content: input }], language: 'plain',
        intent: 'conversation', useMemory: false }, signal, new OpenAIResponses(transport), noMemory);
      if (!Object.keys(raw).length) throw Error('Application short-circuited provider; not model evidence');
      answer = result.reply.message; status = raw.status === 'completed' && answer ? 'completed' : String(raw.status || 'failed');
    } catch (error) {
      return { status: ['incomplete','failed','canceled'].includes(raw.status) ? raw.status : 'application-invalid', answer: '', effective_config_verified: false,
        full_turn_verified: true, timing: { full_response_ms: performance.now()-started },
        raw: { request: body, response: raw, error: String(error) } };
    }
  } else {
    body = matchedRequest(capture, input); raw = await http(body, signal);
    const content = (raw.output || []).flatMap((o: Json) => o.content || []);
    answer = content.filter((c: Json) => c.type === 'output_text').map((c: Json) => c.text).join('');
    status = raw.status !== 'completed' ? String(raw.status || 'failed') : content.some((c: Json) => c.type === 'refusal') ? 'refused' : answer ? 'completed' : 'invalid';
  }
  const modelVerified = raw.model === 'gpt-6.1-sol';
  return { status, answer, effective_config_verified: modelVerified, full_turn_verified: true,
    timing: { full_response_ms: performance.now()-started }, raw: { request: body, response: raw } };
}
/** Conservative per-request bound; bytes bound tokenizer payload, plus framing allowance. */
export function reservation(arm: string, capture: Capture, input: string, duration = 0): number {
  if (arm === 'text-tts') return 0;
  if (arm.endsWith('text') && !arm.startsWith('native')) {
    const body = arm === 'production-text' ? productionRequest(capture,input) : matchedRequest(capture,input);
    // Highest documented Sol cache-write price (12h) $5/M, no cache savings assumed.
    return (shaInputBytes(body)+1024)*5/1e6 + Number(body.max_output_tokens)*10/1e6;
  }
  if (!Number.isFinite(duration) || duration < 0 || duration > 20) throw Error('Audio input duration bound');
  // Native text input framing + audio <=10 tokens/sec +128 framing.
  // Reserve 900 audio AND 900 text output tokens, even though cap may count combined.
  // ASR allowance: 4096 input and 4096 output tokens at $1.25/$5 per million.
  return (shaInputBytes(nativeSession(capture))+Buffer.byteLength(input)+1024)*4/1e6 +
    (Math.ceil(duration*10)+128)*32/1e6 + 900*(64+16)/1e6 + 4096*(1.25+5)/1e6;
}
export function pcmFromWav(wav: Buffer, maxSeconds = 20): Buffer {
  if (maxSeconds<=0 || maxSeconds>120) throw Error("Audio bound");
  if (wav.toString('ascii',0,4)!=='RIFF' || wav.toString('ascii',8,12)!=='WAVE') throw Error('Not WAV');
  let format = false, pcm: Buffer | undefined;
  for (let offset=12; offset+8<=wav.length;) {
    const id = wav.toString('ascii',offset,offset+4), size = wav.readUInt32LE(offset+4), start=offset+8;
    if (start+size>wav.length) throw Error('Truncated WAV');
    if (id==='fmt ') {
      if (size<16 || wav.readUInt16LE(start)!==1 || wav.readUInt16LE(start+2)!==1 || wav.readUInt32LE(start+4)!==24000 || wav.readUInt16LE(start+14)!==16) throw Error('Expected mono PCM16 24kHz');
      format = true;
    }
    if (id==='data') pcm = wav.subarray(start,start+size);
    offset=start+size+(size%2);
  }
  if (!format || !pcm || pcm.length<4800 || pcm.length>maxSeconds*48000 || pcm.length%2) throw Error('Invalid/bounded WAV frames');
  if (!hasEnergy(pcm)) throw Error('Silent WAV');
  return pcm;
}
export function hasEnergy(pcm: Buffer) {
  let sum=0; for(let i=0;i+1<pcm.length;i+=2) sum += (pcm.readInt16LE(i)/32768)**2;
  return Math.sqrt(sum/Math.max(1,pcm.length/2))>0.005;
}
export function wavFromPcm(pcm: Buffer): Buffer {
  if (!pcm.length || pcm.length%2) throw Error('Invalid PCM');
  const h=Buffer.alloc(44); h.write('RIFF'); h.writeUInt32LE(36+pcm.length,4); h.write('WAVEfmt ',8);
  h.writeUInt32LE(16,16); h.writeUInt16LE(1,20); h.writeUInt16LE(1,22); h.writeUInt32LE(24000,24);
  h.writeUInt32LE(48000,28); h.writeUInt16LE(2,32); h.writeUInt16LE(16,34); h.write('data',36); h.writeUInt32LE(pcm.length,40);
  return Buffer.concat([h,pcm]);
}
export interface Socket {
  send(data: string): void; close(): void;
  on(name: 'open' | 'error' | 'close', listener: () => void): void;
  on(name: 'message', listener: (data: Buffer | string) => void): void;
}
export type SocketFactory = () => Socket;
/** Must only be called after a durable budget reservation by the caller. */
export function paidSocketFactory(key: string): SocketFactory {
  return () => {
    const require = createRequire(import.meta.url);
    // Reuse Next's pinned bundled ws; no installation or implicit module-level networking.
    const WebSocket = require('next/dist/compiled/ws');
    return new WebSocket('wss://api.openai.com/v1/realtime?model=gpt-realtime', {
      headers: { Authorization: `Bearer ${key}` }, handshakeTimeout: 10000, maxPayload: 8*1024*1024,
    }) as Socket;
  };
}
export async function nativeAdapter(arm: 'native-text' | 'native-audio', capture: Capture,
  input: string, pcm: Buffer, factory: SocketFactory, signal: AbortSignal,
  options: { timeoutMs?: number; pace?: (ms: number) => Promise<void> } = {}): Promise<Observation> {
  if (pcm.length > 20*48000 || (arm==='native-audio' && (!pcm.length || !hasEnergy(pcm)))) throw Error('Input audio bound/energy');
  const expected = nativeSession(capture), started=performance.now();
  const events: Json[] = [], sent: Json[] = [], chunks: Buffer[] = [];
  let effective: Json = {}, response: Json = {}, asr='', answer='', inputEnded: number|undefined;
  let firstEnergy: number|undefined, doneAt: number|undefined, verified=false, submitted=false, committed=false, created=0;
  const pace=options.pace || ((ms:number)=>new Promise<void>(r=>setTimeout(r,ms)));
  return new Promise<Observation>((resolve) => {
    let socket: Socket, finished=false;
    const finish = (status: string, error?: string) => {
      if(finished)return; finished=true; clearTimeout(timer); signal.removeEventListener('abort', aborted);
      socket?.close(); const audio=Buffer.concat(chunks);
      resolve({ status, answer, asr, pcm: audio, effective_config_verified: verified,
        // Complete submission/commit is mechanical evidence; ASR semantic review stays pending.
        full_turn_verified: arm==='native-text' ? submitted : submitted && committed,
        timing: { first_pcm_energy_received_ms: firstEnergy!==undefined && inputEnded!==undefined ? firstEnergy-inputEnded : null,
          response_done_after_input_ms: doneAt!==undefined && inputEnded!==undefined ? doneAt-inputEnded : null,
          output_pcm_duration_ms: audio.length/48, total_ms: performance.now()-started },
        raw: { expected, effective, sent, events, response, error, semantic_asr_review_pending: arm==='native-audio',
          input_pcm_bytes: arm==='native-audio' ? pcm.length : 0 } });
    };
    const aborted=()=>finish('canceled','Abort signal; reservation retained');
    const timer=setTimeout(()=>finish('timeout','No automatic retry; reservation retained'),options.timeoutMs || 60000);
    signal.addEventListener('abort',aborted,{once:true});
    if(signal.aborted){aborted();return;}
    const send=(event:Json)=>{ if(finished)return; sent.push({at_ms:performance.now()-started,...event,
      ...(event.audio ? {audio:`[${Buffer.from(event.audio,'base64').length} PCM bytes]`} : {})}); socket.send(JSON.stringify(event)); };
    const submit=async()=>{
      if(submitted || finished)return; submitted=true;
      if(arm==='native-text') {
        send({type:'conversation.item.create',item:{type:'message',role:'user',content:[{type:'input_text',text:input}]}});
        inputEnded=performance.now(); send({type:'response.create'});
      }else{
        for(let offset=0;offset<pcm.length;offset+=5760){
          if(finished)return;
          const chunk=pcm.subarray(offset,offset+5760);
          send({type:'input_audio_buffer.append',audio:chunk.toString('base64')});
          await pace(chunk.length/48);
        }
        if(finished)return;
        inputEnded=performance.now(); send({type:'input_audio_buffer.commit'});
      }
    };
    try {
      socket=factory();
      socket.on('open',()=>send({type:'session.update',session:expected}));
      socket.on('error',()=>finish('transport-error','WebSocket transport error; details omitted to protect credentials'));
      socket.on('close',()=>finish('disconnected','Closed before complete output/ASR'));
      socket.on('message',(data:Buffer|string)=>{
        if(finished)return;
        try {
          const e=JSON.parse(String(data));
          // Raw audio is saved separately; event evidence never duplicates base64 payloads.
          events.push({at_ms:performance.now()-started,...e,...(e.delta && e.type==='response.output_audio.delta' ? {delta:`[${Buffer.from(e.delta,'base64').length} PCM bytes]`} : {})});
          if(events.length>10000)throw Error('Event limit');
          if(e.type==='error')throw Error(`Provider error: ${e.error?.code || 'unspecified'}`);
          if(e.type==='session.updated') {
            effective=e.session;
            if(!verifyNative(effective,expected))throw Error('Effective session differs from frozen configuration');
            verified=true; void submit().catch(err=>finish('input-failed',String(err)));
          }
          if(e.type==='input_audio_buffer.committed'){
            if(arm!=='native-audio' || !submitted || inputEnded===undefined || committed)throw Error('Unexpected/duplicate audio commit');
            committed=true; send({type:'response.create'});
          }
          if(e.type==='response.created'){
            if(!verified || inputEnded===undefined || ++created>1)throw Error('Early or duplicate generation');
          }
          if(e.type==='response.output_audio.delta'){
            if(!created)throw Error('Audio before response.created');
            const chunk=Buffer.from(e.delta,'base64'); chunks.push(chunk);
            if(chunks.reduce((n,c)=>n+c.length,0)>100*48000)throw Error('Output PCM bound');
            if(firstEnergy===undefined && hasEnergy(chunk))firstEnergy=performance.now();
          }
          if(e.type==='response.output_audio_transcript.done')answer=e.transcript;
          if(e.type==='conversation.item.input_audio_transcription.failed')throw Error('ASR failed');
          if(e.type==='conversation.item.input_audio_transcription.completed')asr=e.transcript;
          if(e.type==='response.done'){
            response=e.response; doneAt=performance.now();
            if(created!==1)throw Error('Missing response.created');
            if(response.status!=='completed'){finish(String(response.status || 'failed'));return;}
          }
          if(doneAt!==undefined && (arm==='native-text' || asr)) {
            if(!answer || firstEnergy===undefined)throw Error('Missing native transcript or non-silent returned PCM');
            finish('completed');
          }
        }catch(error){finish('protocol-failed',String(error));}
      });
    }catch(error){finish('transport-error',String(error));}
  });
}
