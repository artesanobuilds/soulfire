import {z} from 'zod';
import {guard,jsonBody,failure,HttpError} from '@/src/lib/server';
import {OpenAIResponses} from '@/src/infrastructure/openai-responses';
import {LocalSyntheticSpeech} from '@/src/infrastructure/local-synthetic-speech';
import {runSpokenCompanion} from '@/src/application/spoken-companion';
import type {MemoryRepository} from '@/src/domain/memory';
export const runtime='nodejs';
const schema=z.object({text:z.string().trim().min(1).max(3000),language:z.enum(['open','plain','spiritual'])}).strict();
const noMemory:MemoryRepository={read:async()=>{throw Error('Memory disabled');},replace:async()=>{throw Error('Memory disabled');},delete:async()=>{throw Error('Memory disabled');}};
export async function POST(req:Request){
 try{
  guard(req);
  if(process.env.SOULFIRE_EXPERIMENT_REASONED_VOICE!=='1')throw new HttpError(404,'This experiment is unavailable.');
  const input=schema.parse(await jsonBody(req));
  return Response.json(await runSpokenCompanion({messages:[{role:'user',content:input.text}],language:input.language,intent:'conversation',useMemory:false},req.signal,new OpenAIResponses(undefined,900),noMemory,new LocalSyntheticSpeech()),{headers:{'Cache-Control':'no-store'}});
 }catch(error){return failure(error);}
}
