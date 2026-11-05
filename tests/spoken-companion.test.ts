import {it,expect,vi} from 'vitest';
import {createHash} from 'node:crypto';
import {runSpokenCompanion} from '../src/application/spoken-companion';
import type {MemoryRepository} from '../src/domain/memory';
const input={messages:[{role:'user' as const,content:'Help me decide.'}],language:'plain' as const,intent:'conversation' as const,useMemory:false};
const memory:MemoryRepository={read:async()=>{throw Error('Must not read memory');},replace:async()=>{throw Error('No writes');},delete:async()=>{throw Error('No writes');}};
const message='You correctly said Tuesday. Do not admit a mistake you did not make.';
const model=()=>({name:'offline',generate:vi.fn(async()=>({model:'offline',reply:{kind:'conversation',message,exercise:null}}))});
it('speaks exact validated text once, preserving its hash and provenance',async()=>{
 const m=model(),s={synthesize:vi.fn(async(text:string)=>{void text;return {bytes:Buffer.from('wav fixture'),mime:'audio/wav' as const,voice:'af_heart' as const,version:'kokoro-local-v1' as const};})};
 const r=await runSpokenCompanion(input,new AbortController().signal,m,memory,s);
 expect(m.generate).toHaveBeenCalledTimes(1);expect(s.synthesize).toHaveBeenCalledTimes(1);expect(s.synthesize.mock.calls[0][0]).toBe(message);
 expect(r.reply.message).toBe(message);expect(r.audio?.spokenTextSha256).toBe(createHash('sha256').update(message).digest('hex'));
});
it('keeps accepted text when local speech fails and never regenerates',async()=>{
 const m=model();const r=await runSpokenCompanion(input,new AbortController().signal,m,memory,{synthesize:async()=>{throw Error('offline unavailable');}});
 expect(r.audio).toBeNull();expect(r.reply.message).toBe(message);expect(r.audioError).toBeTruthy();expect(m.generate).toHaveBeenCalledTimes(1);
});
it('does not speak invalid model output',async()=>{
 const s={synthesize:vi.fn()};await expect(runSpokenCompanion(input,new AbortController().signal,{name:'invalid',generate:async()=>({model:'offline',reply:{arbitrary:'invalid'}})},memory,s)).rejects.toThrow();expect(s.synthesize).not.toHaveBeenCalled();
});
it('does not generate or speak after cancellation',async()=>{
 const c=new AbortController();c.abort();const m=model(),s={synthesize:vi.fn()};await expect(runSpokenCompanion(input,c.signal,m,memory,s)).rejects.toThrow();expect(m.generate).not.toHaveBeenCalled();expect(s.synthesize).not.toHaveBeenCalled();
});
