/** Narrow, deterministic backstop, not a clinical classifier. Human support is always accessible. */
export function safetyNotice(text: string): string | null {
  const s = text.toLowerCase();
  if (
    /\b(i (?:am going to|plan to|intend to|will) (?:kill|hurt) (?:myself|someone)|i have (?:a )?suicide plan|i (?:just )?(?:took|swallowed) (?:an overdose|too many pills)|i can't keep myself safe)\b/.test(
      s,
    )
  )
    return "Safety notice: Your immediate safety matters more than an exercise. If you may act on these thoughts or have taken an overdose, contact local emergency services now. If you can, ask a trusted person to stay with you and move away from anything you could use to hurt yourself or someone else. What country are you in, so an appropriate crisis resource can be identified?";
  if (
    /\b(withdrawal|detox)\b/.test(s) &&
    /\b(alcohol|benzodiazepine|benzo|seizure|hallucinat|shaking|cold turkey)\w*/.test(
      s,
    )
  )
    return "Safety notice: Alcohol or sedative withdrawal can be medically dangerous. This practice cannot guide a detox. Please seek urgent medical advice; if you have a seizure, confusion, hallucinations, severe symptoms, or immediate danger, contact local emergency services. Consider asking a trusted person to help you get care.";
  if (
    /\b(no.contact (?:order|request)|(?:asked|told) me (?:not to|never to) contact|restraining order|(?:partner|ex) (?:hit|hits|threatens|threatened|is threatening) me|afraid (?:of|to go home to) my partner)\b/.test(
      s,
    )
  )
    return "Safety notice: Safety and boundaries come before repair or reconciliation. You are not responsible for harm done to you. Respect no-contact boundaries; an exercise is not a reason to contact someone. If you are in danger, seek local emergency help. A trusted person or specialist support can help you consider a safer next step.";
  return null;
}

/** Presentation gate only. Broader safety responses above still remain available
 * inline and the model still receives its safety instructions. This deliberately
 * narrow heuristic cannot establish that someone is safe or detect every crisis.
 */
export function urgentSafetyNotice(text: string): string | null {
  const direct = text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/"[^"\n]*"|“[^”\n]*”/g, " ")
    .replace(/(^|\s)'[^'\n]+'(?=\s|[.!?]|$)/g, " ");
  const clauses = direct.split(/[.!?;\n]+/).map((s) => s.trim());
  for (const rawClause of clauses) {
    const clause = rawClause
      .replace(/^i\'m\b/, "i am")
      .replace(/^i\'ve\b/, "i have");
    if (
      /\bhurt someone'?s? feelings\b/.test(clause) ||
      /\b(?:in my|for a) (?:novel|story|screenplay|character)\b/.test(clause)
    )
      continue;
    if (/\b(?:kill|hurt) myself (?:laughing|with laughter)\b/.test(clause))
      continue;
    if (
      /^i (?:am going to|am about to|plan to|intend to|will) (?:(?:kill|hurt) (?:myself|someone)|end my life|take my own life)\b/.test(
        clause,
      ) ||
      /^i have (?:a )?suicide plan\b/.test(clause) ||
      /^i (?:(?:just )?(?:took|swallowed)|have (?:just )?(?:taken|swallowed)) (?:an overdose|too many pills)\b/.test(
        clause,
      ) ||
      /^i (?:can't|cannot|can not) keep myself safe\b/.test(clause)
    ) {
      return safetyNotice("I can't keep myself safe.");
    }
    if (
      /^(?:i am|i'm) (?:having a seizure|severely confused|hallucinating)\b/.test(
        clause,
      ) &&
      /\b(?:alcohol|benzo\w*|sedative)\b/.test(direct) &&
      /\bwithdrawal\b/.test(direct)
    ) {
      return safetyNotice("Alcohol withdrawal is giving me hallucinations.");
    }
    if (
      /^my (?:partner|ex) (?:is threatening|is attacking|is hurting) me (?:right now|now)\b/.test(
        clause,
      )
    ) {
      return safetyNotice("My partner threatens me.");
    }
  }
  return null;
}
