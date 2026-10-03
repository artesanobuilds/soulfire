# Vision

## Creator's direction

Soulfire is an experimental AI companion with elements of a mental health coach, life coach, and Twelve Step sponsor. Its purpose is to help people move toward the next level they want in life and find spirituality as an anchor.

The vision is a twelve-step spiritual program with interactive exercises for every step. It helps people deepen their connection to spirituality and apply spiritual principles to the mental health challenges and everyday life problems they are struggling with. Spiritual principles guide the companion's suggested solutions, practices, and practical responses, connecting reflection to action in daily life. This is the intended approach, rather than a promise that spirituality will solve every problem.

The creative approach is inspired by Rick Rubin: make something meaningful, explore its usefulness through experimentation, and avoid making market size, positioning, or a predefined commercial use case the starting point. This describes the creator's intent, not a researched summary of Rubin's teachings.

The Twelve Steps are the proposed backbone. The creator generalizes them beyond alcohol and addiction into a program oriented toward spiritual awakening. Initial interpretations of all twelve steps are captured in [Twelve Steps](twelve-steps.md). Daily prayer and meditation are central practices, and passing the practice on to others is part of the program.

The Twelve Steps remain the organizing foundation as the project evolves. Each step's meaning can deepen and expand through new perspectives, reflection, and experience. Connect additional teachings back to the relevant steps and consolidate overlapping language rather than continually introducing separate concepts. For example, the creator identifies surrender with Step Three's practice of accepting the world as it is and turning things over to a higher power.

Carl Jung's teachings are another intended source. The creator sees a connection between Jung and the Steps. Historical claims and particular teachings need sourced research before becoming authoritative agent knowledge.

Addiction and compulsive patterns remain central. The creator emphasizes that these can involve alcohol, drugs, pornography, gambling, shopping, and other behaviors, and believes many people struggle with patterns they do not recognize as addiction. This belief is part of the creative context, not a clinical claim that all such behaviors are equivalent or that most people have a diagnosable addiction.

## Desired experience

The companion should do more than converse. A strong interactive UI should let people practice exercises for each of the twelve steps, with relevant spiritual principles and tools tailored to the struggles they bring.

Text, dictation, and live voice should be interchangeable, similar to the interaction flexibility of ChatGPT. A person can type, dictate an editable message, or speak with the companion and hear its response. Switching modes should preserve the conversation and the current exercise. Voice is a core part of the intended experience on mobile and desktop.

A proposed journey from the creator:

1. Ask what the person is struggling with in life.
2. Use their answer to assemble relevant spiritual principles and tools.
3. Present exercises in an interactive interface that help with that particular struggle.
4. Organize the experience around twelve steps.

The initial direction explored an app inside ChatGPT. The creator is now considering a standalone app using OpenAI APIs, accessible on mobile and desktop, to support a stronger exercise-centered experience. The platform decision remains open; a responsive web prototype is the current strategy recommendation. A future ChatGPT integration remains possible.

Exercises should be generated for each person based on the problems they are trying to address. The agent should personalize prompts, content, and exercise structure, with a UI that adapts to the practice. A proposed implementation is to compose reliable interactive components from validated exercise specifications.

See the [supplied research](../research/soulfire-research-dossier.md) and [proposed strategy](../strategy/product-strategy.md) for research implications, architecture, and next moves. Research recommendations are inputs for review rather than automatically adopted doctrine.

## Proposals discussed, not yet settled

- Curated exercise components selected and personalized by the agent.
- A map of practices people can revisit, rather than a rigid completion ladder.
- A first prototype covering conversation, a suggested practice, an exercise, reflection, and a next step.
- A reusable backend so the same knowledge and exercises can support either interface.
- Spiritual language that accommodates each person's beliefs and uncertainty.
