# Custom Meditation Generator: Research Foundation & Engineering Spec (October 2026)

The science supports building this feature, but only for a narrow set of design choices. Exhale-emphasized slow breathing, slow, simple instrumental music with optional nature sound, a calm and user-tunable synthetic voice, and short sessions of 5–20 minutes all have reasonable evidence. Most "neuro" marketing does not: 432 Hz, solfeggio, binaural "entrainment," and "the world's most relaxing song." Treat this as a low-risk **general wellness** product with real (non-trivial) psychological side-effect rates. Do not present it as a treatment.

## TL;DR
- **Build defaults on the strongest evidence.** Use paced breathing at about 5.5–6 breaths/min with exhales longer than inhales. Use instrumental beds near 60–80 BPM (or beatless), with low complexity and soft dynamics. Use a slow, warm TTS voice the user can tune for pitch, rate and pause length. Sessions of 5–20 minutes are enough: more dose has not reliably produced more benefit.
- **Personalization helps on comfort and engagement more than on clinical outcomes.** Tailored music and user-tuned voices improve ratings. Just-in-time/adaptive interventions produce only small effects (g = 0.15 across 23 studies).\[1\] Engagement, not acoustic detail, is the binding constraint, with median 30-day retention of 3.3% in mental-health apps.\[2\]
- **Safety and legal guardrails are product requirements, not polish.** In a representative sample of 886 US adult meditators (Van Dam et al. 2025, *Clinical Psychological Science*), 58.4% reported at least one adverse effect and 9.1% reported functional impairment. Mental health symptoms or psychological distress in the 30 days before meditating predicted adverse effects. Several states now ban AI-delivered "therapy."\[3\] Music licensing differs sharply by vendor, so prefer licensed-data generators (ElevenLabs Music, Stable Audio, Lyria) over Suno for an app pipeline.

## Evidence rating key
- **Strong:** several meta-analyses or large RCTs that agree.
- **Moderate:** a meta-analysis with heterogeneity, or several RCTs.
- **Weak:** small RCTs, pilots, or single studies.
- **Speculative:** mechanism-based or expert convention, not tested for this use.
- **Unsupported:** tested and not supported, or marketing only.

---

## 1. Key Findings at a Glance

| Design choice | Recommended default | Evidence | Primary basis |
|---|---|---|---|
| Breathing rate | 6 breaths/min (10 s cycle); offer 5.5–6.5 | Moderate | Resonance frequency literature (Lehrer & Gevirtz); Shao, Man & Lee 2024, *Mindfulness* meta-analysis (31 studies, total n = 1,133) |
| Inhale:exhale | Longer exhale, e.g. 4 s in / 6 s out; optional cyclic sighing | Moderate (single strong RCT) | Balban et al. 2023, *Cell Reports Medicine*, N=108 |
| Individual resonance | Optional calibration 4.5–7 bpm via HRV | Moderate (mechanism), weak (consumer wearables) | Shaffer & Meehan 2020 practical guide |
| Music tempo | 60–80 BPM or beatless; never accelerating | Moderate | de Witte 2020 (104 RCTs; tempo moderator trend p=.064) |
| Music complexity | Instrumental, diatonic, slow harmonic rhythm, small dynamic range | Moderate | Tan et al. 2012 feature analysis; sleep-music reviews |
| Nature sound layer | Water (tranquility) or birdsong (stress) as an optional layer | Moderate | Buxton et al. 2021, *PNAS* (36 papers, 18 meta-analyzed) |
| Self- vs. researcher-selected music | Let the user choose among curated, pre-validated "calm" styles | Mixed/weak | de Witte 2020 (no significant moderator); Maidhof 2023; Groarke 2019 |
| Voice | High-quality neural TTS with user-adjustable pitch/rate/pause | Moderate (perception), weak (outcomes) | TMB voice study; arXiv 2401.03581; Sci Rep 2025 |
| Session length | 5–15 min default, 20 max for most sessions | Moderate | Strohmaier 2020 meta-regression (203 RCTs); Strohmaier 2021 RCT |
| Meditation type by goal | Breathwork/body scan for acute stress; mindfulness for sleep; LKM + mindfulness for anxiety/self-criticism | Moderate | Balban 2023; Rusch 2019; Zheng 2023 |
| 432 Hz / solfeggio | Do not claim; do not build as a feature | Unsupported/weak | Calamassi & Pomponi 2019 pilot, n=33 |
| Binaural "entrainment" | Do not claim entrainment; optional texture only, with headphones disclaimer | Weak mechanism | Ingendoh 2023 (5/14 EEG studies supportive) |

---

## 2. Breathing Protocols

**What the evidence says**
- **Resonance breathing.** Breathing near 0.1 Hz (about 6/min) maximizes respiratory sinus arrhythmia and baroreflex gain.\[4\] The individual resonance frequency typically falls between 4.5 and 7 breaths/min.\[5\] Shaffer & Meehan's practical guide gives 4.5–6.5 bpm for adults.\[6\] The standard Lehrer/Gevirtz assessment steps through 4.5–7 bpm in 0.5 bpm increments for about 2 minutes each.\[7\] Taller people and males tend to have slower resonance rates, which is mechanistically tied to blood volume.\[4\] A fixed 6/min default is a reasonable population approximation, and calibration adds marginal value.
- **Exhale-emphasized breathing.** Balban et al. (2023, *Cell Reports Medicine*, NCT05304000) randomized participants to 5 min/day for 28 days of one of four practices: cyclic sighing, box breathing, cyclic hyperventilation, or mindfulness meditation.\[8\]\[9\] Cyclic sighing is a double inhale through the nose followed by a long exhale. Breathwork, especially cyclic sighing, produced greater improvement in positive affect (p < 0.05) and a greater reduction in respiratory rate (p < 0.05) than mindfulness meditation.\[10\] One secondary analysis reports that state-anxiety reductions were nearly identical between mindfulness and cyclic sighing.\[11\] Treat the trial as showing a mood/arousal advantage, not an anxiety advantage. It is a single remote trial in healthy volunteers.
- **Panic/hyperventilation caveat.** Meuret's capnometry-assisted respiratory training (CART) work shows that for people prone to hyperventilation, *deep* breathing can worsen hypocapnia and symptoms. The therapeutic target is slower **and shallower** breathing.\[12\]\[13\] Capnometry-guided respiratory intervention for panic disorder (Freespira) is an FDA-cleared device pathway, which signals that breathing for *panic disorder* is regulated medical territory.\[14\]

**Engineering parameters**

| Parameter | Default | Range / options | Notes |
|---|---|---|---|
| Cycle length | 10 s (6/min) | 8.6–13.3 s (4.5–7/min) | Adjustable slider; calibration optional |
| Inhale:exhale | 4:6 s | 1:1 to 1:2 | Exhale-longer as default |
| Breath holds | None by default | Box breathing (4-4-4-4) as opt-in | Holds have less evidence and may provoke air hunger |
| Cyclic sighing module | 5 min | 3–5 min | Double inhale + long exhale |
| Ramp-in | 2–3 cycles at the user's natural pace, then slow by ~1 bpm per minute | — | Avoid an abrupt jump to 6/min |
| Depth cue language | "gentle," "soft," "easy," "low and slow" | — | Never "take a big deep breath" |
| Cueing modality | Voice cue for the first 3–5 cycles, then music swell/tone only | Haptic (watch), visual orb | Reduces talk density |

**Music as a breath pacer (speculative but low risk).** Align bar or swell length to the breath cycle. At 60 BPM, a 10-s cycle is 10 beats. A practical approach is a 4/4 bed at 60 BPM, with a swell rising over 4 beats (inhale) and falling over 6 beats (exhale). Alternatively, use a beatless pad with amplitude modulation at 0.1 Hz. This has not been validated as superior to voice cueing, so A/B test it.

**Contraindications / gating (product requirements)**
- If onboarding reports panic attacks, current panic disorder, COPD/asthma, pregnancy, or cardiovascular conditions, default to "natural breath awareness" with no pacing. Show breath pacing as opt-in, labeled "go gently."
- Never ship cyclic hyperventilation, Wim Hof–style, or "holotropic" breathing.
- Add a "this is making me feel worse" button in every breathing segment. It returns the user to natural breathing plus grounding, such as feet on floor and eyes open.

---

## 3. Music Parameters

**What the evidence says**
- **Overall effects.** Music interventions reduce stress with d ≈ .38 on physiological and d ≈ .55 on psychological outcomes (de Witte et al. 2020, 104 RCTs). Moderator analyses found no significant difference between predetermined relaxing music and patient-preferred music, or between lyrics and instrumental music. For tempo, music at 60–80 BPM showed a trend toward larger physiological effects (p = .064).\[15\]
- **Features of relaxing music.** Slow tempo, small dynamic changes, low rhythmic complexity, diatonic harmony and mostly instrumental (Tan et al. 2012 analysis of 30 relaxation pieces).\[16\] Sleep-music reviews converge on 60–80 BPM, soft and smooth melodies, simple structure, and instrumental. Some include minor tonalities, so mode is not a strong lever.\[17\]
- **Nature sounds.** Buxton et al. (2021, *PNAS*) reviewed 36 publications and meta-analyzed 18.\[18\] Natural sounds improved health outcomes and reduced stress and annoyance. Water sounds had the largest effects on health and positive affect, and birdsong the largest on stress/annoyance.\[18\]\[19\] A 2024 meta-analysis in *Stress* (Fan & Baharum) found natural sounds differed significantly from a quiet environment on heart rate (p = 0.006), blood pressure (p = 0.001) and respiratory rate (p = 0.032). It found no significant difference for mean arterial pressure, perceived stress or SpO2. Caveat: many control conditions were traffic noise, which inflates contrasts.
- **"Weightless" (Marconi Union).** The 65% anxiety-reduction claim comes from a commercial test by Mindlab International (led by Dr. David Lewis-Hodgson) of a track made with the British Academy of Sound Therapy. Secondary reports describe the track being played to 40 women. It is not peer-reviewed research. The 60→50 BPM deceleration is a reasonable design idea but is **speculative**.
- **432 Hz.** Calamassi & Pomponi (2019, *Explore*) ran a double-blind crossover pilot with n=33. Heart rate fell 4.79 bpm more with 432 Hz (p = 0.05), with non-significant BP and respiratory changes. The authors themselves call for larger RCTs.\[20\]\[21\] A 2025 randomized crossover in cancer patients (*BMC Complementary Medicine and Therapies*) found median HR reductions of −3 vs −1 bpm (432 vs 443 Hz, p = 0.04).\[22\] These are small, under-powered effects at p-values near threshold. Retuning 440→432 Hz is a pitch shift of about a third of a semitone.\[23\] **Rating: weak/unsupported. Do not market.**
- **Binaural beats.** The pooled behavioral effect is g = 0.45 (Garcia-Argibay 2019), but EEG entrainment was supported in only 5 of 14 studies (Ingendoh 2023). Binaural beats require headphones and add no plausible benefit on speakers.

**Engineering parameters**

| Parameter | Default | Evidence | Rationale |
|---|---|---|---|
| Tempo | 60–70 BPM, or beatless/rubato | Moderate | Strongest moderator signal |
| Tempo over session | Hold constant or decelerate ≤10% (e.g., 66→60) across the session; never accelerate | Speculative | Arousal-reduction logic; untested in generated beds |
| Instrumentation | Warm pads, soft piano, felt piano, strings, low flute, ambient guitar; no percussion transients | Moderate | Low rhythmic complexity |
| Harmony | Diatonic, 1–2 chords per 8–16 s, drones welcome; avoid dissonant suspensions resolving late | Moderate/speculative | Low harmonic complexity |
| Key/mode | User preference; no evidence that major or minor is superior | Weak | Mixed in sleep literature |
| Dynamics | ≤6 LU short-term loudness variation; no sudden onsets | Moderate (feature studies) | Startle avoidance |
| Spectral | Gentle roll-off above ~8 kHz; carve 1–4 kHz (voice presence band) by 3–6 dB under narration | Speculative (audio engineering convention) | Intelligibility |
| Vocals/lyrics | None in beds | Moderate (competes with narration) | Lyrics compete with speech processing |
| Nature layer | Optional: water or birdsong, −6 to −12 dB below music | Moderate | Buxton 2021 |
| Binaural/isochronic | Off by default; optional "texture," no claims | Weak | Mechanism unsupported |
| Tuning | A=440 Hz standard; do not expose 432/solfeggio | Unsupported | See above |

**Loudness and mixing (industry convention, not health evidence)**
- Master the final mix to about −16 LUFS integrated with a true peak ≤ −1 dBTP for mobile. Sleep content can sit at −18 to −20 LUFS.
- Duck music 12–18 dB under narration, with an attack of about 200–400 ms and a release of 800–1500 ms so the bed "breathes" back between phrases. Users should be able to set the voice/music balance.
- Use sidechain or frequency-dependent ducking (a dynamic EQ dip at 1–4 kHz) rather than broadband ducking, so the bed stays continuous.

**Repetition, habituation, familiarity**
- Habituation to looped content is untested for generated meditation beds. Looping is low-risk if the loop is long (≥90–180 s), has no salient melodic "hook" that announces the seam, and is layered (pad + texture + nature) with independently looping layers of co-prime lengths so the composite rarely repeats exactly.
- Familiarity effects favor reusing a user's preferred bed across sessions, which supports a "favorite soundscape" feature. Direct evidence for meditation is weak.

---

## 4. Voice and Narration

**What the evidence says**
- **Human vs. synthetic.** In a 2×2 study (human/synthetic × female/male) by Menhart & Cummings (2022, *Technology, Mind, and Behavior*), participants guided by a human voice rated the meditation as more enjoyable and useful and themselves as more relaxed. The usefulness gap was significantly larger with female voices.
- **User-tuned TTS.** In arXiv 2401.03581 (2024), the best human therapist voice beat all TTS voices. TTS was rated poorly on emotional expressiveness and naturalness but well on clarity.\[24\] When users fine-tuned **pitch, speed and break time**, personalized TTS scored significantly above non-personalized TTS and "almost as well as human voices."\[25\]\[26\] At least one stock TTS voice matched the lowest-rated human voice.\[25\]
- **Trained AI voices and personality fit.** A 2025 *Scientific Reports* study found that mindfulness exercises voiced by trained AI voices were indistinguishable from human ones in a categorization task. A **mismatch between voice personality and the mindfulness setting** significantly lowered evaluations.\[27\] Voice *casting* matters as much as model quality.
- **Unverified claim to avoid.** A widely circulated web article cites a "2023 *Psychophysiology*" crossover (n=84) showing AI voices lowered HR less than human voices.\[28\] I could not trace it to a primary source, so do not cite it.

**Engineering parameters**

| Parameter | Default | Evidence | Notes |
|---|---|---|---|
| Voice selection | 4–6 curated voices (varied gender, age impression, accent), all pre-screened for "calm/warm" fit | Moderate | Personality–context match matters |
| User tuning | Exposed sliders: rate, pitch, pause length | Moderate | arXiv 2401.03581 |
| Speech rate | About 90–120 wpm during instruction (vs. ~150 conversational); slower for sleep | Speculative (practitioner convention) | Implement via SSML rate ≈ 0.8–0.9 |
| Pauses | 2–4 s between sentences; 10–30 s for "rest in silence"; 45–90 s silences only for experienced users | Speculative | Guidance density adjustable |
| Pitch | Slightly lowered (−1 to −2 semitones relative to the voice's default), never monotone | Weak | Relaxed speech is lower and softer |
| Prosody | Falling terminal intonation; avoid upspeak and "announcer" energy | Speculative | Evaluate with listening panels |
| Breathiness/warmth | Moderate; avoid ASMR-style whisper by default (polarizing) | Speculative | Offer as an option |
| Second person | "You might notice…", invitational modals ("you may," "if you like") | Speculative/expert (trauma-sensitive practice) | Gives agency |
| User's name | Use at most at open/close; opt-in | Speculative | Self-referential cues capture attention; may feel uncanny |
| Language | Native-language voices and scripts; Spanish generated natively, not translated | Speculative (cultural adaptation literature) | Culturally adapted imagery |

**Voice cloning / self-voice / familiar voices**
- No adequate evidence shows that hearing one's own or a loved one's cloned voice improves meditation outcomes. It is **speculative** and carries high ethical and legal risk, including grief triggers, impersonation, and right-of-publicity issues.
- If built at all, restrict it to the user's own voice with explicit, revocable consent, liveness verification and on-device or encrypted storage. Never allow cloning a third party. Disclose that all narration is AI-generated.

---

## 5. Script Content and Meditation Types

**Evidence by type**
- **Mindfulness (focused attention/open monitoring).** Mindfulness-based programs show effects vs. inactive controls of d ≈ −0.49 for anxiety, −0.73 for depression and −0.73 for stress (Strohmaier 2020, 203 RCTs).\[29\] Effects are smaller vs. active controls. App-delivered mindfulness shows small effects (Linardon 2024: g = 0.24 depression, 0.28 anxiety).
- **Sleep.** Rusch et al. (2019, *Annals NYAS*) found mindfulness improved sleep quality vs. nonspecific active controls (ES 0.33 post-intervention; 0.54 at follow-up), with moderate strength of evidence.\[30\]
- **Loving-kindness/compassion.** LKCM reduces anxiety with small-to-medium effects (Zheng et al. 2023, *Mindfulness*). Studies combining LKM **with** mindfulness outperformed LKM alone.\[31\]\[32\] LKM increases self-compassion (g = 0.44; Reilly & Stuyvenberg 2023, 7 studies).\[33\] Self-compassion interventions also reduce depression, anxiety and stress (Han & Kim 2023 meta-analysis).\[34\]
- **Breathwork.** Brief exhale-focused breathwork beat mindfulness on daily positive affect (Balban 2023).\[35\]
- **Body scan / yoga nidra / NSDR.** Body scan is a core MBSR component. Standalone yoga nidra/NSDR evidence is mostly small trials (**weak**). "NSDR" is a branding term, not a validated construct.
- **Dose.** Strohmaier's meta-regression found no robust dose–response for distress outcomes.\[36\]\[37\] In a randomized experiment (n=71), four 5-min practices matched or outperformed four 20-min practices on stress and trait mindfulness.\[38\]\[39\] Online/self-help programs in that database recommended a mean session of 26 minutes (range 6–60).\[40\] A separate MBSR/MBCT meta-analysis did find a small home-practice association (Parsons 2017, r = 0.26), so frequency and consistency may matter more than session length.\[29\]\[40\]

**Goal → protocol mapping (defaults)**

| User goal | Primary practice | Secondary | Length | Evidence |
|---|---|---|---|---|
| Acute stress ("I need to calm down now") | Cyclic sighing / extended-exhale breathing | Short body scan | 3–7 min | Moderate |
| General anxiety | Mindfulness of breath + LKM/self-compassion closing | Grounding (senses) | 8–15 min | Moderate |
| Low mood | Self-compassion / LKM, behavioral-activation-flavored closing | Gentle movement awareness | 8–15 min | Moderate (small effects) |
| Sleep onset | Body scan + slow breathing, fading guidance, music continues after voice ends | Nature sound bed | 15–30 min (voice 10–15) | Moderate |
| Focus | Focused-attention breath counting | Open monitoring | 5–10 min | Weak–moderate |

**Script structure template**
1. **Arrival (10–15%):** posture options including "eyes open is fine," consent language and the exit option.
2. **Settling breath (10–20%):** natural breath first, then optional pacing.
3. **Core practice (50–60%):** the chosen technique, with guidance density decreasing over time.
4. **Integration (10%):** a gentle return. For sleep, the voice fades out and there is no "wake-up" cue.
5. **Closing (5%):** orienting cues (sounds in the room, movement of fingers), except for sleep sessions.

**Guidance density.** Start at about 60–70% speech time in the first minutes and fall to 20–30% by the core. Beginners need more guidance and experienced users more silence. This is **speculative**, so test it.

---

## 6. Personalization

**What the evidence says**
- Personally tailored music therapy shows larger effects (d ≈ .72; de Witte 2022), but self- vs. researcher-selected music comparisons are mixed (Maidhof 2023; Groarke 2019).
- User-tuned voices substantially improve perceived quality (arXiv 2401.03581).\[25\]
- JITAIs/ecological momentary interventions for mental health produce a **small** effect (g = 0.15, 95% CI 0.05–0.26, K = 23 studies, N = 2,563; von Lützow et al. 2025, *BMJ Mental Health*). Effects persisted at 1 and 3–6 months in the 9 studies with follow-up.\[1\]\[41\]
- Closed-loop prior art: EarStreAM (arXiv 2609.19127) generates about 280-word segments with an LLM (DeepSeek V4 Pro), conditioned on physiological state plus user-configured voice, theme and style. It renders them with ElevenLabs Flash v2.5 or Tencent TTS.\[42\] This is a research prototype, not outcome evidence.

**Inputs that plausibly matter (priority order)**
1. **Goal** (stress/sleep/anxiety/mood/focus). This selects the protocol, and the evidence differs by protocol.
2. **Current state check-in** (1–2 taps: tense ↔ calm, tired ↔ alert, and a distress screen). This drives safety gating and session choice.
3. **Experience level.** Sets guidance density and silence length.
4. **Sensory preferences.** Voice, music style, nature layer and volume balance.
5. **Time of day.** Night sessions get sleep-mode mixing with no closing alerting cues.
6. **Wearable data (optional).** HR/HRV for post-session feedback and resonance calibration. Under the January 6, 2026 FDA general wellness guidance, sensor-based HRV outputs are eligible for wellness treatment if used solely for wellness.\[43\]

**Risks of over-personalization**
- Mirroring the user's disclosed problems back into scripts can amplify rumination or trauma content.
- Uncanny effects from name overuse.
- Spurious "biofeedback" from noisy wrist HRV.
- Privacy exposure of mood data.
- **Rule:** personalize *form* (voice, music, length, technique) freely, and personalize *content* (life details) sparingly and only from an allow-list.

---

## 7. Safety and Clinical Guardrails

**Evidence**
- In a representative sample of 886 US meditators (Van Dam et al. 2025, *Clinical Psychological Science*), 58.4% reported at least one adverse effect on a 30-item checklist.\[44\] 9.1% reported functional impairment and 6.6% reported strong, extremely unpleasant experiences.\[45\] Psychological distress in the prior 30 days predicted adverse effects.\[46\]
- App-first exposure has been associated with adverse effects (Goldberg/Britton 2021), and dissociation predicts lasting impairment (Britton 2021).
- Trauma-sensitive mindfulness (Treleaven) emphasizes choice, open eyes, external anchors, and titrated interoception.

**Product requirements (MUST)**
1. **Onboarding screen.** Ask about current panic, trauma/PTSD, psychosis/bipolar history, dissociation, and recent suicidal thoughts. Positive answers route to grounding-forward, eyes-open, short sessions with no long silences or deep interoceptive body scans, plus resources.
2. **Pre-session check-in.** Severe distress triggers a crisis pathway: show the 988 Suicide & Crisis Lifeline (call/text 988) and do not start a long meditation.
3. **In-session exit.** A persistent "pause / I feel worse" control that triggers a 60-s grounding script (external senses, orienting).
4. **Post-session micro-survey** with an adverse-effect item ("Did anything feel unpleasant or distressing?"), logged as a harms metric.
5. **LLM script guardrails.**
   - The LLM fills a structured template. It is not free-form.
   - Prohibited: diagnosis, treatment claims, medication advice, trauma excavation ("return to a painful memory"), death/void imagery, ego-dissolution or "no-self" instructions, breath holds over 5 s, hyperventilation, and body-specific claims (e.g., "lower your blood pressure").
   - Output passes a classifier and policy filter before TTS. Any user free-text that suggests self-harm is diverted to the crisis flow, never into the script.
6. **Clinical governance.** A licensed clinician signs off on templates, prohibited-content lists and the escalation flow. Quarterly review of harm logs.
7. **Informed expectations.** One plain-language screen saying meditation sometimes brings up unpleasant feelings, how to stop, and that this is not therapy.

---

## 8. Measurement and Evaluation

**Validated outcome measures**
- **State (per session):** STAI-6 (state anxiety), a 1-item SUDS/0–10 calm rating, and the Toronto Mindfulness Scale or State Mindfulness Scale.
- **Weekly/monthly:** PSS-10 (stress), GAD-7 (anxiety), PHQ-9 (depression; item 9 requires a crisis protocol), and PSQI or ISI (sleep). Add a meditation adverse-effects checklist modeled on Van Dam's 30-item instrument.\[47\]
- **Physiological (optional):** respiration rate (watch or phone microphone), HR and RMSSD before vs. during vs. after. Treat these as exploratory because wrist HRV is noisy.

**Engagement benchmarks**
- Baumel et al. (2019, *JMIR*) studied 93 mental-health apps, 59 of which had retention data. They report a median daily open rate of 4.0%, 15-day retention of 3.9% and 30-day retention of 3.3%.\[2\]\[48\]\[49\]
- Mindfulness/meditation apps did better (median 30-day retention 4.7%; median 21.5 daily minutes among active users). Breathing-exercise apps had a median 30-day retention of 0.0%.\[50\]\[51\]
- Target: beat 4.7% day-30 retention among installers, and track completion rate per session.

**Experiment ladder**
1. **Component A/B tests** (within-app, randomized): voice tuning on vs. off, music-paced breath cueing vs. voice cueing, nature layer on vs. off, guidance density. Primary metric: post-session calm change and completion. Secondary: 7-day return.
2. **Micro-randomized trial** to test JITAI prompts (timing, state-triggered suggestions).
3. **Pragmatic RCT** (8 weeks): personalized generator vs. a static library of the same techniques vs. waitlist. Outcomes: PSS-10/GAD-7, with adverse effects as a pre-registered secondary outcome. Use an active comparator, since apps are not superior to active treatments.

---

## 9. Regulatory and Legal

- **FDA.** The January 6, 2026 "General Wellness: Policy for Low Risk Devices" guidance keeps the two-part test: wellness-only intended use and low risk. It newly allows non-invasive sensor outputs (including HRV) for wellness.\[43\]\[52\] Claims to stress management, relaxation and sleep are wellness claims. Claims to treat or diagnose anxiety disorders, depression, insomnia disorder or panic disorder turn the product into a device (compare FDA-cleared capnometry for panic).
- **State AI-therapy laws.**
  - Illinois' WOPR Act (HB 1806, signed August 2025; penalties up to $10,000 per violation) bans AI-delivered therapy. It exempts self-help and educational materials that do not purport to offer therapy.\[53\]\[54\]
  - Nevada AB 406 (effective July 1, 2025; up to $15,000) is a similar practice ban.\[55\]
  - Utah HB 452 (effective May 7, 2025) requires disclosure that a mental-health chatbot is AI, and restricts data sales and advertising.\[55\]
  - Maine (LD 2082, April 2026) has also acted, as has Rhode Island, according to secondary trackers.\[3\]\[54\]
  - New York and California impose crisis-detection duties on companion chatbots.\[56\]
  - **Implication:** never market the generator as "AI therapy" or an "AI counselor." Disclose AI narration everywhere, and keep conversational features out of it.
- **FTC.** Health claims need competent and reliable scientific evidence. Avoid "clinically proven," "reduces anxiety by X%," "rewires your brain," and "healing frequencies."
- **HIPAA.** It applies if the app operates as or for a covered entity or business associate (e.g., a provider-integrated mental-health platform). Otherwise, the FTC Health Breach Notification Rule and state consumer-health privacy laws apply. Mood check-ins and HRV are sensitive health data.
- **AI music licensing.**
  - **Suno:** Warner Music settled in November 2025. Suno's first partially licensed models (v6, covering Warner, BMG and Believe catalogs) shipped in September 2026. Secondary reports say UMG and Sony suits remained active then. Paid-plan users get commercial-use rights but are "generally not considered the owner." Downloads are capped, and there is no first-party developer API.\[57\]\[58\]\[59\]
  - **ElevenLabs Music:** trained on licensed data and cleared for broad commercial use on paid plans. Self-serve excludes film, TV and games.\[60\]\[61\]
  - **Stable Audio 2.5:** trained on a fully licensed dataset; on-prem enterprise license.\[62\]
  - **Google Lyria:** outputs carry a SynthID watermark; paid-tier API content is not used for training.\[63\]\[64\]
  - **Copyright:** purely AI-generated audio is likely not copyrightable by you, so competitors can reuse your beds.
- **Voice cloning.** This requires written consent and right-of-publicity compliance (e.g., Tennessee ELVIS Act, California and New York digital-replica laws). Use only licensed stock voices or the user's own voice with consent.
- **AI disclosure.** Label narration and music as AI-generated, both in the player and in the terms.

---

## 10. Technical Architecture

**Pipeline**
1. **Intake:** goal, check-in, safety flags, preferences and optional wearable data → session spec (JSON).
2. **Script generation:** the LLM fills a clinician-approved template. Output is a structured list of segments: {type, text, pause_after_s, breath_cue}. A policy filter and classifier then runs, followed by a deterministic length check (target words = minutes × wpm × speech fraction).
3. **TTS:** render segment by segment. Use SSML `<break time>` and prosody rate/pitch where supported, or insert silence programmatically, which is more reliable across vendors. Normalize each clip.
4. **Music:** select from a pre-generated, human-QC'd **library of loopable beds** keyed by style/BPM/key/length (recommended). Alternatively, generate on demand and run loop engineering.
5. **Loop engineering:**
   - Request an instrumental at fixed BPM.
   - Trim intro and outro.
   - Pick loop points on bar boundaries (beat-tracker) near zero-crossings.
   - Apply a 0.5–2 s equal-power crossfade (cos/sin gains) from tail to head.
   - Verify with an automated seam detector (spectral flux and RMS discontinuity at the seam).
   - For beatless pads, use longer (4–8 s) crossfades.
   - Store as WAV/FLAC master. Deliver as Opus/OGG or AAC with gapless metadata, never raw MP3 (encoder padding breaks loops). Alternatively, play via the Web Audio API/AVAudioEngine with sample-accurate scheduling.
6. **Mix/master:** voice bus plus music bus with sidechain ducking (12–18 dB) and a dynamic EQ dip at 1–4 kHz. Nature layer. Target −16 LUFS, true peak ≤ −1 dBTP.
7. **Delivery:** stream the voice track and loop the bed client-side. This saves bandwidth and lets the bed continue indefinitely for sleep. Cache on device.

**Provider comparison (as of October 2026; verify before contracting)**

| Provider | Role | Loopability | Licensing | API | Price (list) |
|---|---|---|---|---|---|
| ElevenLabs Music | Music | Instrumental flag, composition plans; output needs loop engineering. Sound-effects endpoint offers a `loop` option for ≤30 s ambience | Licensed training; commercial on paid plans (self-serve excludes film/TV/games) | Yes (POST /v1/music); PCM/Opus outputs | $0.15/min per official API pricing page (third-party summaries list $0.30; confirm) |
| Google Lyria 3.5 / 3 Clip | Music | Full songs/30-s clips; Lyria RealTime for streaming | Commercial terms under general API terms; SynthID watermark | Gemini API (preview) | $0.08/song; $0.04 per 30-s clip |
| Stable Audio 2.5 | Music | Up to ~3 min in <2 s GPU; audio inpainting can help build seamless tails | Fully licensed dataset; on-prem option | Stability API, fal, Replicate | about $0.20/clip on third-party hosts |
| Mubert | Music | Built for continuous ambient streams | Commercial licensing via API tiers | Yes | Verify |
| Suno | Music | Song-oriented, intros/outros | Partial label licensing; ownership not granted | No official public API | Subscription |
| ElevenLabs TTS | Voice | — | Commercial on paid plans | Yes | $0.08/1K chars (Multilingual), $0.04 (Flash) |
| OpenAI / Google / Azure TTS | Voice | — | Commercial | Yes; Google/Azure support full SSML | Verify current rates |

**Cost per session (estimate)**
- A 15-minute session at about 110 wpm with roughly 45% speech time is about 750 words, or about 4,500 characters.
- **TTS:** about $0.36 (ElevenLabs Multilingual) or $0.18 (Flash).
- **LLM:** below $0.05.
- **Music:** about $0.15–0.45 if generated fresh (1–3 min loop); near zero amortized if drawn from a cached library.
- **Total:** **about $0.20–0.85 per new session**. Re-plays are about free.
- **Recommendation:** pre-generate the music library and synthesize voice per session. Cache personalized scripts for reuse.

**Real-time vs. pre-generated.** Pre-generate for v1. Latency, QC and safety review are all easier, and the evidence does not show that real-time HRV-adaptive content beats good static content. Reserve closed-loop generation (EarStreAM-style) for a research arm.

**Accessibility.** Provide synchronized transcripts or captions, voice-only and music-only modes, adjustable speech rate, and screen-reader support. Breath pacing should include haptic and visual alternatives, and there should be no flashing visuals.

---

## 11. Do-Not-Claim / Do-Not-Build List
- "432 Hz / solfeggio healing frequencies," "DNA repair," "cell healing" (unsupported).
- "Brainwave entrainment," "puts your brain into theta/delta" (weak mechanism).
- "Clinically proven to reduce anxiety by X%," "world's most relaxing" (FTC risk; the Weightless data is not peer-reviewed).
- "Rewires your brain / shrinks your amygdala" (neuroimaging findings lack consensus and do not transfer to an app).
- "AI therapist / counselor / treatment for anxiety, depression, insomnia, panic" (FDA device and state-law risk).
- Hyperventilation, Wim Hof–style or holotropic breathing; long breath holds.
- Cloning third parties' or deceased loved ones' voices.
- Free-form LLM scripts drawn from the user's trauma disclosures.
- Claims that wearable HRV readings indicate a health condition.

## 12. Caveats
- Most music and voice evidence measures short-term perceived relaxation, not durable clinical outcomes. Effects of meditation apps are small and not superior to active treatments.
- Balban 2023 is one trial. 432 Hz rests on pilots. Speech-rate, pause and LUFS defaults are practitioner conventions.
- Vendor pricing and licensing change fast. Several figures here come from secondary trackers, and the ElevenLabs music price conflicts between sources. Confirm against contracts.
- Legal status of AI-generated music and state AI-therapy laws is evolving. Get counsel review before launch.

## 13. Open Research Questions and Recommended Experiments
1. Does music-embedded breath pacing (swell at 0.1 Hz) match voice cueing for respiratory-rate reduction? Measure with a within-subject crossover using phone-microphone respiration.
2. Does a decelerating bed tempo (66→58 BPM) beat a constant one on calm ratings and HR?
3. Do user-tuned TTS voices close the gap with human narration on *outcomes* (STAI-6), not just ratings?
4. Optimal guidance density by experience level: a micro-randomized trial on silence length.
5. Does favorite-bed familiarity increase 30-day retention?
6. Do onboarding safety routing and the in-session exit lower adverse-effect rates relative to Van Dam's 58% baseline checklist rate?\[46\]

## Sources

1. [Effectiveness of just-in-time adaptive interventions for improving mental health and psychological well-being: a systematic review and meta-analysis - PubMed](https://pubmed.ncbi.nlm.nih.gov/41027677/)
2. [Original Paper Objective User Engagement With Mental Health Apps: Systematic](https://www.jmir.org/2019/9/e14567/PDF)
3. [Which States Ban AI Therapy? 2026 Map](https://psychology.com/ai-therapy/state-bans)
4. [Systems, devices, components and methods for triggering or inducing resonance or high amplitude oscillations in a cardiovascular system of a patient](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10632040)
5. [Effects of A Brief Resonance Frequency Breathing Exercise on Heart Rate Variability and Inhibitory Control in the Context of Generalised Anxiety Disorder](https://link.springer.com/article/10.1007/s10484-025-09687-0)
6. [A Practical Guide to Resonance Frequency Assessment for Heart Rate Variability Biofeedback - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC7578229/)
7. [Effect of Resonance Breathing on Heart Rate Variability and Cognitive Functions in Young Adults: A Randomised Controlled Study - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8924557/)
8. [Study shows cyclic breathing technique more effective in reducing stress than mindfulness meditation](https://medicalxpress.com/news/2023-01-cyclic-technique-effective-stress-mindfulness.html)
9. [Cyclic Sighing & the Physiological Sigh — Apnea Trainer](https://www.apnea-trainer.com/blog/cyclic-sighing-physiological-sigh/)
10. [‘Sighing’ tops mindfulness for reduced stress, improved mood](https://www.mdedge.com/internalmedicinenews/article/261271/anxiety-disorders/sighing-tops-mindfulness-reduced-stress)
11. [Cyclic Sighing: The Breathing Technique Your Body Already Runs](https://brizzy.app/en/library/cyclic-sighing)
12. [To stave off panic attacks, don't take a deep breath](https://www.nbcnews.com/health/health-news/stave-panic-attacks-dont-take-deep-breath-flna1c9468736)
13. [A new breathing therapy reduces panic and anxiety by reversing hyperventilation](https://blog.smu.edu/research/2010/12/16/a-new-breathing-therapy-reduces-panic-and-anxiety-by-reversing-hyperventilation/)
14. [A Multisite Benchmarking Trial of Capnometry Guided Respiratory Intervention for Panic Disorder in Naturalistic Treatment Settings](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5344940/)
15. [Full article: Effects of music interventions on stress-related outcomes: a systematic review and two meta-analyses](https://www.tandfonline.com/doi/full/10.1080/17437199.2019.1627897)
16. [The Effect of Music on Decreasing Arousal Due to Stress: A Meta-Analysis](https://www.researchgate.net/publication/8385525_The_Effect_of_Music_on_Decreasing_Arousal_Due_to_Stress_A_Meta-Analysis)
17. [Frontiers](https://www.frontiersin.org/journals/sleep/articles/10.3389/frsle.2025.1707162/full)
18. [Can the Sounds of Nature Help Heal Our Body and Brain?](https://www.psychologytoday.com/us/blog/how-my-brain-works/202308/can-the-sounds-of-nature-help-heal-our-body-and-brain)
19. [Health benefits of natural sounds](https://www.eurekalert.org/news-releases/593536)
20. [Music Tuned to 440 Hz Versus 432 Hz and the Health Effects: A Double-blind Cross-over Pilot Study](https://www.ovid.com/journals/ejsh/abstract/10.1016/j.explore.2019.04.001~music-tuned-to-440-hz-versus-432-hz-and-the-health-effects-a?redirectionsource=fulltextview)
21. [Is Music at 432 Hertz More Healing? \< Head + Heart](https://www.headplusheart.com/is-music-at-432-hertz-more-healing/)
22. [Differential effects of sound interventions tuned to 432 Hz or 443 Hz on cardiovascular parameters in cancer patients: a randomized cross-over trial](https://link.springer.com/article/10.1186/s12906-025-04758-5)
23. [Music Tuned to 440 Hz Versus 432 Hz and the Health Effects: A Double-blind Cross-over Pilot Study - ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S1550830718302763)
24. [\[2401.03581\] Evaluating and Personalizing User-Perceived Quality of Text-to-Speech Voices for Delivering Mindfulness Meditation with Different Physical Embodiments](https://arxiv.org/abs/2401.03581)
25. [Evaluating and Personalizing User-Perceived Quality of Text-to-Speech Voices for Delivering Mindfulness Meditation with Different Physical Embodiments](https://arxiv.org/html/2401.03581v1)
26. [Evaluating and Personalizing User-Perceived Quality of ...](https://arxiv.org/pdf/2401.03581)
27. [The role of prompt, voice, and personality factors in the acceptance and evaluation of AI-generated mindfulness exercises](https://www.nature.com/articles/s41598-025-21290-1)
28. [Ai Meditation Guides Vs Certified Mindfulness Instructors Do Voice-modulated Breathing Cues Lower Heart Rate As Effectively](https://www.alibaba.com/product-insights/ai-meditation-guides-vs-certified-mindfulness-instructors-do-voice-modulated-breathing-cues-lower-heart-rate-as-effectively.html)
29. [s12671 022 01977 6](https://link.springer.com/10.1007/s12671-022-01977-6)
30. [The effect of mindfulness meditation on sleep quality: a systematic review and meta‐analysis of randomized controlled trials - Rusch - 2019 - Annals of the New York Academy of Sciences - Wiley Online Library](https://nyaspubs.onlinelibrary.wiley.com/doi/10.1111/nyas.13996)
31. [Frontiers](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1597264/full)
32. [Effects of Loving-Kindness and Compassion Meditation on Anxiety: A Systematic Review and Meta-Analysis](https://link.springer.com/article/10.1007/s12671-023-02121-8)
33. [A Meta-analysis of Loving-Kindness Meditations on Self-Compassion](https://link.springer.com/content/pdf/10.1007/s12671-022-01972-x.pdf)
34. [Effects of Self-Compassion Interventions on Reducing Depressive Symptoms, Anxiety, and Stress: A Meta-Analysis](https://link.springer.com/article/10.1007/s12671-023-02148-x)
35. [How Longer Exhalations and Cyclic Sighing Make Us Feel Good](https://www.psychologytoday.com/us/blog/the-athletes-way/202301/how-longer-exhalations-and-cyclic-sighing-make-us-feel-good)
36. [s12671 022 01977 6](https://link.springer.com/article/10.1007/s12671-022-01977-6)
37. [The Relationship Between Doses of Mindfulness-Based Programs and Depression, Anxiety, Stress, and Mindfulness: a Dose-Response Meta-Regression of Randomized Controlled Trials](https://www.researchgate.net/publication/339622890_The_Relationship_Between_Doses_of_Mindfulness-Based_Programs_and_Depression_Anxiety_Stress_and_Mindfulness_a_Dose-Response_Meta-Regression_of_Randomized_Controlled_Trials)
38. [Research Space Effects of length of mindfulness practice on ...](<https://repository.canterbury.ac.uk/download/0c3fb084f24532c3b725898829dae484d708e272fdb6587a1d3987a045d2b414/639786/Accepted%20manuscript-Effect%20of%20mindfulness%20practice%20length%20(Strohmaier%20et%20al.,%202020).pdf>)
39. [How long should you meditate? What the research shows](https://getstillmind.com/blog/how-long-should-you-meditate/)
40. [Too Much or Not Enough of a Good Thing? Reconciling Differing Perspectives on the Optimal Dose of Mindfulness Meditation and Advancing a Dose-Response Research Agenda - Journal of Contemplative Studies](https://contemplativejournal.org/article/ccaxs3076/)
41. [Effectiveness of just-in-time adaptive interventions for improving mental health and psychological well-being : a systematic review and meta-analysis](https://fis.uni-bamberg.de/entities/publication/685aef72-c66d-49ee-859f-5f9c0a32db37)
42. [EarStreAM: A Closed-Loop Earable System for Personalized Stress-Adaptive Meditation](https://arxiv.org/pdf/2609.19127)
43. [FDA Updates Its "General Wellness" Device Framework—What Companies Need To Know - Healthcare - United States](https://www.mondaq.com/unitedstates/healthcare/1732360/fda-updates-its-general-wellness-device-frameworkwhat-companies-need-to-know)
44. [Study calls for greater awareness of risks and benefits of meditation](https://medicalxpress.com/news/2025-02-greater-awareness-benefits-meditation.html)
45. [Incidence and Predictors of Meditation-Related Unusual Experiences and Adverse Effects in a Representative Sample of Meditators in the United States - Nicholas T. Van Dam, Jessica Targett, Jonathan N. Davies, Alex Burger, Julieta Galante, 2025](https://journals.sagepub.com/doi/10.1177/21677026241298269)
46. [Does Meditation Come With Side Effects?](https://www.psychologicalscience.org/news/2025-aug-meditation-side-effects.html)
47. [Scientists uncover meditation’s hidden side effects](https://www.sciencedaily.com/releases/2025/11/251105050730.htm)
48. [Objective User Engagement With Mental Health Apps: Systematic Search and Panel-Based Usage Analysis](https://www.jmir.org/2019/9/e14567/)
49. [https://www.jmir.org/2019/9/e14567/XML](https://www.jmir.org/2019/9/e14567/XML)
50. [(PDF) Objective User Engagement With Mental Health Apps: Systematic Search and Panel-Based Usage Analysis](https://www.researchgate.net/publication/334562120_Objective_User_Engagement_With_Mental_Health_Apps_Systematic_Search_and_Panel-Based_Usage_Analysis)
51. [Objective User Engagement With Mental Health Apps: Systematic Search and Panel-Based Usage Analysis](https://preprints.jmir.org/preprint/14567&gsessionid=PYdZXgHJdEbO-4tbCxGHwCMH-rVuDBzb41mLfV3cXAjUbX4jzbVccQ)
52. [FDA Updates General Wellness and Clinical Decision Support Guidance Documents](https://www.kslaw.com/news-and-insights/fda-updates-general-wellness-and-clinical-decision-support-guidance-documents)
53. [New Illinois Law Restricts Use of AI in Mental Health Therapy](https://www.hklaw.com/en/insights/publications/2025/08/new-illinois-law-restricts-use-of-ai-in-mental-health-therapy)
54. [AI Therapy State Law Draws the Line in 2026 — Mental Wealth Solutions](https://mentalwealthsolutions.org/blog/ai-therapy-state-law-line-2026)
55. [When a Chatbot Acts as a Therapist — Horizon Searchlight Issue 016 — Horizon Search Institute](https://horizonsearch.org/publications/searchlight/016/)
56. [State AI Mental Health Laws 2026: Multistate Compliance Guide](https://acuity.news/blog/state-ai-mental-health-laws-compliance-2026/)
57. [Suno Previews 2026 Changes Under Warner Music Deal](https://www.digitalmusicnews.com/2025/12/22/suno-warner-music-deal-changes/)
58. [Warner Music settles with Suno and agrees licensed AI music models for 2026](https://wheresthe.ai/d/us-wmg-suno-settlement-licensing-2025-11/)
59. [Suno AI v6: New Licensed Music Model](https://sunnoai.com/v6/)
60. [Eleven Music API - Studio-Grade AI Music Generation](https://elevenlabs.io/eleven-music-api)
61. [ElevenLabs Music: The Licensed-Training AI Music Model, v1 to v2 Explained (August 2026)](https://invideo.io/blog/elevenlabs-music-ai-generator/)
62. [Stability AI Introduces Stable Audio 2.5, the First Audio Model Built for Enterprise Sound Production at Scale — Stability AI](https://stability.ai/news-updates/stability-ai-introduces-stable-audio-25-the-first-audio-model-built-for-enterprise-sound-production-at-scale)
63. [Google Lyria Explained: Every Model, Spec, and Price from Lyria-002 to 3.5 (August 2026)](https://invideo.io/blog/lyria-ai-music-generator/)
64. [Lyria 3.5: Price, API, Specs & Data Policy](https://meetcody.ai/models/lyria-3-5/)
