import {it,expect} from 'vitest';
import {playbackComplete} from '../experiments/voice-parity/playback-gate';
it('does not finish during a mid-reply pause after response.done',()=>{
 const gap={status:'completed',answer:'Sure. What do you notice?',firstEnergy:100,lastEnergy:400};expect(playbackComplete(gap,1500)).toBe(false);
});
it('requires provider buffer stop and a receiver drain interval',()=>{
 const s={status:'completed',answer:'Complete reply.',firstEnergy:100,lastEnergy:1000,outputStoppedAt:1400};expect(playbackComplete(s,1600)).toBe(false);expect(playbackComplete(s,1700)).toBe(true);
});
it('never promotes an incomplete generation because its audio became quiet',()=>{
 expect(playbackComplete({status:'incomplete',answer:'partial',firstEnergy:100,lastEnergy:200,outputStoppedAt:300},2000)).toBe(false);
});
