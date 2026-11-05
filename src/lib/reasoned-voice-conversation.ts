import type {Message} from './schema';
export const maxReasonedMessages=29;
export function nextReasonedInput(history:Message[],draft:string):Message[]{
 const text=draft.trim();if(!text)throw Error('Write or review a question first.');
 if(history.length+1>maxReasonedMessages)throw Error('Start a new conversation to continue.');
 return [...history.map(m=>({...m})),{role:'user',content:text}];
}
export function acceptedReasonedHistory(request:Message[],answer:string):Message[]{
 if(!answer.trim())throw Error('An accepted reply is required.');
 return [...request.map(m=>({...m})),{role:'assistant',content:answer}];
}
