import {it,expect} from 'vitest';
import {nextReasonedInput,acceptedReasonedHistory} from '../src/lib/reasoned-voice-conversation';
it('preserves actual accepted assistant wording and appends the latest correction in order',()=>{
 const first=nextReasonedInput([],'Friday is tentative.');const history=acceptedReasonedHistory(first,'Do not count Friday as confirmed.');const second=nextReasonedInput(history,'Monday morning is now confirmed.');
 expect(second).toEqual([{role:'user',content:'Friday is tentative.'},{role:'assistant',content:'Do not count Friday as confirmed.'},{role:'user',content:'Monday morning is now confirmed.'}]);expect(first).toHaveLength(1);expect(history).toHaveLength(2);
});
it('never silently drops context at the limit',()=>{const history=Array.from({length:30},(_,i)=>({role:i%2?'assistant' as const:'user' as const,content:'preserved'}));expect(()=>nextReasonedInput(history,'next')).toThrow('Start a new conversation');});
it('does not append failed or empty replies',()=>{const request=nextReasonedInput([],'question');expect(()=>acceptedReasonedHistory(request,' ')).toThrow();expect(request).toHaveLength(1);});
