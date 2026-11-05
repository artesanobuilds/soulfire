/** Evaluation-only: response.done is generation completion, not WebRTC playback completion. */
export function playbackComplete(s:{status:string;answer:string;firstEnergy?:number;lastEnergy?:number;outputStoppedAt?:number},now:number){
 return s.status==='completed'&&!!s.answer&&s.firstEnergy!==undefined&&s.lastEnergy!==undefined&&s.outputStoppedAt!==undefined&&now-s.outputStoppedAt>=250&&now-s.lastEnergy>=600;
}
