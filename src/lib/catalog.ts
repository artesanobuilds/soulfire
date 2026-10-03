import type { Exercise } from "./schema";
export const steps = [
  ["1", "Meet what is here", "Acceptance · honesty"],
  ["2", "Allow for possibility", "Hope · open-mindedness"],
  ["3", "Loosen your grip", "Surrender · trust"],
  ["4", "Look with honesty", "Courage · discernment"],
  ["5", "Let yourself be heard", "Trust · connection"],
  ["6", "Become willing", "Self-acceptance · willingness"],
  ["7", "Ask for help", "Humility · patience"],
  ["8", "Notice your impact", "Compassion · honesty"],
  ["9", "Make care tangible", "Love · care for the other"],
  ["10", "Return to your values", "Honesty · integrity"],
  ["11", "Make room for quiet", "Faith · commitment"],
  ["12", "Carry it into life", "Service · love"],
];
export const topics = [
  {
    id: "worry",
    label: "Worry that won’t let go",
    text: "I have a presentation tomorrow and keep imagining myself freezing.",
  },
  {
    id: "pattern",
    label: "A pattern I can’t break",
    text: "I keep opening the betting app at night, even after promising myself I won’t.",
  },
  {
    id: "care",
    label: "Feeling low or disconnected",
    text: "I feel flat and disconnected. Even small things feel hard today.",
  },
  {
    id: "conflict",
    label: "Conflict with someone",
    text: "I snapped at my partner and said something hurtful. I want to respond differently.",
  },
];
const base = {
  schemaVersion: 1 as const,
  actionPrompt: "What is one small thing you’re willing to do?",
};
export const samples: Record<string, Exercise> = {
  worry: {
    ...base,
    id: "acceptance-example",
    step: "1",
    principle: "Acceptance",
    title: "Prepare what’s yours. Release the rest.",
    purpose:
      "Tomorrow matters to you. Make room for the worry, and bring your attention back to what you can do.",
    blocks: [
      {
        id: "sort",
        type: "sort",
        title: "A little room around the worry",
        prompt:
          "Move each thought to where it belongs for you. Every suggestion is yours to change.",
        options: ["I can prepare", "I can influence", "I can release"],
        items: [
          "Rehearse my opening",
          "Speak slowly and pause",
          "Whether everyone approves",
        ],
      },
      {
        id: "feeling",
        type: "reflect",
        title: "Name what is here",
        prompt: "What are you feeling, without needing to fix it?",
        options: [],
        items: [],
      },
    ],
    actionSuggestion:
      "If I lose my place, I will pause and look at my next note.",
  },
  pattern: {
    ...base,
    id: "pattern-example",
    step: "3",
    principle: "Willingness",
    title: "Before the next urge.",
    purpose:
      "An urge doesn’t have to be something you face alone. Put a little support between the impulse and what happens next.",
    blocks: [
      {
        id: "arrives",
        type: "reflect",
        title: "Notice the moment",
        prompt:
          "When does the urge tend to arrive? What does it seem to offer?",
        options: [],
        items: [],
      },
      {
        id: "barrier",
        type: "choose",
        title: "Give yourself some support",
        prompt: "Choose one protective action you would actually use.",
        options: [
          "Use a gambling block or self-exclusion tool",
          "Contact a trusted person or recovery support",
          "Write my own protective step",
        ],
        items: [],
      },
      {
        id: "support",
        type: "reflect",
        title: "Let someone stand with you",
        prompt:
          "Who or what support could you turn to? You can leave this blank.",
        options: [],
        items: [],
      },
    ],
    actionSuggestion:
      "If I reach for the betting app, I will use my chosen barrier and reach out for support.",
  },
  care: {
    ...base,
    id: "care-example",
    step: "1",
    principle: "Acceptance",
    title: "One small act of care.",
    purpose:
      "You do not have to earn rest or solve everything today. Begin with what feels possible.",
    blocks: [
      {
        id: "need",
        type: "choose",
        title: "What would help a little?",
        prompt: "There is no right answer. You can choose again.",
        options: ["Rest", "Support from someone", "One very small action"],
        items: [],
      },
      {
        id: "care",
        type: "choose",
        title: "Keep it small enough",
        prompt: "Choose something manageable, or write your own action below.",
        options: [
          "Drink some water",
          "Open the curtains",
          "Message someone I trust",
        ],
        items: [],
      },
    ],
    actionSuggestion: "After my next cup of tea, I will open the curtains.",
  },
  conflict: {
    ...base,
    id: "repair-example",
    step: "10",
    principle: "Integrity",
    title: "Return to what matters.",
    purpose:
      "You can acknowledge your own words without taking responsibility for someone else’s behavior. Safety and boundaries come first.",
    blocks: [
      {
        id: "event",
        type: "reflect",
        title: "Separate the moment from the story",
        prompt:
          "What happened, and what did you feel? Leave out guesses about their motives.",
        options: [],
        items: [],
      },
      {
        id: "ownership",
        type: "choose",
        title: "What is yours to carry?",
        prompt: "You are never responsible for harm done to you.",
        options: [
          "There is something I want to repair",
          "A boundary matters more right now",
          "Nothing further is mine to own",
        ],
        items: [],
      },
      {
        id: "repair",
        type: "reflect",
        title: "Make room for a careful response",
        prompt:
          "If it is safe and welcome, what would you like to say? Writing this does not contact anyone.",
        options: [],
        items: [],
      },
    ],
    actionSuggestion:
      "If we both feel ready, I will acknowledge my hurtful words without demanding a response.",
  },
  quiet: {
    ...base,
    id: "quiet-example",
    step: "11",
    principle: "Commitment",
    title: "A moment to listen.",
    purpose:
      "Make a little space for quiet, in whatever language feels true to you. Nothing special needs to happen.",
    blocks: [
      {
        id: "intention",
        type: "reflect",
        title: "An intention for this moment",
        prompt:
          "What guidance or strength would you welcome today? You may also simply sit.",
        options: [],
        items: [],
      },
    ],
    actionSuggestion:
      "Before my next task, I will pause and notice what matters.",
  },
};
