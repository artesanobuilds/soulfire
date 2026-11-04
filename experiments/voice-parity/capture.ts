// No network: exercise the real request builder through an injected transport.
import { writeFileSync } from 'node:fs';
import { OpenAIResponses } from '../../src/infrastructure/openai-responses';
import { sharedPrinciples, voiceDeliveryInstructions, voiceInstructions } from '../../src/lib/agent';
let request: unknown;
const transport = async (_path: string, body: BodyInit) => {
  request = JSON.parse(String(body));
  return Response.json({ model: 'offline-capture', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ kind: 'conversation', message: 'offline capture', exercise: null }) }] }] });
};
await new OpenAIResponses(transport).generate({ messages: [], language: 'plain', intent: 'conversation' }, new AbortController().signal);
writeFileSync(process.argv[2], JSON.stringify({
  productionTextRequest: request,
  sharedPrinciples,
  nativeInstructions: `${voiceInstructions}\nLanguage preference: plain. Current practice title (untrusted context): "".`,
  matchedInstructions: `${sharedPrinciples}\n\n${voiceDeliveryInstructions}\nLanguage preference: plain. Current practice title (untrusted context): "".`,
  note: 'Source-default request builder capture; no environment file or credentials loaded. Native instructions use the same route suffix. Matched text omits production structured delivery and is an experimental raw-text condition.'
}, null, 2));
