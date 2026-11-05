import {afterEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({generate:vi.fn(),synthesize:vi.fn()}));
vi.mock('../src/infrastructure/openai-responses',()=>({OpenAIResponses:class{readonly name='offline';generate=mocks.generate;}}));
vi.mock('../src/infrastructure/local-synthetic-speech',()=>({LocalSyntheticSpeech:class{synthesize=mocks.synthesize;}}));
import {POST} from '../app/api/experimental/reasoned-voice/route';
const request=(body:unknown)=>new Request('http://127.0.0.1:3147/api/experimental/reasoned-voice',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
afterEach(()=>{vi.unstubAllEnvs();vi.clearAllMocks();});
it('keeps experiment disabled by default without generating or synthesizing',async()=>{
 vi.stubEnv('SOULFIRE_EXPERIMENT_REASONED_VOICE','0');const r=await POST(request({text:'test',language:'plain'}));expect(r.status).toBe(404);expect(mocks.generate).not.toHaveBeenCalled();expect(mocks.synthesize).not.toHaveBeenCalled();
});
it('returns the exact validated text and speech without storing memory or rewriting',async()=>{
 vi.stubEnv('SOULFIRE_EXPERIMENT_REASONED_VOICE','1');mocks.generate.mockResolvedValue({model:'offline',reply:{message:'An exact accepted reply.',kind:'conversation',exercise:null}});mocks.synthesize.mockResolvedValue({bytes:Buffer.from('wave fixture'),mime:'audio/wav',voice:'af_heart',version:'kokoro-local-v1'});
 const r=await POST(request({text:'test',language:'plain'})),body=await r.json();expect(r.status).toBe(200);expect(r.headers.get('Cache-Control')).toBe('no-store');expect(r.headers.get('Server-Timing')).toMatch(/provider;dur=[0-9.]+, synthesis;dur=[0-9.]+, total;dur=[0-9.]+/);expect(body.reply.message).toBe('An exact accepted reply.');expect(mocks.synthesize.mock.calls[0][0]).toBe(body.reply.message);expect(mocks.generate).toHaveBeenCalledTimes(1);expect(mocks.generate.mock.calls[0][0].memoryContext).toBeUndefined();
});
it('rejects malformed or oversized input before generation',async()=>{
 vi.stubEnv('SOULFIRE_EXPERIMENT_REASONED_VOICE','1');for(const body of [{text:'',language:'plain'},{text:'x'.repeat(3001),language:'plain'},{text:'test',language:'plain',useMemory:true}])expect((await POST(request(body))).status).toBe(400);expect(mocks.generate).not.toHaveBeenCalled();
});
it('forwards the complete multi-turn history including a corrected fact without memory',async()=>{
 vi.stubEnv('SOULFIRE_EXPERIMENT_REASONED_VOICE','1');const messages=[{role:'user',content:'Friday is tentative.'},{role:'assistant',content:'Do not count Friday as confirmed.'},{role:'user',content:'Monday morning is confirmed now.'}];
 mocks.generate.mockResolvedValue({model:'offline',reply:{message:'Use Monday morning.',kind:'conversation',exercise:null}});mocks.synthesize.mockResolvedValue({bytes:Buffer.from('wave'),mime:'audio/wav',voice:'af_heart',version:'kokoro-local-v1'});
 expect((await POST(request({messages,language:'plain'}))).status).toBe(200);expect(mocks.generate.mock.calls[0][0].messages).toEqual(messages);expect(mocks.generate.mock.calls[0][0].memoryContext).toBeUndefined();
});
it('rejects incomplete or misordered history before generation',async()=>{
 vi.stubEnv('SOULFIRE_EXPERIMENT_REASONED_VOICE','1');for(const messages of [[{role:'assistant',content:'Unpaired'}],[{role:'user',content:'one'},{role:'assistant',content:'two'}],[{role:'user',content:'one'},{role:'user',content:'two'},{role:'user',content:'three'}]])expect((await POST(request({messages,language:'plain'}))).status).toBe(400);expect(mocks.generate).not.toHaveBeenCalled();
});
