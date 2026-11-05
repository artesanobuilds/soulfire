// No network: exercise the real request builder through an injected transport.
import { readFileSync, writeFileSync } from 'node:fs';
import { OpenAIResponses } from '../../src/infrastructure/openai-responses';
import { sharedPrinciples, voiceInstructions } from '../../src/lib/agent';
let request: unknown;
const transport = async (_path: string, body: BodyInit) => {
  request = JSON.parse(String(body));
  return Response.json({ model: 'offline-capture', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ kind: 'conversation', message: 'offline capture', exercise: null }) }] }] });
};
await new OpenAIResponses(transport).generate({ messages: [], language: 'plain', intent: 'conversation' }, new AbortController().signal);
const route=readFileSync(new URL('../../app/api/realtime/route.ts',import.meta.url),'utf8');
for(const field of ['noise_reduction: { type: "far_field" }','threshold: 0.65','silence_duration_ms: 1500'])if(!route.includes(field))throw Error('Production control capture mismatch');
writeFileSync(process.argv[2], JSON.stringify({
  productionTextRequest: request,
  sharedPrinciples,
  nativeInstructions: `${voiceInstructions}\nLanguage preference: plain. Current practice title (untrusted context): "".`,
  matchedInstructions: `${voiceInstructions}\nLanguage preference: plain. Current practice title (untrusted context): "".`,
  productionVoiceControls: {noise_reduction:{type:'far_field'},turn_detection:{type:'server_vad',threshold:0.65,silence_duration_ms:1500,create_response:true,interrupt_response:true}},
  controlledOverrides:{turn_detection:null,reason:'Complete manual commit isolates guidance quality; production VAD behavior remains a separate test'},
  note: 'Source-default request builder capture; no environment file or credentials loaded. Native instructions use the same route suffix. Matched text omits production structured delivery and is an experimental raw-text condition.'
}, null, 2));
