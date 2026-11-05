import {performance} from 'node:perf_hooks';
import {z} from 'zod';
import {messageSchema} from '@/src/lib/schema';
import {guard,jsonBody,failure,HttpError} from '@/src/lib/server';
import {OpenAIResponses} from '@/src/infrastructure/openai-responses';
import {LocalSyntheticSpeech} from '@/src/infrastructure/local-synthetic-speech';
import {runSpokenCompanion} from '@/src/application/spoken-companion';
import type {ModelProvider} from '@/src/application/companion';
import type {SyntheticSpeech} from '@/src/domain/simulation';
import type {MemoryRepository} from '@/src/domain/memory';
export const runtime='nodejs';
const language=z.enum(['open','plain','spiritual']);
const messages=z.array(messageSchema.refine(m=>!!m.content.trim())).min(1).max(29).superRefine((value,ctx)=>{
 if(value.length%2!==1||value.some((m,i)=>m.role!==(i%2===0?'user':'assistant')))ctx.addIssue({code:'custom',message:'Use complete alternating turns ending with the latest question.'});
});
const schema=z.union([z.object({text:z.string().trim().min(1).max(3000),language}).strict(),z.object({messages,language}).strict()]);
const noMemory:MemoryRepository={read:async()=>{throw Error('Memory disabled');},replace:async()=>{throw Error('Memory disabled');},delete:async()=>{throw Error('Memory disabled');}};
export async function POST(req:Request){
 try{
  guard(req);
  if(process.env.SOULFIRE_EXPERIMENT_REASONED_VOICE!=='1')throw new HttpError(404,'This experiment is unavailable.');
  const input=schema.parse(await jsonBody(req));
  const start=performance.now();let providerMs=0,synthesisMs=0;const provider=new OpenAIResponses(),speech=new LocalSyntheticSpeech();
  const measuredProvider:ModelProvider={name:provider.name,generate:async(...args)=>{const t=performance.now();try{return await provider.generate(...args);}finally{providerMs=performance.now()-t;}}};
  const measuredSpeech:SyntheticSpeech={synthesize:async(...args)=>{const t=performance.now();try{return await speech.synthesize(...args);}finally{synthesisMs=performance.now()-t;}}};
  const conversation='messages' in input?input.messages:[{role:'user' as const,content:input.text}];
  const result=await runSpokenCompanion({messages:conversation,language:input.language,intent:'conversation',useMemory:false},req.signal,measuredProvider,noMemory,measuredSpeech);
  return Response.json(result,{headers:{'Cache-Control':'no-store','Server-Timing':`provider;dur=${providerMs.toFixed(1)}, synthesis;dur=${synthesisMs.toFixed(1)}, total;dur=${(performance.now()-start).toFixed(1)}`}});
 }catch(error){return failure(error);}
}
