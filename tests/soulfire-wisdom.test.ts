import { expect, it } from "vitest";
import { existsSync } from "node:fs";
import {
  instructions,
  sharedPrinciples,
  voiceInstructions,
} from "../src/lib/agent";
import {
  soulfireWisdomContext,
  wisdomSources,
  wisdomSteps,
} from "../src/lib/soulfire-wisdom";
import { outputJsonSchemaForIntent, replySchema } from "../src/lib/schema";
import { samples } from "../src/lib/catalog";

it("includes the entire sourced twelve-step map in text and voice, not a retrieved subset", () => {
  expect(wisdomSteps.map((s) => s.step)).toEqual(
    Array.from({ length: 12 }, (_, i) => i + 1),
  );
  for (const prompt of [instructions, sharedPrinciples, voiceInstructions]) {
    expect(prompt).toContain(soulfireWisdomContext);
    for (const step of wisdomSteps)
      expect(prompt).toContain(`STEP ${step.step} ·`);
  }
  for (const source of wisdomSources) {
    expect(soulfireWisdomContext).toContain(source.reference);
    for (const path of source.reference.split("; "))
      if (!path.startsWith("https:")) expect(existsSync(path)).toBe(true);
  }
});
it("retains provenance, faith choice, agency and PDF-derived limits", () => {
  for (const boundary of [
    "not NA doctrine",
    "ordered relapse stages",
    "not independently verified",
    "No teacher endorses",
    "Plain language means no step labels",
    "no-contact",
    "unsafe withdrawal",
    "Higher Power as they understand it",
    "A dedicated interactive Step 4 exercise is not implemented",
    "public project sources only",
  ])
    expect(soulfireWisdomContext).toContain(boundary);
  expect(instructions).toContain("Explicit user actions are required");
  expect(instructions).toContain("If immediate danger");
});
const reply = {
  kind: "conversation",
  message: "A useful answer.",
  exercise: null,
};
it("retains old three-field replies and accepts only bounded trusted offers", () => {
  expect(replySchema.safeParse(reply).success).toBe(true);
  for (const kind of ["exercise", "current", "meditation"])
    expect(
      replySchema.safeParse({
        ...reply,
        practiceOffer: { kind, label: "Try a brief practice" },
      }).success,
    ).toBe(true);
  for (const offer of [
    { kind: "url", label: "Open" },
    { kind: "exercise", label: "" },
    { kind: "exercise", label: "x".repeat(101) },
    { kind: "exercise", label: "Open", url: "https://example.com" },
    { kind: "meditation", label: "Open", autoplay: true },
  ])
    expect(
      replySchema.safeParse({ ...reply, practiceOffer: offer }).success,
    ).toBe(false);
});
it("rejects support offers and simultaneous exercise/offer payloads", () => {
  const practiceOffer = { kind: "current", label: "Choose music" };
  expect(
    replySchema.safeParse({ ...reply, kind: "support", practiceOffer }).success,
  ).toBe(false);
  expect(
    replySchema.safeParse({
      ...reply,
      kind: "practice",
      exercise: samples.worry,
      practiceOffer,
    }).success,
  ).toBe(false);
});
it("wire schemas require the nullable offer while reflection prohibits offers", () => {
  for (const intent of ["practice", "conversation", "reflection"] as const) {
    const schema = outputJsonSchemaForIntent(intent);
    expect(schema.required).toContain("practiceOffer");
    expect(schema.additionalProperties).toBe(false);
  }
  expect(
    outputJsonSchemaForIntent("reflection").properties?.practiceOffer,
  ).toEqual({ type: "null" });
  expect(
    outputJsonSchemaForIntent("conversation").properties?.exercise,
  ).toEqual({ type: "null" });
});

it("grounds Step Three in the creator's interview example without a reassurance or practice loop", () => {
  const stepThree = wisdomSteps.find((step) => step.step === 3)!.guidance;
  for (const required of [
    "replaying an interview",
    "God, the universe",
    "A secular path",
    "without waiting for Step Eleven",
    "Current",
    "explicit user choices",
    "Neither practice is mandatory",
    "actual follow-up responsibilities and deadlines",
    "move on while worry remains",
    "one stopping decision",
    "rather than repeated reassurance",
    "Respect a declined practice",
  ])
    expect(stepThree).toContain(required);
});

it("supports a conversational Step Four inventory without assigning fault or inventing a worksheet", () => {
  const stepFour = wisdomSteps.find((step) => step.step === 4)!.guidance;
  for (const required of [
    "spouse, boss",
    "guided conversational resentment inventory",
    "own observable actions, choices, needs",
    "rather than assigning blame",
    "a boundary or practical choice now",
    "Nothing here is mine",
    "abuse, coercion, danger or no-contact",
    "appropriate human support",
    "not a dedicated Step Four worksheet",
    "neither reconciliation, contact nor forgiveness",
  ])
    expect(stepFour).toContain(required);
});

it("helps choose a contextual human Step Five witness without substituting AI or banning family", () => {
  const stepFive = wisdomSteps.find((step) => step.step === 5)!.guidance;
  for (const required of [
    "AI helps prepare, not substitute",
    "sponsor or friend in recovery",
    "priest, spiritual guide, mentor",
    "friend further along a similar practice",
    "therapist or counselor",
    "Titles do not guarantee safety",
    "Significant others and family",
    "not an absolute exclusion",
    "limited, postponed or declined",
    "send anything automatically",
  ])
    expect(stepFive).toContain(required);
});

it("frames Step Six as introspection and readiness, not guaranteed removal or diagnosis", () => {
  const stepSix = wisdomSteps.find((step) => step.step === 6)!.guidance;
  for (const required of [
    "honest introspection",
    "list self-identified character defects",
    "Step Four",
    "reactivity or repeated justification",
    "never assign these labels",
    "healthier tools",
    "Higher Power of their understanding",
    "respect secular language",
    "not a guarantee of disappearance",
    "illness, disability or trauma symptoms",
    "preserve self-acceptance",
  ])
    expect(stepSix).toContain(required);
});

it("keeps the approved Step Six reflection before the small experiment", () => {
  const guidance = wisdomSteps.find((step) => step.step === 6)!.guidance;
  const ordered = [
    "revisit Step Four",
    "list recurring patterns and their costs",
    "choose one",
    "reflect on readiness",
    "include asking a Higher Power",
    "Only after this reflection",
    "small healthier-response experiment",
  ].map((phrase) => guidance.indexOf(phrase));
  expect(ordered.every((position) => position >= 0)).toBe(true);
  expect(ordered).toEqual([...ordered].sort((a, b) => a - b));
});

it("continues Step Six into Seven with the same pattern and language", () => {
  const stepSeven = wisdomSteps.find((step) => step.step === 7)!.guidance;
  for (const required of [
    "continue directly from Step Six",
    "same identified pattern or character defect",
    "person's same language",
    "do not reset the inventory",
    "If context is missing, ask",
    "Step Six is readiness; Step Seven",
    "same Higher Power understanding",
    "in secular language retain the same pattern",
    "without promising permanent disappearance",
    "reflection-before-experiment order",
  ])
    expect(stepSeven).toContain(required);
});

it("includes subtle daily harms in Step Eight without automatically contacting or apologizing", () => {
  const stepEight = wisdomSteps.find((step) => step.step === 8)!.guidance;
  for (const required of [
    "major harms and subtle same-day conduct",
    "snapping at a coworker",
    "spouse argument",
    "hurtful impatience with children",
    "not automatic proof of harm",
    "proportionate timely amend",
    "Step Eight lists and prepares",
    "Step Nine decides whether, how and when",
    "Step Ten supports daily reflection",
    "does not require immediate contact",
    "Respect no-contact and abuse/coercion safeguards",
    "nothing is sent automatically",
  ])
    expect(stepEight).toContain(required);
});

it("links Step Nine repair to surrender without pressuring contact or a favorable response", () => {
  const stepNine = wisdomSteps.find((step) => step.step === 9)!.guidance;
  for (const required of [
    "link repair to Step Three",
    "surrender the other person's reaction",
    "without requiring calm or accepting mistreatment",
    "major harms and small daily moments",
    "I just got snappy, I'm sorry",
    "conduct the person recognizes and owns",
    "avoid repeated apologies",
    "never requires unsafe contact",
    "abuse/no-contact boundaries",
    "indirect repair or human guidance",
    "Step Eight prepares willingness",
    "daily review/mini-inventory belongs primarily to Ten",
    "does not send messages or demand reconciliation",
  ])
    expect(stepNine).toContain(required);
});

it("routes optional daily review to Ten with Nine as a repair-discernment reference", () => {
  const ten = wisdomSteps.find((step) => step.step === 10)!.guidance;
  for (const required of [
    "primary home of the daily mini-inventory",
    "seemingly minor day-to-day problem",
    "Do not duplicate the mini-inventory",
    "nothing to repair is a valid result",
    "Step Nine can be a reference to discern whether an amend is appropriate",
    "without presuming harm or pressuring action",
    "Actual repair depends on conduct, impact, choice and safety",
    "respect declining or stopping",
    "without step labels",
    "No compulsory review",
  ])
    expect(ten).toContain(required);
  expect(wisdomSteps.find((step) => step.step === 8)!.guidance).toContain(
    "not a separate Step Eight review",
  );
  expect(wisdomSteps.find((step) => step.step === 9)!.guidance).toContain(
    "not a separate Nine inventory",
  );
});

it("offers early Step Eleven meditation with accurate durations and optional prayer", () => {
  const eleven = wisdomSteps.find((step) => step.step === 11)!.guidance;
  for (const required of [
    "from day one",
    "without completing earlier steps",
    "not a forced exercise",
    "Introduce prayer carefully",
    "Respect declined prayer and a fully secular path",
    "eventually 30 minutes daily if it fits",
    "not a rigid schedule, clinical dose",
    "Ember builder actually offers 2, 5, 10, 15 and 20 minutes",
    "no 1- or 30-minute session",
    "quiet timer offers 1, 2 and 5 minutes",
    "self-directed practice outside this builder",
    "local synthetic stock voice or captions only",
    "Preserve pause, stop and grounding",
    "never substitute meditation for urgent human help",
  ])
    expect(eleven).toContain(required);
});

it("gates proactive Twelve on explicit all-prior-step exposure without blocking ordinary help", () => {
  const twelve = wisdomSteps.find((step) => step.step === 12)!.guidance;
  for (const required of [
    "current context explicitly establishes exposure to each of Steps 1–11",
    "explicitly confirms familiarity with all 1–11",
    "Unknown/incomplete exposure means no proactive Twelve",
    "Never infer exposure from UI views, time, chat count, step labels or emotion",
    "not a durable verified completion tracker",
    "Direct questions about Twelve",
    "ordinary help/service requests",
    "urgent help remain answerable immediately",
    "do not force a history question",
    "one's own therapist",
    "appropriate and welcomed, never recruitment",
    "Respect capacity and boundaries",
    "actual Twelve Step program without waiting for Twelve",
    "Do not certify sponsorship readiness",
  ])
    expect(twelve).toContain(required);
});

it("keeps the global no-ladder guidance consistent with the proactive-only Twelve gate", () => {
  expect(instructions).toContain(
    "Only proactive Step Twelve invitations require",
  );
  expect(instructions).toContain(
    "direct explanation, other steps and ordinary help are not gated",
  );
});
