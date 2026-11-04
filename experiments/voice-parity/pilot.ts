/** Default invocation only prepares files. Paid execution needs a separate, plan-bound authorization. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, openSync, closeSync, existsSync, renameSync, unlinkSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync, spawnSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { textAdapter, nativeAdapter, paidSocketFactory, pcmFromWav, reservation, type Capture, type Json } from './adapters';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const write=(p:string,v:unknown)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n',{mode:0o600});
export const hash=(v:Buffer|string)=>createHash('sha256').update(v).digest('hex');
const fileHash=(p:string)=>hash(readFileSync(p));
const CASES=['unknown-availability','known-availability','correct-record','repeat-uncertainty'];
const CODE=['experiments/voice-parity/adapters.ts','experiments/voice-parity/pilot.ts',
 'experiments/voice-parity/cli.ts','experiments/voice-parity/capture.ts','scripts/synthesize-simulation.py'];
export function validatePlan(plan:Json) {
  if(plan.ceiling_usd!==5 || plan.paid_attempt_limit!==32 || plan.runs.length!==40)throw Error('Unexpected pilot design');
  if(new Set(plan.runs.map((r:Json)=>r.id)).size!==40)throw Error('Duplicate planned run');
  const costs=plan.runs.map((r:Json)=>r.allocation_usd);
  if(costs.some((v:number)=>!Number.isFinite(v)||v<0)||Math.abs(costs.reduce((a:number,b:number)=>a+b,0)-4.8)>1e-9)throw Error('Reservation sum differs from $4.80');
  for(const run of plan.runs){
    if(!CASES.includes(run.scenario)||![1,2].includes(run.repeat)||!['production-text','matched-text','native-text','native-audio','text-tts'].includes(run.arm))throw Error('Unexpected run');
    if(run.id!==`${run.scenario}-${run.repeat}-${run.arm}`)throw Error('Run ID does not match condition');
    const amount=run.arm==='text-tts'?0:run.arm.startsWith('native')?.20:.10;
    if(run.allocation_usd!==amount)throw Error('Changed per-attempt allocation');
  }
}
export function preparePilot(study:string,out:string) {
  const manifest=read(join(study,'manifest.json')), capture=read(join(study,'instructions.json')) as Capture;
  if(fileHash(join(study,'instructions.json'))!==manifest.instruction_sha256 || fileHash(join(study,'scenarios.json'))!==manifest.scenario_sha256)throw Error('Frozen study changed');
  for(const [path, expected] of Object.entries(manifest.source_sha256))if(fileHash(join(ROOT,path))!==expected)throw Error(`Source drift: ${path}`);
  const scenarios=read(join(study,'scenarios.json')).filter((s:Json)=>CASES.includes(s.id));
  const runs=manifest.runs.filter((r:Json)=>CASES.includes(r.scenario)&&r.repeat<=2).map((r:Json)=>({...r,allocation_usd:r.arm==='text-tts'?0:r.arm.startsWith('native')?.20:.10}));
  const audio:Json={};
  for(const s of scenarios){
    const entry=manifest.audio[s.id],path=join(study,entry.path),wav=readFileSync(path),pcm=pcmFromWav(wav);
    if(hash(wav)!==entry.sha256)throw Error('Fixture hash changed');
    const duration=pcm.length/48000;
    for(const arm of ['production-text','matched-text','native-text','native-audio']) {
      const bound=reservation(arm,capture,s.input,arm==='native-audio'?duration:0), allocation=arm.startsWith('native')?.20:.10;
      if(bound>allocation)throw Error(`Reservation does not fit: ${s.id}/${arm}`);
      audio[`${s.id}/${arm}`]={calculated_conservative_bound_usd:bound,allocation_usd:allocation,input_duration_seconds:arm==='native-audio'?duration:0};
    }
  }
  const codeHashes=Object.fromEntries(CODE.map(p=>[p,fileHash(join(ROOT,p))]));
  const localTtsAssets=read(join(study,'validation.json')).model_assets_sha256;
  const plan={local_tts_asset_sha256:localTtsAssets,schema:1,kind:'bounded-voice-baseline-pilot',ceiling_usd:5,reserved_if_all_attempted_usd:4.8,
    unallocated_nonexecutable_usd:.2,paid_attempt_limit:32,retries:0,execution_authorized:false,
    parent_study_manifest_sha256:fileHash(join(study,'manifest.json')),
    revision:execFileSync('git',['rev-parse','HEAD'],{cwd:ROOT,encoding:'utf8'}).trim(),
    source_sha256:manifest.source_sha256,code_sha256:codeHashes,runs,worksheet:audio,
    instruction_sha256:manifest.instruction_sha256,scenario_sha256:hash(JSON.stringify(scenarios,null,2)+'\n'),
    price_book:{checked_date:'2026-11-04',sol_input_upper_usd_per_million:5,sol_output:10,
      native_text_input:4,native_text_output:16,native_audio_input:32,native_audio_output:64,
      transcribe_input:1.25,transcribe_output:5,
      sources:['https://developers.openai.com/api/docs/models/gpt-6.1-sol','https://developers.openai.com/api/docs/models/gpt-realtime','https://developers.openai.com/api/docs/models/gpt-4o-mini-transcribe','https://developers.openai.com/api/docs/guides/voice-latency-cost']},
    notes:['No paid calls during prepare','WebSocket PCM diagnostics differ from production WebRTC/Opus; no product latency parity claim',
      'Deprecated transcription alias must pass explicit account catalogue preflight; no automatic substitute',
      'Native audio semantic transcript checks remain manual and exclude outputs from scoring until confirmed']};
  validatePlan(plan); mkdirSync(out,{recursive:false,mode:0o700});
  write(join(out,'plan.json'),plan);copyFileSync(join(study,'instructions.json'),join(out,'instructions.json'));
  write(join(out,'scenarios.json'),scenarios);
  for(const s of scenarios)copyFileSync(join(study,manifest.audio[s.id].path),join(out,`${s.id}.wav`));
  write(join(out,'manifest.json'),{...manifest,runs,repeats:2,scenario_sha256:plan.scenario_sha256,
    audio:Object.fromEntries(scenarios.map((s:Json)=>[s.id,{...manifest.audio[s.id],path:`${s.id}.wav`}]))});
  write(join(out,'authorization-template.json'),{approved:false,ceiling_usd:5,plan_sha256:fileHash(join(out,'plan.json')),
    user_approval_evidence:'',approved_at:'',ledger_owner_confirmed_no_overlapping_allocation:false});
  return plan;
}
export function verifyAuthorization(plan:Json,planHash:string,authorization:Json) {
  validatePlan(plan);
  if(authorization.approved!==true || authorization.ceiling_usd!==5 || authorization.plan_sha256!==planHash ||
    !authorization.user_approval_evidence?.trim() || !authorization.approved_at ||
    authorization.ledger_owner_confirmed_no_overlapping_allocation!==true)throw Error('No explicit plan-bound authorization and coordinated ledger approval');
}
/** Exclusive single-run ledger. Reservations are never released, even for failures. */
export class Ledger {
  private fd:number; private value:Json;
  constructor(private root:string,private plan:Json) {
    if(existsSync(join(root,'ledger.json')))throw Error('Existing ledger: no rerun/resume or duplicate paid attempts');
    this.fd=openSync(join(root,'execution.lock'),'wx',0o600);
    this.value={plan_sha256:fileHash(join(root,'plan.json')),ceiling_usd:5,reserved_usd:0,attempts:[],started_at:new Date().toISOString()};this.save();
  }
  private save(){const temp=join(this.root,'ledger.next.json');write(temp,this.value);renameSync(temp,join(this.root,'ledger.json'));}
  reserve(run:Json,bound:number){
    if(!this.plan.runs.some((r:Json)=>r.id===run.id && r.arm===run.arm && r.allocation_usd===run.allocation_usd)||this.value.attempts.some((r:Json)=>r.id===run.id)||!Number.isFinite(bound)||bound<0||bound>run.allocation_usd||this.value.reserved_usd+run.allocation_usd>5+1e-9||this.value.attempts.length>=32)throw Error('Budget, attempt or duplicate guard');
    const row={id:run.id,reserved_usd:run.allocation_usd,bound_usd:bound,state:'reserved-outcome-uncertain',reserved_at:new Date().toISOString()};
    this.value.attempts.push(row);this.value.reserved_usd=Number((this.value.reserved_usd+run.allocation_usd).toFixed(8));this.save();
  }
  complete(id:string,status:string){this.value.attempts.find((r:Json)=>r.id===id).state=status;this.save();}
  close(){closeSync(this.fd);unlinkSync(join(this.root,'execution.lock'));}
}
export async function executePilot(out:string,authorizationPath:string,kokoroHome:string) {
  const plan=read(join(out,'plan.json'));verifyAuthorization(plan,fileHash(join(out,'plan.json')),read(authorizationPath));
  for(const [path,expected] of Object.entries({...plan.source_sha256,...plan.code_sha256}))if(fileHash(join(ROOT,path))!==expected)throw Error(`Frozen source/code drift: ${path}`);
  if(fileHash(join(out,'instructions.json'))!==plan.instruction_sha256 || fileHash(join(out,'scenarios.json'))!==plan.scenario_sha256)throw Error('Study drift');
  const capture=read(join(out,'instructions.json')) as Capture,scenarios=read(join(out,'scenarios.json'));
  const manifest=read(join(out,'manifest.json'));
  for(const path of ['kokoro_say.py','kokoro/kokoro-v1.0.onnx','kokoro/voices-v1.0.bin']) {
    const expected=plan.local_tts_asset_sha256?.[path.split('/').at(-1)!];
    if(!expected || fileHash(join(kokoroHome,path))!==expected)throw Error('Frozen local synthesis asset changed');
  }
  const key=process.env.OPENAI_API_KEY;if(!key)throw Error('No authorized API key in process environment; no files automatically read');
  if(process.env.OPENAI_MODEL && process.env.OPENAI_MODEL!=='gpt-6.1-sol')throw Error('Explicit model override differs from frozen study');
  // Metadata-only preflight, no generation; model IDs must be present without substitutions.
  const catalogue=await fetch('https://api.openai.com/v1/models',{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(10000)});
  if(!catalogue.ok)throw Error(`Account model catalogue HTTP ${catalogue.status}; no generation`);
  const ids=new Set((await catalogue.json()).data.map((m:Json)=>m.id));
  for(const model of ['gpt-6.1-sol','gpt-realtime','gpt-4o-mini-transcribe'])if(!ids.has(model))throw Error(`Account lacks exact requested model ${model}; no substitute, no generation`);
  const ledger=new Ledger(out,plan),records:Json[]=[],outputs:Json={};
  const http=async(body:Json,signal:AbortSignal)=>{
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.any([signal,AbortSignal.timeout(45000)])});
    if(!response.ok)throw Error(`Provider HTTP ${response.status}; no retry`);return response.json();
  };
  try {
    for(const run of plan.runs.filter((r:Json)=>r.arm!=='text-tts')){
      const scenario=scenarios.find((s:Json)=>s.id===run.scenario),wav=readFileSync(join(out,`${scenario.id}.wav`));
      if(hash(wav)!==manifest.audio[scenario.id].sha256)throw Error('Fixture changed');
      const pcm=pcmFromWav(wav),duration=run.arm==='native-audio'?pcm.length/48000:0;
      const bound=reservation(run.arm,capture,scenario.input,duration);ledger.reserve(run,bound);
      const folder=join(out,run.id);mkdirSync(folder,{mode:0o700});let observation:Json;
      try {
        observation=run.arm.startsWith('native') ? await nativeAdapter(run.arm,capture,scenario.input,run.arm==='native-audio'?pcm:Buffer.alloc(0),paidSocketFactory(key),new AbortController().signal) : await textAdapter(run.arm,capture,scenario.input,http,new AbortController().signal);
      }catch(error){observation={status:'failed',answer:'',effective_config_verified:false,full_turn_verified:false,raw:{error:String(error)},timing:{}};}
      if(observation.pcm?.length)writeFileSync(join(folder,'received.pcm'),observation.pcm,{mode:0o600});
      delete observation.pcm;write(join(folder,'result.json'),observation);outputs[run.id]=observation;
      // A human must compare ASR and source; mechanical complete submission alone is insufficient.
      records.push({run_id:run.id,...observation,full_turn_verified:run.arm==='native-audio'?false:observation.full_turn_verified,
        asr_review_required:run.arm==='native-audio',source_input_sha256:hash(scenario.input),result_sha256:fileHash(join(folder,'result.json'))});
      write(join(out,'records.json'),records);ledger.complete(run.id,observation.status);
      if(observation.status!=='completed' || !observation.effective_config_verified) {
        write(join(out,'STOPPED.json'),{run:run.id,reason:'Delivery/configuration failure; remaining attempts not executed; no automatic retry'});break;
      }
    }
    // Exact-text local speech, no additional reasoning or cloud synthesis.
    for(const run of plan.runs.filter((r:Json)=>r.arm==='text-tts')) {
      const source=outputs[run.depends_on];if(source?.status!=='completed'||!source.effective_config_verified)continue;
      const folder=join(out,run.id);mkdirSync(folder,{mode:0o700});
      const observation=localTtsAdapter(source.answer,source.timing.full_response_ms,kokoroHome,run.depends_on);
      if(observation.wav)writeFileSync(join(folder,'exact-text.wav'),observation.wav,{mode:0o600});
      delete observation.wav;
      write(join(folder,'result.json'),observation);records.push({run_id:run.id,...observation});write(join(out,'records.json'),records);
    }
  }finally{ledger.close();}
}
export function localTtsAdapter(answer:string,textFullResponseMs:number,kokoroHome:string,dependency='offline-preflight'):Json {
  const started=performance.now();
  const synthesis=spawnSync(join(kokoroHome,'venv/bin/python'),[join(ROOT,'scripts/synthesize-simulation.py'),kokoroHome],{
    input:JSON.stringify({text:answer,voice:'af_heart'}),env:{...process.env,PYTHONDONTWRITEBYTECODE:'1',HF_HUB_OFFLINE:'1'},maxBuffer:12*1024*1024,timeout:60000});
  let status='completed',error='';
  try{if(synthesis.status!==0)throw Error('Local TTS process failed');pcmFromWav(synthesis.stdout,120);}catch(e){status='local-tts-failed';error=String(e);}
  return {status,answer,effective_config_verified:status==='completed',full_turn_verified:true,
    ...(status==='completed'?{wav:synthesis.stdout}:{}),
    timing:{full_text_plus_complete_synthesis_ms:textFullResponseMs+performance.now()-started,local_synthesis_ms:performance.now()-started},
    raw:{dependency,exact_text_sha256:hash(answer),voice:'af_heart',speed:.89,error,
      note:'Complete PCM availability; not acoustic first word or measured physical playback latency'}};
}
