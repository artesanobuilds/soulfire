// Only the name explicitly entered for this voice session is used. No inferred
// identity, IP lookup or private memory is included in the opening response.
export function voiceGreeting(name: string, returning: boolean, variant = 0) {
  const clean = name.trim().replace(/\s+/g, " ");
  if (/^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,39}$/u.test(clean))
    return `Hi, ${clean}. I'm here to listen. What would you like to talk through?`;
  if (returning)
    return "Welcome back to our conversation. We can pick up here or start fresh. What's on your mind?";
  const openings = [
    "Hi, I'm Soulfire. We can start wherever you'd like. What's on your mind?",
    "I'm here to listen. We can take this one step at a time. Where would you like to begin?",
    "Welcome. You don't need to have it all figured out. What would you like to talk through?",
  ];
  return openings[Math.abs(variant) % openings.length];
}
