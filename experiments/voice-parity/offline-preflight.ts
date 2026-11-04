/** Real local synthesis + fixture validation, with outbound fetch disabled. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { localTtsAdapter, hash } from './pilot';
import { pcmFromWav } from './adapters';
const [studyArg, outArg, homeArg]=process.argv.slice(2);
if(!studyArg || !outArg || !homeArg)throw Error('Usage: offline-preflight.ts STUDY NEW_OUT KOKORO_HOME');
const study=resolve(studyArg),out=resolve(outArg),home=resolve(homeArg);
globalThis.fetch=async()=>{throw Error('No outbound network in offline preflight');};
mkdirSync(out,{mode:0o700});
const manifest=JSON.parse(readFileSync(join(study,'manifest.json'),'utf8'));
const fixtures=[];
for(const [id,entry] of Object.entries(manifest.audio) as [string,{path:string;sha256:string}][]) {
 const wav=readFileSync(join(study,entry.path)),pcm=pcmFromWav(wav);
 if(hash(wav)!==entry.sha256)throw Error('Fixture changed');
 fixtures.push({id,seconds:pcm.length/48000,sha256:hash(wav)});
}
const answer='I am available Tuesday from 2 to 4 pm.';
const result=localTtsAdapter(answer,0,home);
if(result.status!=='completed')throw Error('Offline TTS preflight failed');
writeFileSync(join(out,'exact-text-preflight.wav'),result.wav,{mode:0o600});
delete result.wav;
const assetHashes=Object.fromEntries(['kokoro_say.py','kokoro/kokoro-v1.0.onnx','kokoro/voices-v1.0.bin'].map(path=>[path,hash(readFileSync(join(home,path)))]));
writeFileSync(join(out,'preflight.json'),JSON.stringify({status:'passed',provider_calls:0,fixtures,tts:result,asset_sha256:assetHashes,note:'Synthetic canned text; no model-quality score or physical listening claim'},null,2)+'\n',{mode:0o600});
console.log(JSON.stringify({status:'passed',valid_fixtures:fixtures.length,exact_text_tts:true,provider_calls:0}));
