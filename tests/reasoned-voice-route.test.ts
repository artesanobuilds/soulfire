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
 const r=await POST(request({text:'test',language:'plain'})),body=await r.json();expect(r.status).toBe(200);expect(r.headers.get('Cache-Control')).toBe('no-store');expect(body.reply.message).toBe('An exact accepted reply.');expect(mocks.synthesize.mock.calls[0][0]).toBe(body.reply.message);expect(mocks.generate).toHaveBeenCalledTimes(1);expect(mocks.generate.mock.calls[0][0].memoryContext).toBeUndefined();
});
it('rejects malformed or oversized input before generation',async()=>{
 vi.stubEnv('SOULFIRE_EXPERIMENT_REASONED_VOICE','1');for(const body of [{text:'',language:'plain'},{text:'x'.repeat(3001),language:'plain'},{text:'test',language:'plain',useMemory:true}])expect((await POST(request(body))).status).toBe(400);expect(mocks.generate).not.toHaveBeenCalled();
});
