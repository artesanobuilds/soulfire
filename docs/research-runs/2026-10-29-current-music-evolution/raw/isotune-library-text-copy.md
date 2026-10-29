# IsoTune Music Engine: Evidence-Based Composition Parameters for an Infinitely Looping Generative Music Feature

Notes, keys and instruments matter much less than tempo, steadiness, brightness, predictability and the listener's own preference. The parameters with the best evidence are slow tempo (about 60–80 BPM), soft and stable dynamics, no lyrics, few or no percussive accents, dark and gentle timbres, and harmony that is predictable but not frozen. Specific frequencies (432 Hz, 528 Hz), "healing keys" and named instruments have little or no causal evidence. IsoTune should therefore be built as a parametric engine that controls arousal through tempo, density, brightness and predictability, adds variety in harmony and instrumentation, and learns each user's preferences. It should not be marketed around special notes or tunings.

## TL;DR

- **What moves outcomes:** tempo, dynamic stability, rhythmic accent and syncopation, timbral brightness and attack, lyrics vs. no lyrics, and harmonic predictability. These have meta-analytic or controlled-trial support. A three-level meta-analysis of 104 RCTs (9,617 participants) found music reduced stress (physiological d = 0.38, psychological d = 0.545), with a trend toward larger effects at 60–80 BPM. Choices of instrument, key, mode and tuning are mostly culturally learned signals of mood, not therapeutic agents in themselves.
- **What to build:** a rule-based or constrained-generative engine with five goal presets (focus, anxiety, mood lift, sleep, stress recovery). Each preset exposes about 15 parameters (BPM, layer count, spectral-brightness ceiling, attack time, harmonic rhythm, chord-surprise budget, syncopation index, melody density, loudness range, variation rate). Iso-principle ramps move the parameters slowly over 5–20 minutes, driven by heart rate/HRV or mood check-ins.
- **What to avoid:** claims about 432/528 Hz, "Mozart makes you smarter", "the key of C heals" and "reduces anxiety by 65%" (Weightless). Avoid looping sad or minor-key music for users with depressive or ruminative tendencies. Avoid lyrics in focus mode. Make no treatment claims. Frame everything as relaxation, focus support and general wellness.

---

## Key Findings (evidence-graded)

| Claim | Evidence grade | Bottom line for IsoTune |
|---|---|---|
| Music listening reduces stress and anxiety | **Meta-analysis (strong)**: de Witte et al. 2020, 104 RCTs, n = 9,617; physiological d = 0.38, psychological d = 0.545 | Core value proposition is credible |
| Slow tempo (60–80 BPM) is a key ingredient | **Meta-analytic moderator (moderate)**: trend p = .064 in de Witte 2020a; d = 0.900 for 60–90 BPM in the music-therapy meta-analysis (de Witte 2020b, 47 studies, n = 2,747); physiology (Bernardi 2006) | Make tempo the primary arousal control |
| Silence/pauses lower HR, BP and breathing below baseline | **Small lab study**: Bernardi 2006, n = 24 | Build "breath spaces" (rests) into calm modes |
| Music improves subjective sleep quality in insomnia | **Cochrane (moderate certainty)**: PSQI MD −2.79, 10 studies, 708 participants\[1\] | Sleep mode is defensible as "relaxing pre-sleep music" |
| Music therapy reduces depressive symptoms short-term | **Cochrane (low–moderate)**: 9 studies, 421 participants, SMD −0.85 (patient-reported)\[2\] | Delivered by therapists. Passive listening ≠ music therapy; do not claim depression treatment |
| Lyrics impair reading/memory | **Meta-analysis + experiments (moderate–strong)**: lyrics d ≈ −0.3; instrumental lo-fi not credibly harmful | Focus mode must be instrumental, no vocal formants |
| Moderate harmonic surprise maximises pleasure | **Experimental + fMRI (moderate)**: Cheung 2019, 80,000 chords from 745 songs | Use a "surprise budget", not random chords |
| Medium syncopation maximises groove | **Experiment, contested (moderate–weak)**: Witek 2014 inverted U; 2024 replication found the curve driven by extreme stimuli | Use only in energising mode, at low–medium levels |
| Brightness/attack shape arousal and valence | **Psychoacoustic experiments (moderate)**: McAdams et al. 2017, 137 tones | Use low-pass and soft attacks for calm; brighter for energy |
| Major = happy / minor = sad | **Culturally learned (moderate, not universal)** | Valid for Western/Latin American users as a cue, not a mechanism |
| Harsh dissonance is aversive | **Cross-cultural (moderate)** | Hard constraint: no clusters or heavy roughness |
| AI-generated music works as well as human-composed | **Small studies only (weak)**: n = 26–152; no blinded RCT on physiological stress | Plausible, unproven. Run your own trials |
| 432 Hz superior to 440 Hz | **Small RCTs with mixed outcomes (weak)**: anxiety identical; cortisol difference in one trial | Do not market; tuning is not a lever |
| Mozart effect | **Debunked (meta-analysis)**: Mozart vs. other music d = 0.15; publication bias | Never claim cognitive enhancement |
| "Weightless reduces anxiety 65%" | **Unpublished commercial lab test (anecdote)** | Do not cite. Graff 2019 RCT is the only peer-reviewed data\[3\] |

---

## 1. Instruments and Timbre

**Bottom line:** No instrument is therapeutic in itself. What matters is the acoustic profile: spectral brightness, attack sharpness, roughness and loudness variability. Pick instruments for their timbre, then shape them further with filters and envelopes.

**Evidence on timbral features.**
- **McAdams, Douglas & Vempala (2017, *Frontiers in Psychology*)**: musicians and non-musicians rated 137 orchestral instrument tones across each instrument's full pitch range.\[4\]
  - "Valence is more positive with lower spectral slopes, a greater emergence of strong partials, and an amplitude envelope with a sharper attack and earlier decay."\[4\]
  - "Higher tension arousal is carried by brighter sounds, more spectral variation and more gentle attacks."\[4\]
  - "Greater energy arousal is associated with brighter sounds, with higher spectral centroids."\[4\]
  - Pitch register had non-linear effects that interacted with musical training.\[4\]
- Earlier work by Eerola, Ferrer & Alluri (2012, *Music Perception*), in which listeners rated 110 short instrument sounds from the MUMS library, found that attack time and brightness (spectral centroid) correlate strongly with valence and arousal.
- Horner's lab (HKUST) found spectral centroid and centroid deviation correlated with nearly all emotion categories.\[5\]\[6\]
- Juslin & Laukka's synthesis: bright timbres signal happiness, dull timbres sadness, sharp timbres anger, soft timbres fear or tenderness.\[4\]

The design reading:
- **Spectral brightness is the main arousal knob.** A darker, low-passed sound means lower arousal.
- Very slow, swelling attacks (pad-like) are not automatically calm. McAdams found gentle attacks associated with *tension* arousal. Moderate, rounded attacks (felt piano, plucked nylon guitar, soft mallets, harp) are a safer default than long swelling pads for anxious users.
- Fast-decaying plucked or struck tones (piano, harp, kalimba, guitar) give slightly more positive valence. That supports their use in mood-lift and focus modes.

**Instrument families.**
- A 2024 enculturation study (PMC11560474) found that across musical traditions, bowed instruments best conveyed low-arousal, *negatively* valenced intentions. Wind instruments conveyed high-arousal positive intentions.\[7\]
- **Implication:** solo cello or violin lines in a minor context can push toward sadness. Use strings as sustained, low-dynamics pads rather than expressive solo melodies in anxiety and depression modes.

**Acoustic vs. electronic.**
- Scarratt et al. (2023, *PLOS ONE*) analysed **225,626 tracks from 985 Spotify sleep playlists**. Compared with music in general, sleep music was "softer, slower, instrumental and more often played on acoustic instruments", but the corpus also contained high-energy, high-tempo tracks.\[8\]
- This is observational evidence about what people *choose*, not proof that acoustic timbres work better.
- **Recommended palette:** acoustic-sounding samples (felt piano, nylon guitar, harp, soft strings, flute) layered over warm, filtered synth pads. This matches user expectations and avoids harsh, bright synth patches.

**Singing bowls, humming, voice.**
- I found no controlled evidence that singing bowls beat other soft sustained timbres.
- Wordless voice ("oohs", humming) is a gray zone for focus. Speech-like sounds drive the irrelevant-speech effect, so keep vocal formants out of focus mode. Use them, if at all, only as distant pads in mood or stress modes.

**Lyrics vs. instrumental.**
- A 2023 *Journal of Cognition* experiment: "Music with lyrics hindered verbal memory, visual memory, and reading comprehension (d ≈ –0.3)." Instrumental hip-hop lo-fi "did not credibly hinder or improve performance".\[9\]\[10\]
- Participants believed instrumental music helped them, but the data did not support this.\[10\]
- Vasilev, Kirkby & Angele's 2018 Bayesian meta-analysis (*Perspectives on Psychological Science*, 65 studies) estimated a small overall impairment of reading comprehension from background music (Hedges's g = −0.19), with meta-regression showing lyrical music more disruptive than instrumental.
- Irrelevant-sound research adds that **changing-state sound** (acoustic changes from token to token) disrupts serial recall more than steady-state sound. In one study, tempo variation in a melody caused *additional* harm (PMC7381464).\[11\]
- Another study found irrelevant instrumental music disrupted *tonal* memory more than white noise (Kattner & Meinhardt 2020).\[12\]
- **Implication for focus mode:** no lyrics, low melodic salience, steady tempo, few abrupt changes.

## 2. Pitch, Register and Frequency Content

**Register.**
- Higher, brighter content raises arousal; lower, darker content lowers it. This is consistent across timbre studies (brightness ↔ arousal) and the sedative-music criteria (see Nilsson below), which favour low registers.
- Avoid putting the melodic focus above about 1–2 kHz in calm modes.
- Avoid very heavy sub-bass (<60 Hz) at volume, which can feel physically intense on headphones. This last point is design judgment, not trial evidence.

**Practical frequency guidance (engineering heuristics informed by the brightness literature, not clinical thresholds):**
- Sleep/anxiety: melody roughly C3–C5 (130–520 Hz fundamentals), gentle low-pass around 3–5 kHz, bass present but soft.
- Focus: midrange pads and keys, moderate brightness, nothing that "pops" in the 2–5 kHz presence region.
- Mood lift: allow brighter top end (shimmer, plucks up to C6), more high-frequency energy.

**Tuning: 432 vs. 440 Hz.**
- Aravena et al. (2020, *J Appl Oral Sci*) randomised dental-extraction patients to music at 432 Hz, music at 440 Hz, or no music.\[13\]
  - Anxiety scores were nearly identical between the two music arms (432 Hz: 8.7 ± 2.67; 440 Hz: 8.4 ± 2.84) and both were well below control (17.2 ± 4.60).\[13\]
  - Only salivary cortisol favoured 432 Hz.\[14\]
- A randomised crossover trial in cancer patients (body monochord, 432 vs. 443 Hz) found heart-rate reductions with both, slightly larger at 432 Hz (median −3 bpm). Its authors call for larger RCTs.\[15\]
- **Conclusion:** music helped; the tuning offset is at most a marginal, unreplicated signal.
- **Recommendation:** use standard A4 = 440 Hz equal temperament. Optionally expose a "432 Hz" toggle as a cosmetic preference without claims.

**Keys and notes.**
- I found no credible evidence that any specific key (e.g., "C for healing"), note or Solfeggio frequency has a therapeutic effect.
- Transposition changes register and brightness, which matter. Key identity does not.
- **Rotate keys freely** to fight habituation.

## 3. Harmony, Scales and Modes

**Major/minor is a learned cue, not a universal.**
- A 2024 systematic review (*Physics of Life Reviews*) found the major-happy/minor-sad association "substantially confirmed" in the literature, including some Asian samples.\[16\]
- But Smit et al. (2022, *PLOS ONE*), studying listeners in Papua New Guinea with minimal Western exposure, found "no evidence for a universal effect of major harmony or melody inducing greater reported happiness than minor."
- Lahdelma, Athanasopoulos & Eerola (2021, *Annals of the New York Academy of Sciences*), testing Khowar and Kalash listeners in Northwest Pakistan against UK listeners, found the major-positive/minor-negative distinction *reversed*, "arguably because of the reversed prevalence of these chords in the two music cultures."
- For IsoTune's Western and Latin American users, major/minor will reliably *signal* mood. That is useful for iso-matching, but it is a cultural convention.

**Consonance vs. dissonance.**
- The same study found that "the aversion to the harsh dissonance of the chromatic cluster is present cross-culturally, but the preference for the consonance of the major triad varies between UK and Northwest Pakistani listeners, depending on cultural familiarity."
- The Tsimane' in Bolivia were indifferent to dissonance (McDermott et al., 2016, *Nature*).\[17\]
- **Hard rule:** forbid chromatic clusters and high roughness (minor seconds in close voicing in the low-mid register). Allow mild colour tones (add9, maj7, sus2/sus4) in all modes.

**Modes and scales (music-theory practice; little direct clinical evidence):**
- **Major pentatonic / Lydian / Mixolydian:** bright, open. For mood lift and stress recovery.
- **Dorian:** minor-coloured but with a raised 6th, so less dark than Aeolian. A good "iso-match" mode for low mood that can lead toward brighter modes.
- **Aeolian/minor pentatonic:** use only briefly, as an iso-entry point, never as a sustained loop for depressive users.
- **Pentatonic scales** avoid semitones, so random melodic choices rarely clash with the harmony. This makes them very robust for generative melody. Constrain melody to pentatonic notes and let harmony use the full diatonic set.

**Sad music and depression.**
- Garrido & Schubert (2015, *Psychology of Music*): 335 participants each listened to a self-selected sad piece. "Both ruminators and non-ruminators had significant increases in depression".\[18\]
- A second study (n = 175, *Music Perception*) found sad music "can significantly increase feelings of depression in people with a tendency to depression", although those people liked it.\[19\]
- Garrido et al. (2017) documented "group rumination" with music in depressed users.\[20\]
- **Design rule:** iso-matching for low mood should *start* near the user's state (slower, darker, Dorian or minor colour) and move upward within minutes. It must never park in sad music indefinitely. Gate "melancholic" presets behind a mood trajectory, not a static preference.

## 4. Chord Progressions, Expectation and Harmonic Rhythm

**Prediction and pleasure.**
- Cheung et al. (2019, *Current Biology*) modelled the uncertainty and surprise of **80,000 chords from 745 US Billboard songs**.\[21\]
- Chords were most pleasurable when "they deviated substantially from what the listener had expected (low uncertainty, high surprise) or, conversely, when they conformed to expectations in an uninformative context (high uncertainty, low surprise)."\[22\]
- The effects mapped onto the amygdala, hippocampus and auditory cortex.\[21\]
- **Engineering translation:** keep a stable, predictable harmonic frame (low uncertainty) and spend a small "surprise budget". About one mildly unexpected chord per 8–16 chords works, for example a borrowed ♭VI or ♭VII, or a deceptive resolution. Never use random walks through harmony; they produce high uncertainty *and* high surprise, the least pleasurable combination.
- For sleep and anxiety modes, reduce the surprise budget toward zero. For mood lift, raise it.

**Harmony and rhythm interact.** A *PLOS ONE* study (2019) found medium-complexity chords strengthened the inverted-U effect of rhythmic complexity on pleasure.\[23\] Harmonic colour can add pleasure without adding rhythmic arousal.

**Harmonic rhythm (how often chords change).** There are no RCTs on this. It follows from the sedative-music criteria ("stable dynamic contour; repetitive and simple structure") and the changing-state findings.\[24\] Practical defaults:
- Sleep: 1 chord per 8–16 seconds, or a drone/pedal tone with slowly shifting upper voices.
- Anxiety: 1 chord per 4–8 seconds.
- Focus: 1 chord per 2–4 bars at 70–90 BPM, in short cyclic progressions (2–4 chords) that become "background".
- Mood lift: 1 chord per bar, 4-chord pop cycles with occasional surprises.

**Example progressions (diatonic, low-roughness voicings):**
- Calm/sleep: I–IV (add9) oscillation over a tonic pedal; Imaj7–IVmaj7; i–♭VII–♭VI–♭VII in Dorian colour for iso-entry.
- Focus: vi–IV–I–V or I–V–vi–IV with sus/add9 voicings, looped.
- Mood lift: IV–V–iii–vi ("royal road"), I–♭VII–IV (Mixolydian lift), occasional ♭VI→♭VII→I surprise cadence.
- Drones and pedal tones are ideal under sleep and anxiety textures: maximal predictability, minimal changing state.

## 5. Tempo, Rhythm, Meter and Groove

**Tempo is the strongest physiological lever.**
- Bernardi, Porta & Sleight (2006, *Heart*): 12 musicians and 12 controls. Faster tempi raised ventilation, blood pressure and heart rate. "Music induces an arousal effect, predominantly related to the tempo," more than style.\[25\]\[26\]
- A random 2-minute pause "reduced heart rate, blood pressure, and minute ventilation, even below baseline".\[26\]
- Musicians showed greater respiratory sensitivity to tempo.\[27\]
- Their 2009 *Circulation* follow-up found cardiovascular signals tracked crescendos. Bernardi suggested that alternating fast and slow or crescendo–decrescendo sections "may be potentially more effective".\[28\]\[29\]

**Sedative-music criteria used in trials.**
- Nilsson's widely cited criteria: "a slow and flowing tempo around 60–80 beats per minute, a maximum level of 60 dB and with duration of 20–60 min." Secondary summaries add no lyrics, low register and minimal percussion.\[30\]\[31\] Her 2008 *AORN Journal* review of 42 perioperative RCTs (PMID 18395022) reported that "music intervention had positive effects on reducing patients' anxiety and pain in approximately half of the reviewed studies."
- Lai & Good (2005) operationalised sedative sleep music as "60–80 BPM; No accented beats; No percussive characteristics; No syncopation."\[24\]
- Jespersen & Vuust (2012) used 52 BPM with a "stable dynamic contour; repetitive and simple structure."\[24\]
- Nilsson (2009, *J Clin Nurs*) randomised 40 post-cardiac-surgery patients to 30 minutes of soothing music or bed rest. Oxytocin and subjective relaxation rose significantly with music; heart rate and BP did not differ.\[32\]
- **Counterpoint:** Dickson & Schubert (2022, *Musicae Scientiae*) found music people reported as *successful* for sleep averaged **108 BPM**.\[30\] Preference and familiarity can override the "slow" rule. Treat 60–80 BPM as a strong default, not a law.

**Tempo by goal:**
- Sleep: start near the user's resting HR or 60–70 BPM, ramp to 50–60 BPM. Better still, use rubato/free time with no felt pulse.
- Anxiety: 60–75 BPM, iso-start at measured HR if elevated, decelerate about 1–2 BPM per minute.
- Stress recovery: 60–80 BPM.
- Focus: 70–100 BPM steady, no tempo changes within a session (tempo variation adds distraction).
- Mood lift/energy: 90–120 BPM.

**Syncopation and groove.**
- Witek et al. (2014, *PLOS ONE*) found an inverted-U relation between syncopation and both pleasure and wanting to move. Medium syncopation was optimal.\[33\]
- A 2024 *PLOS ONE* replication found a "null effect of perceived drum pattern complexity". The inverted U in the original data was driven mainly by experimenter-composed extreme patterns.\[34\]
- **Implication:** groove matters for energising music. Use low–medium syncopation only in mood-lift mode, and **no syncopation or accents** in sleep and anxiety modes, following the sedative-music criteria.

**Meter.** Simple duple or triple meter (4/4, 3/4, 6/8). 6/8 and 3/4 lilts work well for calm. Avoid odd meters. There is no direct trial evidence; this is a predictability argument.

**Breath entrainment.** Align phrase lengths with a 0.1 Hz breathing target (about 10 s cycle) from the prior brief. At 60 BPM, a 4-beat inhale swell and 6-beat exhale decay gives a 10-second cycle. Map this to pad crescendo–decrescendo, which follows Bernardi's finding that cardiorespiratory signals track crescendos.

## 6. Texture, Density and Arrangement

- **Layers:** sleep 2–3, anxiety 3, focus 3–4, stress recovery 3–4, mood lift 4–6. Fewer simultaneous streams means less changing-state information. This is grounded in the sedative-music "simple structure" criteria and irrelevant-sound research; exact counts are design judgment.
- **Dynamics:** keep loudness range narrow in calm and focus modes. Nilsson recommends at most 60 dB for relaxation.\[31\] Allow slow, breath-scaled swells (about ±3 dB) but no sudden accents or transients.
- **Melody:** stepwise motion, narrow range (about an octave), long notes, frequent rests in calm modes. Sparse or absent melody in focus mode, where the "lo-fi" model (low salience, repetitive loops, steady beat) is supported only by the null harm of instrumental lo-fi. Clearer, singable motifs with upward contours in mood-lift mode.
- **Repetition vs. variation:** see Section 8. Calm and focus modes rely on high repetition at the surface, with slow variation underneath.
- **Silence:** insert occasional 4–16 second near-silent "breath spaces" in calm modes, following Bernardi's pause effect. Avoid them in focus mode, where sudden silence is a changing-state event.

## 7. Condition-Specific Evidence and Clinical Benchmarks

- **Sleep:** Cochrane (Jespersen et al., 2022) found moderate-certainty evidence of improved PSQI (MD −2.79, 95% CI −3.86 to −1.72; 10 studies, 708 participants). There was no clear effect on insomnia severity, and low-certainty evidence on sleep-onset latency, total sleep time and efficiency.\[1\] Daily listening ran for 14–90 days.\[35\]\[36\] Music helps perceived sleep quality more than sleep maintenance.\[35\]\[37\]
- **Anxiety:**
  - Graff et al. (2019, *Regional Anesthesia & Pain Medicine*), 157 adults: STAI-6 change was −1.6 with music (Marconi Union's "Weightless") vs. −4.2 with midazolam (p = 0.14; mean difference −2.5, 95% CI −5.9 to 0.9).\[38\]\[39\]
  - This is often reported as "as effective as a sedative", but the study was not designed to establish equivalence. Midazolam trended better, and music patients reported lower satisfaction and poorer communication.\[40\]\[41\]
  - The "65% reduction in anxiety" claim comes from a commercial Mindlab test commissioned by Radox.\[42\] It was never peer-reviewed. **Do not cite it.**
- **Stress:**
  - de Witte 2020b (music therapy): d = 0.723.\[43\]
  - "Relaxation" style music (d = 0.826) outperformed own-preference music (d = 0.688).\[43\]
  - Preselected music had the largest effect (d = 1.059).\[43\]
  - This partly conflicts with the prior brief's finding that participant-selected music gives larger HRV effects. A recent sleep perspective (*SLEEP*, 2025) likewise notes "no significant differences in outcomes between participant-selected and researcher-selected music."\[44\]
  - **Resolution:** well-designed relaxing music within the user's taste is the target. Preference matters most as a *veto* (disliked music fails), not as a requirement for self-selection.
- **Depression:**
  - Cochrane (Aalbers et al., 2017): 9 studies, 421 participants. Music therapy plus usual care reduced patient-reported (SMD −0.85) and clinician-rated (SMD −0.98) symptoms short-term, and anxiety (SMD −0.74).\[45\]\[46\]
  - A 2020 meta-analysis of 55 RCTs found music *therapy* and music *medicine* (passive listening) differ in effect.\[47\]
  - IsoTune is music medicine at best. Position it as mood support, not depression treatment.
- **Focus/cognition:**
  - The Mozart effect is unsupported. Pietschnig et al. (2010, *Intelligence*; 39 studies) found Mozart vs. no stimulus d = 0.37, *other music* vs. no stimulus d = 0.38, Mozart vs. other music d = 0.15, with publication bias, and effects from Rauscher-affiliated labs over three times larger.\[48\]\[49\]
  - A 2023 multiverse meta-analysis on Mozart and epilepsy (k = 8, N = 207) found non-significant g = 0.09–0.43.\[50\]\[51\]
  - Any small benefit is general arousal or mood, not a composer effect.\[52\]
  - An Endel-commissioned EEG study (Arctop, 2021, PMC8829886) found its focus soundscape produced the highest decoded focus for 35.3% of participants, vs. 27.5% for an Apple playlist, 19.6% Spotify and 17.6% silence. It exceeded silence 87% of the time after 2.5 minutes.\[53\]\[54\] This is industry-sponsored and uses a proprietary focus decoder: weak evidence.
- **Guided Imagery and Music (GIM)** is a therapist-led receptive music-therapy method (included under "receptive" interventions in the 2020 meta-analysis).\[47\] It is not replicable in an unsupervised app; borrow only the idea of matching music to imagery prompts.

## 8. Generative, Infinite-Loop and AI Music

**Habituation and repetition.**
- Szpunar, Schellenberg & Pliner (2004, *JEP: LMC*), 3 experiments:
  - With incidental (background) listening, liking kept rising with exposure.\[55\]
  - With focused listening, liking followed an inverted U for ecologically valid music.\[55\]
  - A related study showed liking rose after 2 exposures and fell after 8 or 32.\[56\]
- Chmiel & Schubert (2017, *Psychology of Music*) reviewed 57 studies over 115 years: 87.7% were compatible with an inverted-U for preference vs. complexity/familiarity. **Massed** exposure (same piece repeatedly in close succession) produces the inverted U; spaced exposure may not. Repetition also lowers *perceived* complexity, so simple music (like relaxation music) is predicted to lose appeal faster with repetition.\[57\]
- **Implications:**
  - (a) Background modes (focus, sleep) tolerate more repetition than attentive modes (mood lift).
  - (b) An infinite loop of a *simple* piece will satiate. Variation must be continuous but slow.
  - (c) Space out recurring material across sessions; don't repeat the same motif bank every night.

**AI vs. human music: weak, mixed evidence.**
- Fišer et al. (2025, *PLOS ONE*, n = 88): AI-generated soundtracks caused greater pupil dilation and were rated more arousing; human music felt more familiar.\[58\] For a calm product, that is a warning sign: unconstrained text-to-music models may over-arouse.
- A 2025 arXiv study (n = 152) found no significant difference in "relaxed, peaceful" ratings for calm AI vs. human pieces, though authors suggest human music may be more emotionally effective "in some circumstances".\[59\]\[60\]
- A small preprint ("Context-AI Tunes", n = 26) found personalised Suno-generated music lowered self-reported stress more than a popular YouTube relaxation track.\[61\] It was unblinded and confounds AI with personalisation.
- A 2026 conference systematic review (8 studies, n = 1,267; not peer-reviewed) reported AI personalised music reduced STAI anxiety by a mean of 3.85 points, sometimes beating preferred music.\[62\]
- **No blinded RCT** compares AI-generated vs. human-composed relaxing music on physiological stress markers.
- **Recommendation:** use a *constrained* engine (rule-based or symbolic generation with hard parameter limits, rendered through curated, human-designed sample instruments) rather than unconstrained end-to-end audio models. Validate in your own A/B and HRV trials.

**Closed-loop adaptation.**
- Prototypes exist: a 2025 *Frontiers in Psychology* system analysed HRV and electrodermal activity every 30 s and, on detecting arousal, reduced BPM, simplified melody and attenuated high frequencies.\[63\]
- The UnWind musical-biofeedback study (n = 40) found a significant interaction between music and biofeedback on HRV improvement.\[64\]
- A 2025 smartwatch study set haptic rhythm slightly slower than real-time HR and reduced HR (n = 20).\[65\]\[66\]
- These are small feasibility studies. Closed-loop is promising but unproven against good open-loop music.

## 9. Personalisation and Culture

- **Musical training** modulates responses: musicians show greater respiratory tempo sensitivity (Bernardi 2006) and different timbre-emotion ratings (McAdams 2017).\[4\]\[27\]
- **Culture:** major/minor and consonance preferences are learned (PNG, Pakistan, Tsimane' findings). For Latin American users, Western tonal harmony is familiar, but genre timbres differ. Consider optional palettes (nylon guitar/bossa-adjacent harmony, cuatro/charango-like plucks, marimba) as **preference skins** over the same arousal parameters. This is a design hypothesis to test, not an evidence-based recommendation.
- **Familiarity:** familiar music is more liked, up to a point (inverted U), and human music feels more familiar than AI music (Fišer 2025).\[58\]\[67\] Keep a recognisable "house sound" and motif families so generated music feels familiar without being identical.
- **Learning preferences:** use explicit thumbs up/down plus implicit signals (skips, session length, volume changes, return rate). Use contextual bandits over *parameter regions* (palette × brightness × tempo band × mode family), never over raw pieces. Keep goal constraints as hard limits, so personalisation cannot push sleep mode to 120 BPM. The Dickson & Schubert 108-BPM finding suggests allowing a modest, user-earned tempo widening in sleep mode.

## 10. Safety, Limits and Regulatory Framing

- **Rumination risk:** cap minor/sad-colour dwell time. Require an upward valence trajectory in low-mood mode. Monitor users who repeatedly select melancholic presets and surface supportive content.
- **Loudness:** default output around 60 dB equivalent; warn above about 70–75 dB on headphones. Sleep mode should fade to silence or a very low floor (sleep timer). Avoid sudden transients that could wake users.
- **Startle/triggers:** no sudden accents, no alarm-like high-frequency tones, no sirens or crying-like timbres. Allow users to disable nature sounds (e.g., thunder) that can be triggering.
- **Musicogenic epilepsy and earworms:** rare, but provide easy stop/skip controls. Avoid catchy, lyrical hooks in sleep mode.
- **Driving:** label calm/sleep modes "not for use while driving".
- **Claims:** stay within general-wellness language ("helps you relax", "supports focus", "wind down for sleep"). Avoid "treats anxiety/insomnia/depression", "clinically proven to reduce anxiety by X%", "healing frequencies", "boosts IQ", and comparisons to medications (e.g., the midazolam study).

---

## Generative Music Parameter Spec

| Parameter | Focus | Anxiety relief | Mood lift / low mood | Sleep | Stress recovery |
|---|---|---|---|---|---|
| **Instrumentation** | Felt/electric piano, soft plucks, warm pad, subtle sub-bass; no vocals | Nylon guitar or felt piano, warm string/synth pad, optional water ambience | Piano/plucks, marimba/kalimba, acoustic guitar, light strings, soft bass; optional wordless vocal pad | Filtered pad, drone, very soft piano or harp; optional pink-noise/water bed | Harp/piano, soft strings, flute-like lead, birdsong/water ambience |
| **Layers** | 3–4 | 3 | 4–6 | 2–3 | 3–4 |
| **Register / brightness** | Mid; centroid moderate; cut harsh 2–5 kHz peaks | Low-mid; low-pass ~4–6 kHz | Mid-high; brighter top, shimmer allowed | Low; low-pass ~2–4 kHz, melody ≤ C5 | Low-mid; gentle high-shelf cut |
| **Attack** | Soft-medium | Rounded, medium (avoid long swelling tension) | Crisper plucks allowed | Very soft / pad-dominant | Soft-medium |
| **Key / mode / scale** | Major or Dorian; pentatonic melody | Major/Lydian; Dorian for iso-entry | Iso-start Dorian/minor pentatonic → Mixolydian/major over 5–10 min | Major/Lydian or modal drone | Major pentatonic, Lydian |
| **Example progressions** | I–V–vi–IV, vi–IV–I–V (sus/add9), loop 2–4 chords | Imaj7–IVmaj7; I–IV(add9) over tonic pedal | i–♭VII–♭VI–♭VII → IV–V–iii–vi → I–♭VII–IV | Tonic drone + slow I–IV colour shifts | I–iii–IV–I, IVmaj7–Imaj7 |
| **Harmonic rhythm** | 1 chord / 2–4 bars | 1 chord / 4–8 s | 1 chord / bar | 1 change / 8–16 s or drone | 1 chord / 4–8 s |
| **Surprise budget** | ~0 (avoid attention capture) | Very low (≤1 per 16 chords) | Moderate (1 per 8 chords; borrowed chords) | Zero | Low |
| **Tempo (BPM)** | 70–100, constant | Start at HR (if elevated) → 60–70; −1–2 BPM/min | Start ~70 → 95–120 | 60–70 → 50–60 or free time | 60–80 |
| **Rhythm / percussion** | Steady soft pulse (brushed/lo-fi), no syncopation spikes; optional beta-range AM per prior brief | None or very soft pulse; no accents/syncopation | Light percussion, low–medium syncopation | None | None or hand-percussion texture |
| **Dynamics** | Narrow range, constant level | ≤60 dB, slow ±3 dB swells at 0.1 Hz | Moderate range, gentle builds | Decrescendo to near-silence; timer fade | ≤60 dB, slow swells, occasional rests |
| **Melody** | Sparse/absent; low salience; repetitive motif | Stepwise, narrow range, long notes, rests | Clear motifs, upward contours, wider range | Minimal or none | Simple, stepwise, slow |
| **Loop / variation** | High surface repetition; swap one layer every 2–4 min; no tempo/key changes mid-session | Vary voicing/instrument every 1–3 min; key change rarely, via crossfade | Section changes every 60–120 s; key change every 5–10 min | Very slow evolution (one parameter per 3–5 min) | Variation every 1–2 min; nature-sound events at random intervals |
| **Pauses** | None | Occasional 4–8 s breath spaces | Rare | Lengthening rests toward silence | 4–16 s breath spaces |
| **Session length** | 25–90 min | 10–30 min | 10–20 min | 20–60 min, then fade | 10–30 min |
| **Evidence strength** | Moderate for "instrumental, no lyrics"; weak for specific recipes | Strong for slow tempo/music overall; moderate for details | Weak–moderate (iso-principle theory; music-therapy meta-analyses not directly transferable) | Moderate (Cochrane) for music; details moderate–weak | Strong for music overall; moderate for details |

---

## Architecture of an Infinitely Looping Adaptive Music Engine

**1. Layered design (recommended).**
- **Control layer:** a goal preset plus state input (HR, HRV, check-in mood, time of day). It outputs a target vector: arousal (BPM, density, brightness), valence (mode family, chord-quality mix), complexity (surprise budget, melody density).
- **Composition layer (symbolic):** rule-based or constrained Markov/grammar generators. They produce chord progressions, bass, pad voicings and pentatonic melodies in MIDI-like events, under hard constraints (no clusters, voice-leading rules, register limits).
- **Rendering layer:** curated, human-designed sample instruments and synths, with per-layer filters (brightness), envelopes (attack), reverb (space) and amplitude modulation (for the focus AM option).
- **Personalisation layer:** contextual bandit over parameter regions, plus user vetoes.

**2. Parameters to expose (internal API):** `bpm`, `bpm_slew` (BPM/min), `layers_active`, `brightness_cutoff_hz`, `attack_ms`, `mode_family`, `harmonic_rhythm_s`, `surprise_budget`, `syncopation_index`, `melody_density`, `melody_range_semitones`, `loudness_target_db`, `dynamic_range_db`, `swell_period_s` (default 10 s for 0.1 Hz), `pause_probability`, `variation_interval_s`, `palette_id`, `nature_bed_level`.

**3. Variation and transition rules.**
- Change **at most one or two** parameters per variation event. Use crossfades of 8–30 s, aligned to phrase boundaries (4- or 8-bar phrases).
- Use a hierarchical clock:
  - micro-variation every phrase (voicing, inversion, velocity humanisation)
  - meso-variation every 1–4 minutes (swap one instrument layer, new motif from the same family, new progression from the same mode)
  - macro-variation every 5–15 minutes (key move by fourth/fifth or relative mode, palette shift)
- Focus mode freezes macro-variation during a work block.
- Key changes go via pivot chords or a drone crossfade, never abrupt modulation in calm modes.
- Iso-principle ramps:
  - start parameters at the user's current state (BPM ≈ HR if 60–100; mode family from mood check-in)
  - move toward the target over 5–20 minutes using smooth curves (e.g., −1 to −2 BPM/min)
  - hold at target

**4. Fatigue and habituation controls.**
- Track motif and progression usage per user. Apply cooldowns (e.g., don't reuse a motif within N sessions) to exploit the spaced-exposure finding.
- Keep a "familiar core" (house palette, recurring motif families) plus a "novel periphery" (new realisations), in line with the familiarity inverted U.
- Use a stochastic but bounded novelty schedule. Target perceptible change every 1–3 minutes in attentive modes and every 3–5 minutes in background modes.

**5. Biosignal adaptation.**
- Sample HR/HRV on a rolling 30–60 s window (the 2025 *Frontiers* prototype used 30 s).\[63\]
- If arousal rises: lower BPM by 2–4, drop one layer, lower brightness cutoff by about 15–25%, reduce surprise budget.
- If HRV improves: hold the current state (don't chase).
- Add hysteresis and rate limits so the music never "jumps" in response to noise.
- Never speed music up to *match* a spiking HR during anxiety beyond the iso-entry point.
- Treat mood check-ins as slow inputs (session-level), and HR/HRV as fast inputs (minute-level).

**6. Validation plan.**
- Run in-app A/B tests on parameter variants (e.g., brightness, surprise budget), with completion, skip and self-rated calm/focus as outcomes.
- Run a small randomised crossover study (IsoTune vs. curated human relaxation track vs. silence) with HRV and STAI-6. This addresses the evidence gap that no blinded AI-vs-human relaxing-music RCT exists.

---

## Caveats

- Many effect sizes come from "music medicine" trials using pre-recorded, often researcher-selected music in clinical settings (surgery, ICU, dental). Transfer to everyday app listening is plausible but not guaranteed.
- Most timbre, mode and harmony findings measure *perceived* emotion in short excerpts, not *induced* clinical outcomes over weeks.
- Several sources are secondary or non-peer-reviewed: the exact wording of Nilsson's and Gaston's criteria comes via later reviews, plus the Endel/Arctop white paper, the Sigma 2026 abstract and arXiv preprints. They are labelled accordingly.
- Numeric design defaults (layer counts, harmonic rhythm, variation intervals, frequency cutoffs) are engineering translations of the evidence, not trial-validated thresholds. Treat them as starting points for experimentation.

## Sources

1. [Music for insomnia in adults](https://www.cochrane.org/evidence/CD010459_music-insomnia-adults)
2. [Music therapy for depression - Aalbers, S - 2017](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD004517.pub3/full)
3. [Altmetric](https://www.altmetric.com/details/63735052)
4. [Perception and Modeling of Affective Qualities of Musical Instrument Sounds across Pitch Registers - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC5296353)
5. [(PDF) Timbre Features and Music Emotion in Plucked String, Mallet Percussion, and Keyboard Tones](https://www.researchgate.net/publication/272623633_Timbre_Features_and_Music_Emotion_in_Plucked_String_Mallet_Percussion_and_Keyboard_Tones)
6. [(PDF) The Correspondence of Music Emotion and Timbre in Sustained Musical Instrument Sounds](https://www.researchgate.net/publication/286187365_The_Correspondence_of_Music_Emotion_and_Timbre_in_Sustained_Musical_Instrument_Sounds)
7. [The function of timbre in the perception of affective intentions: Effect of enculturation in different musical traditions - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC11560474/)
8. [Exploring the features of music that people fall asleep to](https://medicalxpress.com/news/2023-01-exploring-features-music-people-fall.html)
9. [Should We Turn off the Music? Music with Lyrics Interferes with Cognitive Tasks](https://journalofcognition.org/articles/10.5334/joc.273)
10. [Should We Turn off the Music? Music with Lyrics Interferes with Cognitive Tasks](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10162369/)
11. [Irrelevant music: How suprasegmental changes of a melody’s tempo and mode affect the disruptive potential of music on serial recall](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7381464/)
12. [Dissociating the Disruptive Effects of Irrelevant Music and Speech on Serial Recall of Tonal and Verbal Sequences](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7066211/)
13. [Effect of music at 432 Hz and 440 Hz on dental anxiety and salivary cortisol levels in patients undergoing tooth extraction: a randomized clinical trial](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7213780/)
14. [Brazil - Effect of music at 432 Hz and 440 Hz on dental anxiety and salivary cortisol levels in patients undergoing tooth extraction: a randomized clinical trial Effect of music at 432 Hz and 440 Hz on dental anxiety and salivary cortisol levels in patients undergoing tooth extraction: a randomized clinical trial](https://www.scielo.br/j/jaos/a/kkzqnX5PgqgdKzT3BhHdX7w/?lang=en)
15. [Differential effects of sound interventions tuned to 432 Hz or 443 Hz on cardiovascular parameters in cancer patients: a randomized cross-over trial](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11755923/)
16. [The major-minor mode dichotomy in music perception - ScienceDirect](https://sciencedirect.com/science/article/pii/S1571064524001672?via=ihub%3D)
17. [Beyond Universality: Cultural Diversity in Music and Its Implications for Sound Design and Sonification](https://arxiv.org/pdf/2506.14877)
18. [Moody melodies: Do they cheer us up? A study of the effect of sad music on mood - Sandra Garrido, Emery Schubert, 2015](https://journals.sagepub.com/doi/abs/10.1177/0305735613501938)
19. ["Music and People With Tendencies to Depression" by Sandra Garrido and Emery Schubert](https://remix.berklee.edu/mhi-citations/1256/)
20. [AUTHOR=Garrido Sandra , Eerola Tuomas , McFerran Katrina](https://public-pages-files-2025.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2017.00490/text)
21. [Enjoyment of pop music classics linked to combination of uncertainty and surprise - Neuroscience News](https://neurosciencenews.com/pop-music-surprise-15181/)
22. [Uncertainty and surprise jointly predict musical pleasure and amygdala, hippocampus, and auditory cortex activity](https://cms.mus.cam.ac.uk/publications/cheung-uncertainty-surprise/)
23. [The sensation of groove is affected by the interaction of rhythmic and harmonic complexity](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0204539)
24. [pmc.ncbi.nlm.nih.gov](https://pmc.ncbi.nlm.nih.gov/articles/PMC7399370/table/T3)
25. [Cardiovascular, cerebrovascular, and respiratory changes induced by different types of music in musicians and non-musicians: The importance of silence](https://www.researchgate.net/publication/7566554_Cardiovascular_cerebrovascular_and_respiratory_changes_induced_by_different_types_of_music_in_musicians_and_non-musicians_The_importance_of_silence)
26. [Google Scholar](https://scholar.google.com/scholar_lookup?title=Cardiovascular%2C+cerebrovascular%2C+and+respiratory+changes+induced+by+different+types+of+music+in+musicians+and+non-musicians%3A+The+importance+of+silence&amp=&author=L.+Bernardi&amp=&author=C.+Porta&amp=&author=P.+Sleight&amp=&publication_year=2006&amp=&journal=Heart&amp=&pages=445-452&amp=&doi=10.1136%2Fhrt.2005.064600&amp=&pmid=16199412)
27. [\[PDF\] Cardiovascular, cerebrovascular, and respiratory changes induced by different types of music in musicians and non-musicians: the importance of silence](https://www.semanticscholar.org/paper/Cardiovascular,-cerebrovascular,-and-respiratory-by-Bernardi-Porta/43a6000b065e5282ee793d98e299c71cae188093)
28. [Music May Have A Future Role In Heart And Stroke Patient Rehabilitation](https://www.sciencedaily.com/releases/2009/06/090622163025.htm)
29. [Cardiac rhythms synchronize with music](https://www.medscape.com/viewarticle/790422)
30. [Musical features that aid sleep - Gaelen Thomas Dickson, Emery Schubert, 2022](https://journals.sagepub.com/doi/10.1177/1029864920972161)
31. [Music: A Nursing Intervention - Ulrica Nilsson, 2011](https://journals.sagepub.com/doi/full/10.1016/j.ejcnurse.2010.06.004)
32. [Open Heart Surgery and Soothing Music: the oxytocin connection - Healing Music Enterprises](https://healingmusicenterprises.com/open-heart-surgery-and-soothing-music-the-oxytocin-connection/)
33. [Syncopation, Body-Movement and Pleasure in Groove Music](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0094446)
34. [Null effect of perceived drum pattern complexity on the experience of groove](https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0311877)
35. [Listening to music for insomnia in adults - Jespersen, KV - 2022](https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD010459.pub3/full)
36. [Listening to music for insomnia in adults](https://www.researchgate.net/publication/361459711_Listening_to_music_for_insomnia_in_adults)
37. [Music Displays Benefit as a Nonpharmacological Intervention for Improving Sleep in Insomnia](https://www.neurologylive.com/view/music-nonpharmacological-intervention-improving-insomnia-symptoms-adults)
38. [Music Relieves Preop Anxiety Before Peripheral Nerve Block - Physician's Weekly](https://www.physiciansweekly.com/music-relieves-preop-anxiety-before-peripheral-nerve-block/)
39. [‘World’s most relaxing song’ can reduce anxiety: Researchers](https://www.newsnationnow.com/science/worlds-most-relaxing-song-can-reduce-anxiety-researchers/)
40. [Music versus midazolam during preoperative nerve block placements: a prospective randomized controlled study](https://www.researchgate.net/publication/334817820_Music_versus_midazolam_during_preoperative_nerve_block_placements_a_prospective_randomized_controlled_study)
41. [Music may offer alternative to preoperative drug routinely used to calm nerves](https://www.eurekalert.org/news-releases/675230)
42. [This Song Can Induce More Relaxation Than a Massage](https://www.psychologytoday.com/us/blog/the-reality-of-gen-z/202007/this-song-can-induce-more-relaxation-than-a-massage)
43. [Music therapy for stress reduction](https://pure.uva.nl/ws/files/111312923/Music_therapy_for_stress_reduction_a_systematic_review_and_meta_analysis.pdf)
44. [Between sound and sleep: a perspective on Sonic Sleep Aids](https://academic.oup.com/sleep/article/48/11/zsaf275/8251384)
45. [Music Therapy for Depression](https://www.aafp.org/afp/2020/0301/p273)
46. [Musiktherapie bei Depression - Aalbers, S - 2017](https://www.cochranelibrary.com/web/cochrane/content?templateType=full&urlTitle=%2Fcdsr%2Fdoi%2F10.1002%2F14651858.CD004517.pub3&doi=10.1002%2F14651858.CD004517.pub3&type=cdsr&contentLanguage=de)
47. [Effects of music therapy on depression: A meta-analysis of randomized controlled trials](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7673528/)
48. [(PDF) Mozart effect–Shmozart effect: A meta-analysis](https://www.academia.edu/15025828/Mozart_effect_Shmozart_effect_A_meta_analysis)
49. [ERIC - EJ882611 - Mozart Effect-Shmozart Effect: A Meta-Analysis, Intelligence, 2010](https://eric.ed.gov/?id=EJ882611)
50. [Unfounded authority, underpowered studies, and non-transparent reporting perpetuate the Mozart effect myth: a multiverse meta-analysis - PubMed](https://pubmed.ncbi.nlm.nih.gov/36878928/)
51. [Unfounded authority, underpowered studies, and non-transparent reporting perpetuate the Mozart effect myth: a multiverse meta-analysis](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9988829/)
52. [The Mozart Effect: How a 36-Person Study Became a State Policy — And Why It Was Never There](https://atticusli.com/replication-crisis/mozart-effect/)
53. [Measuring and Modeling the Effect of Audio on Human Focus in Everyday Environments Using Brain-Computer Interface Technology - PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8829886/)
54. [DIFFERENCES IN THE EFFECTS ON HUMAN FOCUS OF MUSIC PLAYLISTS AND PERSONALIZED SOUNDSCAPES, AS MEASURED BY BRAIN SIGNALS](https://www.biorxiv.org/content/10.1101/2021.04.02.438269v1.full)
55. [ERIC - EJ689151 - Liking and Memory for Musical Stimuli as a Function of Exposure, Journal of Experimental Psychology: Learning, Memory, and Cognition, 2004-Mar](https://eric.ed.gov/?id=EJ689151)
56. [(PDF) Liking for happy-and sad-sounding music: Effects of exposure](https://www.researchgate.net/publication/230746012_Liking_for_happy-and_sad-sounding_music_Effects_of_exposure)
57. <https://anthonychmiel.com/wp-content/uploads/2025/08/Chmiel2017_BackToTheInvertedU.pdf>
58. [Emotional impact of AI-generated vs. human-composed music in audiovisual media: A biometric and self-report study](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12194076/)
59. [Understanding Listener Perceptions of AI and Human-Composed Music in Emotional Applications](https://arxiv.org/html/2506.02856)
60. [Understanding Listener Perceptions of AI and Human-Composed Music in Emotional Applications](https://arxiv.org/pdf/2506.02856)
61. <https://arxiv.org/pdf/2505.09872>
62. [Sigma Repository - International Nursing Research Congress (INRC): Can AI-Generated Music Interventions Improve Health Outcomes? A Systematic Review](https://www.sigmarepository.org/inrc/2026/presentations_2026/248/)
63. [Introduction](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2025.1669029/xml)
64. [(PDF) UnWind: a Musical Biofeedback for Relaxation Assistance](https://www.researchgate.net/publication/325807358_UnWind_a_Musical_Biofeedback_for_Relaxation_Assistance)
65. [Closed-Loop Rhythmic Haptic Biofeedback via Smartwatch ...](https://arxiv.org/pdf/2507.02432)
66. [\[2507.02432\] Closed-Loop Rhythmic Haptic Biofeedback via Smartwatch for Relaxation and Sleep Onset](https://arxiv.org/abs/2507.02432)
67. [Discovery Dynamics: Leveraging Repeated Exposure for User and Music Characterization](https://dl.acm.org/doi/fullHtml/10.1145/3523227.3551474)
