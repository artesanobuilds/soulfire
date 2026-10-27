# Sound, the Brain, and Mental Health: An Evidence-Graded Design Brief for an Adaptive Audioscape Generator

**Contents:** TL;DR · Key Findings · Details (Mechanisms, Evidence by Technique, Condition Mapping, Personalization, Safety, Landscape & Regulation) · Recommendations · Practical Summary Table · Caveats · Open Research Gaps · Naming the Feature · Sources

The evidence points to a small set of parameters that actually matter, and specific "magic frequencies" are not among them. Slow-tempo (≈60–80 BPM), listener-preferred music reliably lowers arousal and anxiety and improves subjective sleep. White or pink noise helps people with ADHD focus and slightly hurts everyone else. Fast amplitude modulation (beta range, roughly 12–20 Hz) embedded in music has early, industry-linked evidence for sustained attention. Binaural beats, 40 Hz gamma stimulation for mood, isochronic tones, and Solfeggio/432/528 Hz claims range from weak to unsupported. A generator built on tempo, arousal-matching, noise color, modulation depth/rate, preference, and closed-loop adaptation to heart rate variability (HRV) will be on firmer ground than one built on "brainwave frequencies."

## TL;DR

- **Strongest evidence (moderate certainty, meta-analyses/Cochrane):** receptive and therapist-led music for depression, anxiety, stress and insomnia. Slow tempo (60–80 BPM), low dynamic range, instrumental, and preferably self-selected, used daily for 14–90 days for sleep and ≤30 min sessions for acute anxiety/HRV. Effects are mostly on self-reported outcomes, and objective sleep measures do not reliably change.
- **Conditional/emerging evidence:** white/pink noise helps attention only in ADHD or high-symptom listeners (Hedges g = 0.249) and harms non-ADHD listeners (g = −0.212). Beta-rate amplitude-modulated music helps high-ADHD-symptom listeners in one multi-experiment, Brain.fm-co-authored study. Closed-loop pink-noise pulses reliably boost slow waves in sleep, but their memory benefit has faded across replications.
- **Weak or pseudoscientific:** binaural beats entrain the EEG inconsistently (5 of 14 studies supportive), and their anxiety benefits come mostly from small procedural-setting trials. 40 Hz gamma stimulation is an Alzheimer's device candidate (pivotal HOPE trial at 70 US sites, about 670–673 participants, topline results expected in 2026), not a validated mood treatment. 432 Hz rests on one 33-person pilot. Solfeggio/528 Hz has no credible support. Stay within FDA general-wellness claims unless you plan a regulated pathway.

## Key Findings

1. **The brain reliably follows rhythm, but "following" is not the same as "changing state."** Auditory steady-state responses (ASSRs) and frequency-following responses are robust, measurable cortical responses to periodic sound, peaking around 40 Hz. Whether that steady-state response changes endogenous oscillations, cognition, or mood is a separate and much weaker claim. A 2023 *Nature Neuroscience* study (Soula, Buzsáki lab) found that 40 Hz flicker did not engage native gamma oscillations or reduce amyloid in two Alzheimer's mouse models, and mice actively avoided it. The Tsai lab disputes this, and the disagreement remains unresolved.
2. **Arousal is the master variable.** Tempo, loudness, spectral brightness, rhythmic density and predictability shift autonomic arousal. Slow music increases vagally mediated HRV. A 2026 *Frontiers in Psychology* meta-analysis (PROSPERO CRD420261283257; 24 RCTs, 1,295 participants) found music raised normalized high-frequency HRV (HFnu, MD = 7.05) and lowered LFnu (MD = −4.94). Gains were largest in people with stress/anxiety/fear/sleep disorders. Short sessions (≤30 min) were "the only subgroup to show a significant increase in HFnu (MD = 14.25, 95% CI: 1.27–27.22)," and "participant-selected music yielded superior outcomes compared to standardized music."
3. **Reward is preference-driven and dopaminergic.** In a double-blind pharmacological study (Ferreri et al., *PNAS* 2019, n = 27), levodopa increased and risperidone decreased musical pleasure, chills and willingness to pay. Liked music engages the reward system that depression blunts, so personal preference is a mechanism, not just UX polish.
4. **Individual differences are large enough to flip the sign of effects.** Noise helps ADHD listeners and hurts others. About one-third of clinically diagnosed ADHD children performed *worse* with white noise, and higher hyperactivity traits predicted harm. Personalization is therefore a requirement for efficacy, not a feature.

## Details

### 1. Mechanisms

**Neural oscillations and entrainment.** The canonical bands are delta (0.5–4 Hz; slow-wave sleep), theta (4–8 Hz; drowsiness, memory, meditation), alpha (8–12 Hz; relaxed wakefulness, sensory gating), beta (13–30 Hz; active engagement, motor/cognitive control) and gamma (30–100 Hz; local cortical processing, binding). "Entrainment" in the strict sense means an external rhythm phase-aligning an *endogenous* oscillator. Much of the consumer literature conflates this with the trivially expected *evoked* steady-state response.

- **ASSR:** periodic amplitude modulation produces a cortical response at the modulation rate, strongest near 40 Hz in adults. This is the physiological basis of both Brain.fm-style AM music and 40 Hz gamma stimulation. Cognito's own analyses report that its device evokes a 40 Hz steady-state oscillation, quantified with a phase-locking index.
- **FFR:** the brainstem/cortical response that tracks the stimulus waveform and its fundamental frequency.
- **Binaural vs. monaural beats:** binaural beats arise centrally from two slightly different tones, one per ear, and are only perceptible at low carrier frequencies. Monaural beats and isochronic tones are physically amplitude-modulated signals. In the 2023 Ingendoh *PLOS ONE* review, theta *monaural* beats produced a larger ASSR than theta binaural beats, with the pattern reversed for gamma. Physically modulated signals are generally a stronger and more controllable driver than binaural beats.

**Rhythm, tempo and the autonomic nervous system.** Fast music (>100–120 BPM) raises heart rate and sympathetic tone. Slow music (≈60–80 BPM) is associated with parasympathetic dominance and lower heart rate, blood pressure and cortisol. A multilevel meta-analysis of music on stress (de Witte et al., *Health Psychology Review*) found larger physiological effects at 60–80 BPM. Breathing has its own resonance: paced breathing near 0.1 Hz (6 breaths/min) maximizes baroreflex-driven HRV oscillation. That gives an audio system a concrete target for guided breath pacing (see HRV biofeedback below).

**Dopamine and reward.** Beyond Ferreri 2019, the predictive-coding account holds that pleasure arises from violations and confirmations of expectation in rhythm and harmony. For a generator, this has a design implication: fully static loops may be *less* rewarding (and less engaging) than loops with controlled micro-variation.

### 2. Evidence by Technique (graded)

**Grading key:** **A** = multiple meta-analyses or Cochrane, moderate certainty; **B** = at least one meta-analysis or several RCTs, with caveats; **C** = small RCTs or a single multi-experiment paper, often with conflicts of interest; **D** = pilot or anecdotal; **X** = no credible evidence or contradicted.

**Binaural beats — Grade C (anxiety in procedural settings), D/X (entrainment claims).**
- Garcia-Argibay et al. 2019 meta-analysis (22 studies) found a medium-to-large anxiety effect for theta/delta beats, but it rested on only 5 effect sizes from 4 studies (total N = 159).
- Ingendoh et al. 2023 (*PLOS ONE*, 14 EEG studies): 5 supported entrainment, 8 contradicted it and 1 was mixed. Every study that embedded beats in pink noise found no entrainment, and secondary summaries report no beta-range study found entrainment.
- A 2026 meta-analysis of 13 RCTs of theta binaural beats found reduced pain (SMD −0.53). Anxiety reductions appeared mainly in procedural and chronic-pain contexts.
- A 2025 systematic review of young adults (PROSPERO CRD420251178490; no pooled meta-analysis because of heterogeneity) reported binaural-beat effects of d = 0.34–0.59.
- **Typical parameters used:** carrier 200–400 Hz, beat 4–7 Hz (theta) or 1–4 Hz (delta) for anxiety/sleep; sessions of 20–30 min via stereo headphones.
- **Design verdict:** optional ambient layer only. Never claim entrainment. Binaural beats require headphones and fail on speakers, and they are not demonstrably superior to music itself.

**Isochronic tones / monaural beats — Grade D.** They produce larger and more reliable ASSRs than binaural beats at low rates, but there are almost no clinical outcome trials. Use them as a *mechanism* (amplitude modulation of musical stems), not as raw pulsing tones, which many listeners find aversive.

**40 Hz gamma sensory stimulation — Grade C for Alzheimer's (device-specific, audiovisual), D for mood/cognition in healthy users.**
- Cognito's Spectris delivers synchronized 40 Hz light and sound for 1 h/day. The OVERTURE feasibility RCT (33 active vs. 20 sham completers; 85% adherence) reported slowed functional decline and less brain atrophy. As reported by Medical Economics, Cognito says OVERTURE showed "a 76% reduction in cognitive decline, a 77% reduction in functional decline, and a 69% reduction in whole brain atrophy over six months." Independent commentators note the trial did not reach significance on its primary cognitive-functional composite, so treat company percentages as promotional.
- The pivotal HOPE trial (NCT05637801) is described by Cognito as "a randomized, double-blind, sham-controlled trial conducted at 70 clinical sites across the United States." It finished enrolling in 2025: Medical Economics reported 670 participants, and Cognito's clinical-studies page lists 673. Its primary endpoint combines ADCS-ADL and MMSE. Cognito said "topline results from the HOPE study are expected in mid-2026," and CEO Christian Howell told BrightFocus he expected a readout "around August of 2026." I could not find a public pivotal efficacy readout as of this writing.
- An MIT 2025 open-label follow-up found sustained cognitive benefit over ~2 years in 3 late-onset patients but not in 2 early-onset patients. The brain-volume preservation seen at 3 months was not significant at 30 months.
- Mood: a double-blind RCT of 40 Hz transcranial vibroacoustic stimulation (30 min/day for 8 weeks) reported improved cognition and depressive symptoms in older adults. A 40 Hz light trial for major depression (FELIX, n = 60) has been designed, and a 40 Hz "chirp" sound reduced depression-like behavior in stressed rats. A 2025 study (n = 165) used 40 Hz auditory stimulation as a *biomarker* probe: people with MDD showed larger low-frequency HRV decreases.
- Japanese work (2025) showed 40 Hz amplitude-modulated *popular songs* (vocals and background separated and modulated) were safe and acceptable for healthy older adults.
- **Design verdict:** a 40 Hz AM "texture" on music stems is technically easy and appears safe for audio alone. Any cognitive or anti-dementia claim moves you into device territory, and mood claims are unproven.

**Closed-loop acoustic stimulation (CLAS) in sleep — Grade A for physiology, C for memory, ungraded for mental health.**
- The method: EEG detects slow oscillation (0.5–1.25 Hz) up-states, and ~50 ms pink-noise bursts are delivered phase-locked to them, typically in the first ~3 hours of NREM sleep.
- Ngo et al. 2013 (*Neuron*) boosted slow oscillations, spindles and word-pair memory. Papalambros 2017 found d = 0.63 memory gains in older adults (mean age 75).
- Replications were mixed. Henin 2019 (*eNeuro*) found enhanced oscillations but no memory benefit, and Schneider 2020 (*Sleep*) found no memory benefit in middle-aged adults and reduced susceptibility with age. A 2023 *Frontiers in Sleep* meta-analysis of 14 studies (2013–2023) found memory effects declining with publication date. Test-retest reliability of memory retention scores was near zero (ρ = 0.01), so studies are badly underpowered.
- A 2026 preprint (n = 16 older adults) shows stimulation increases slow-oscillation, theta and spindle power while preserving sleep architecture.
- **Design verdict:** CLAS requires real-time EEG (headband) and phase-tracking. It is a hardware roadmap item, not a phone-audio feature, and has no mental-health evidence yet.

**Colored noise and stochastic resonance — Grade B (ADHD only), with harm in non-ADHD listeners.**
- Nigg et al. 2024 (*JAACAP*, PROSPERO CRD42023393992) pooled 13 studies (N = 335). White/pink noise improved laboratory attention/executive tasks in youth with ADHD or high ADHD symptoms (g = 0.249, 95% CI 0.135–0.363). In non-ADHD comparison groups (k = 11), noise *impaired* performance (g = −0.212, 95% CI −0.355 to −0.069). No brown-noise studies existed.
- Söderlund et al. 2024 (n = 43 clinical ADHD children, noise ≈80 dB through headphones) found inattention traits predicted benefit, hyperactivity traits predicted harm, and roughly one-third performed worse.
- The proposed mechanism is the moderate brain arousal / stochastic resonance model, in which noise adds to under-aroused, low-dopamine systems.
- **Design verdict:** offer noise for focus only to users who screen positive for ADHD or inattention, or who show benefit in A/B self-testing. Brown noise is untested for focus. Note that the ~80 dB used in trials exceeds safe long-term listening levels (see Safety).

**Amplitude-modulated music for focus (Brain.fm) — Grade C.**
- Woods et al., *Communications Biology* 7:1376 (23 Oct 2024; author corrections Sept 2025 and Apr 2026). Strong added AM improved sustained attention, but only when it came early in the session. It increased attentional-network fMRI activity and EEG stimulus-brain coupling.
- Parametric manipulation of AM rate and depth in otherwise identical music showed beta-range modulation helped more for participants with more ADHD symptoms. Brain.fm describes its focus modulation as roughly 12–20 Hz (10–20 modulations/s).
- **Caveats:** the lead and other authors are Brain.fm staff, and there is no independent replication or clinical-population RCT.
- **Design verdict:** AM rate (Hz) and depth (%) are the most promising "neuro-parameters" for focus and should be exposed as tunable, A/B-testable variables.

**Tempo, rhythm, HR/breathing entrainment, and HRV biofeedback — Grade A/B.**
- Music interventions for stress: larger effects at 60–80 BPM (de Witte 2020 meta-analyses). In cardiac procedures, slow-paced (60–80 BPM) music was generally more effective for anxiety, though heterogeneity was extreme (I² = 99%).
- HRV biofeedback / resonance breathing: Goessl, Curtiss & Hofmann 2017 (*Psychological Medicine*; 24 studies, 484 participants) found a large reduction in self-reported stress and anxiety, with a pre-post within-group Hedges' g of 0.81 and g = 0.83 against control conditions. A 2025 meta-analysis of *remote* HRV biofeedback found a medium effect on depression (g = −0.41, k = 10) but not on perceived stress. A 2026 RCT (Sumińska et al., *Scientific Reports*, N = 88) found individually determined resonance frequency breathing was *not* superior to a fixed 0.1 Hz pace.
- **Design verdict:** an audio-paced breathing layer at 6 breaths/min (5 s in, 5 s out), optionally tapering from the user's current rate, is one of the best-supported features available, and a fixed 0.1 Hz pace is good enough.

**Music therapy and receptive music for depression/anxiety — Grade A (therapist-led), B (self-administered listening).**
- Cochrane (Aalbers et al. 2017; 9 studies, 421 participants) found music therapy plus usual care beat usual care alone on clinician-rated (SMD −0.98) and patient-reported (SMD −0.85) depression, with moderate-quality evidence, improved anxiety and functioning, and no excess adverse events. It remains unclear whether music therapy beats psychological therapy.
- A transdiagnostic meta-review found music-based (mostly listening) interventions improved depression (SMD 0.57, k = 27, n = 1,249), but with very-low GRADE certainty. A multilevel meta-analysis of 51 studies (93 effect sizes) supports music therapy for anxiety, with larger effects at >12 sessions.
- Insomnia: the Cochrane review by Jespersen et al. 2022 (13 RCTs, 1,007 participants) found moderate-certainty, large improvement in PSQI sleep quality from daily listening over 14–90 days. However, 3 studies (136 participants) with objective measures showed no clear improvement in sleep-onset latency, total sleep time or efficiency.
- **Important distinction:** "music therapy" involves a credentialed therapist relationship. An app delivers "music medicine/receptive listening," which has weaker and more heterogeneous evidence.

**Nature soundscapes and Attention Restoration Theory — Grade B.**
- Buxton et al. 2021 (*PNAS*) identified 36 publications and meta-analyzed 18. Natural sounds improved health outcomes and positive affect and reduced stress and annoyance. Water sounds had the largest effects on health and positive affect, and birdsong the largest effects on stress/annoyance.
- A 2024 systematic review and meta-analysis in *Stress* supports stress reduction but flags confounded control conditions.
- Adding traffic noise (especially 40 mph traffic) to natural soundscapes erased their mood benefits.
- **Design verdict:** water and bird layers are well-supported "restorative" content. Keep them free of anthropogenic sounds.

**Solfeggio, 432 Hz, 528 Hz — Grade D/X.**
- 432 Hz: one double-blind crossover pilot (Calamassi & Pomponi 2019, n = 33) found heart rate 4.79 BPM lower than with 440 Hz tuning (p = 0.05), with non-significant blood-pressure changes, plus a 2022 pilot in emergency nurses. These are tiny, unreplicated studies from one group, and a 1.8% pitch shift has no plausible mechanism distinct from any other tuning.
- 528 Hz: a single small study (Akimoto et al. 2018) appeared in a low-impact journal.
- Solfeggio "healing frequencies" rest on numerology and have no physiological basis.
- **Design verdict:** do not make claims. If users want 432 Hz as a preference, it is harmless to offer as a tuning option labeled "aesthetic preference."

### 3. Condition-Specific Mapping

**Focus/attention**
- For ADHD or inattentive users, offer white/pink noise at moderate level, or AM music with beta-range modulation (12–20 Hz) at strong depth.
- For neurotypical users, prefer low-salience instrumental music without lyrics or low-level nature sound. Avoid noise by default, given the negative effect in non-ADHD groups.
- Brain.fm's data suggest the benefit appears early in a session, so build in session structure (e.g., 25–50 min blocks) rather than endless loops.

**Anxiety**
- Use 60–80 BPM (or tempo set slightly below the user's resting heart rate), with a narrow dynamic range, soft attacks, low spectral centroid, predictable harmony, and no lyrics. Self-selected music or a learned preference profile improves outcomes.
- A 0.1 Hz breathing pacer works as a melodic or swell cue.
- Delivery: ≤30 min sessions for acute relief, and daily use for trait anxiety. Theta binaural beats are acceptable as an optional layer in procedural or acute contexts only.

**Depression**
- Engagement and reward matter more than sedation. Use preferred, emotionally congruent-then-uplifting music (iso-principle: match the current mood, then shift valence and tempo gradually).
- Sessions should be repeated over weeks; Cochrane benefits were short-term (≤3 months) and therapist-delivered.
- Pair with HRV biofeedback breathing, which has medium depression effects.
- 40 Hz audio for mood is investigational only.

**Sleep/stress**
- Use slow (≈60 BPM and decelerating), low-frequency-weighted, low-brightness music or pink/brown-ish noise, with gradual fade-out. Listen nightly for 14–90 days.
- Pink noise is a reasonable masker. CLAS needs EEG and is a future-hardware feature.
- For daytime stress recovery, use nature soundscapes (birdsong for stress, water for positive affect).

### 4. Personalization and Adaptive Systems

- **Baseline arousal:** the moderate brain arousal model predicts that under-aroused users (ADHD, depressed or fatigued) benefit from added stimulation such as noise or fast AM, while over-aroused users (anxious) need down-regulation. An initial arousal estimate (self-report, resting heart rate, HRV) should select the branch.
- **ADHD vs. neurotypical:** sign-flipping effects (g = +0.249 vs −0.212) make a short screener (e.g., ASRS) or an in-app A/B task essential before defaulting to noise.
- **Preference and personality:** participant-selected music produced larger HRV effects, and dopamine-mediated pleasure depends on liking. Introversion, neuroticism and preference moderate background-music distraction (cited in Woods et al.).
- **Closed-loop biosignals:** wearable HRV (RMSSD, HF power) and heart rate can drive tempo, density and breath-pacer rate. EEG headbands enable CLAS and attention decoding. The only published closed-loop consumer evidence for focus is the Arctop/Endel study (*Frontiers in Computational Neuroscience* 2021). Its EEG-decoded "focus" was higher with Endel than silence 87% of the time and higher than a Spotify playlist 37% of the time. The study was funded by Endel and Arctop, the outcome is a proprietary decoder rather than a validated clinical measure, and Endel's marketed "7x focus" and "3.6x stress decrease" come from that study and from experience-sampling surveys.
- **Generative/AI music:** no RCT shows that AI-generated adaptive music outperforms well-chosen fixed music for any clinical outcome. This is the field's biggest gap and the product's biggest opportunity.
- **Reward-proxy risk:** biofeedback systems that optimize a proxy (e.g., coherence scores) can teach users to game the metric rather than regulate. Optimize for validated outcomes (PHQ-9, GAD-7, PSQI, task performance), not just in-session HRV.

### 5. Safety and Limits

- **Hearing:** the WHO-ITU H.870 standard sets a weekly sound allowance of 80 dB(A) for 40 h/week for adults and 75 dB(A) for 40 h/week for children/sensitive users. 100 dB for 16 minutes equals 80 dB for 40 hours. In its 2 March 2022 release, WHO stated that "over 1 billion people aged 12 to 35 years risk losing their hearing due to prolonged and excessive exposure to loud music and other recreational sounds." Implement dose metering, default output caps (≈60–70 dB(A) for long loops), and warnings at 80% of the weekly allowance. ADHD noise trials used ~80 dB, which is not suitable for all-day use.
- **Seizure risk:** photosensitive-epilepsy concerns apply chiefly to flicker (Cognito's device is audiovisual). Audio-only 40 Hz AM appears well tolerated, but avoid pairing audio with visual flicker, and screen for epilepsy if any visual component is added. Musicogenic epilepsy is rare but exists.
- **Tinnitus/hyperacusis:** broadband noise and harsh AM can aggravate symptoms in some people (and is used therapeutically in others). Offer low-level, notch-free options and an opt-out.
- **Behavioral harms:** noise worsened performance in about one-third of ADHD children and in non-ADHD users. Sleep audio left on all night adds to the noise dose. Mental-health users may delay effective care if claims are inflated.
- **Expectancy/placebo:** most music, binaural-beat and noise trials cannot blind participants. Cochrane downgraded insomnia evidence because participants and assessors knew the allocation. Use active controls (e.g., same music without AM) in your own research.

### 6. Landscape and Regulation

| Product | Core approach | Published evidence | Assessment |
|---|---|---|---|
| Brain.fm | Beta-range AM in composed music | Woods et al. 2024, *Commun Biol* (company-co-authored; fMRI/EEG/behavior) | Best-documented consumer focus product; needs independent RCT |
| Endel | Generative soundscapes adapting to time, heart rate, location | Arctop/Endel EEG study 2021 (*Front Comput Neurosci*), company-funded | Plausible; marketing multipliers overstate evidence |
| Spiritune | Curated music for mood shifting | No peer-reviewed outcome trial located in this review | Unverified |
| myNoise | Calibrated noise/soundscape generators | No clinical trials located | Useful tool; no claims |
| MedRhythms InTandem | Rhythmic auditory stimulation for post-stroke gait | FDA Class II De Novo (2023); multi-site RCT (*Nat Commun* 2024): +0.14 vs +0.06 m/s gait speed, 40% vs 13% responders | The precedent for an FDA-authorized audio-based therapeutic, but for motor, not mental, health |
| Cognito Spectris | 40 Hz light + sound for Alzheimer's | OVERTURE RCT; HOPE pivotal (70 US sites, 670–673 participants; topline expected 2026) pending | Investigational; Breakthrough Device designation |
| EndeavorRx (Akili) | Video game for pediatric ADHD | FDA De Novo 2020 | Not audio-based; shows the PDT pathway for attention |

**Regulatory line (US):** FDA's revised *General Wellness: Policy for Low Risk Devices* guidance (6 January 2026, superseding the 2019 version) keeps the two-factor test. A product falls under enforcement discretion if (1) it is intended *only* for general wellness, and (2) it is low risk (non-invasive, not implanted, no technology needing specific controls). Wellness claims ("helps you relax," "supports focus," "improves sleep quality") and healthy-lifestyle claims tied to well-understood disease-risk reduction are permitted. Claims to treat, diagnose or mitigate a specific disease ("treats depression," "reduces ADHD symptoms," "slows cognitive decline") make the product a device, requiring 510(k)/De Novo, as with InTandem and EndeavorRx. The 2026 revision broadened acceptable non-invasive wearable sensing (even blood-pressure estimation for wellness), which helps HRV-adaptive audio. Labeling, however, must not exceed the wellness intended use. As a mental-health platform, watch that clinical-adjacent marketing ("for your anxiety disorder") doesn't create device intended use.

## Recommendations

1. **Build the core engine on validated parameters:** tempo (50–120 BPM continuous), dynamic range, spectral centroid/brightness, rhythmic density, AM rate (0–40 Hz) and depth (0–100%), noise color/level, nature-layer mix, and a breath pacer (default 0.1 Hz).
2. **Gate techniques by phenotype:** ADHD/inattentive users get noise and beta AM; anxious users get 60–80 BPM plus the breath pacer; depressed users get preference-driven iso-principle progressions; sleep users get decelerating low-brightness audio or pink noise with fade.
3. **Close the loop with wearable HRV and heart rate first, EEG later.** Adapt tempo toward a target heart rate and breathing toward 6/min.
4. **Measure clinical outcomes** (PHQ-9, GAD-7, PSQI, brief attention tasks) in-app with embedded micro-randomized trials against active controls.
5. **Stay in general wellness** for launch, and make no frequency-specific healing claims. If you pursue a depression or anxiety indication later, design an RCT with an active audio control.
6. **Enforce hearing safety by default** (WHO H.870 dose model).

## Practical Summary Table

| Condition | Recommended audio parameters | Dose/delivery | Evidence strength |
|---|---|---|---|
| Focus (ADHD/inattentive) | White or pink noise, moderate level; or music with AM at 12–20 Hz (beta), strong depth | 25–50 min work blocks; headphones or speakers; keep <75–80 dB(A) | B (noise, g = 0.249); C (AM music) |
| Focus (neurotypical) | Instrumental, lyric-free, low-salience music or soft nature sound; avoid noise default | Task-length sessions | C (noise harms: g = −0.212) |
| Anxiety (acute) | 60–80 BPM, low dynamic range, soft timbre, low brightness, self-selected; 0.1 Hz breath pacer | ≤30 min | A/B (music meta-analyses; HRV meta-analysis) |
| Anxiety (procedural) | Above ± theta binaural beats (carrier ~200–400 Hz, beat 4–7 Hz) | 20–30 min, headphones | C |
| Depression | Preferred, reward-engaging music; iso-principle mood progression; HRV-biofeedback breathing | Repeated sessions over weeks; adjunct to care | A (therapist-led music therapy, SMD −0.85 to −0.98); B/very low (self-listening, SMD 0.57); B (HRV-B, g = −0.41) |
| Sleep | ~60 BPM decelerating, low-frequency-weighted, no lyrics; or pink noise masking; fade-out | Nightly for 14–90 days | A for subjective sleep quality (Cochrane); objective sleep not improved |
| Sleep (deep sleep enhancement) | Closed-loop 50 ms pink-noise pulses at slow-oscillation up-state | EEG headband, first ~3 h NREM | A (physiology); C (memory); none for mental health |
| Stress recovery | Nature soundscapes: birdsong (stress), water (positive affect), no traffic | 10–30 min breaks | B |
| Cognition (aging) | 40 Hz AM audio (± light) | 1 h/day | C, Alzheimer's-specific, device-regulated |
| Any (claims to avoid) | Solfeggio, 528 Hz, 432 Hz "healing" | — | D/X |

## Caveats

- Most evidence comes from small, unblinded trials with heterogeneous protocols. Effect sizes for listening interventions are inflated by expectancy, and objective outcomes lag subjective ones.
- Key positive studies in the consumer space (Brain.fm, Endel) are company-funded or company-authored. Cognito's headline percentages come from press releases.
- The CLAS memory literature shows a classic decline effect, and the 40 Hz mechanism is actively contested.
- Some figures (e.g., "no beta-range binaural study found entrainment," OVERTURE's primary-endpoint result) come from secondary summaries and should be verified against primary texts before external use.

## Open Research Gaps the Product Could Address

1. **AI-adaptive vs. static music:** no RCT shows that generative or closed-loop music beats well-chosen fixed playlists on PHQ-9/GAD-7/PSQI. A micro-randomized trial at platform scale could be the first.
2. **Brown noise for focus:** completely untested; ripe for in-app A/B experiments.
3. **AM rate × phenotype dose-response:** independent replication of beta-rate AM benefits, and whether optimal rate tracks individual alpha/beta peaks.
4. **Responder prediction:** which baseline features (ADHD subtype, HRV, personality, preference) predict benefit or harm from noise and AM.
5. **Long-term effects:** almost no trials exceed 3 months; real-world engagement data could map durability and habituation.
6. **Audio-only 40 Hz for mood:** no adequately powered human RCT exists.
7. **Objective sleep outcomes** from wearable-measured sleep paired with music/noise interventions.
8. **Active-control blinding:** using matched audio without the "active ingredient" (e.g., AM removed) would substantially strengthen the field's evidence base.

## Naming the Feature

Total Brain, the app SonderMind acquired, called a similar feature "Neurotunes." That name is catchy but unavailable, so the goal is a short name for adaptive soundscapes that resonate with the listener's brain and body, chosen in light of what the research above actually supports.

### Principles Drawn from the Research

1. **Name what works, not "magic frequencies."** The strongest levers are tempo, arousal-matching, breath pacing, heart-rate adaptation and personal preference. A name built on those ideas stays accurate as the product evolves.
2. **Keep "Hz," "frequency," "brainwave" and "healing" out of the name.** These terms tie the product to binaural-beat and Solfeggio apps whose claims the evidence doesn't support, and they invite overclaiming.
3. **Avoid treatment language.** Words like Rx, Thera-, Cure or a condition name signal disease-treatment intent and can pull the product out of FDA general-wellness territory (see Section 6).
4. **Make it short and usable as a noun in the UI**, e.g., "Start an IsoTune" or "Your evening IsoTune."

### Recommendation: IsoTune

IsoTune comes from the iso-principle used in music therapy: the music first meets the listener's current mood and arousal, then gradually moves tempo, brightness and valence toward the target state (calmer, more focused, more energized). That is exactly what the generator does, so the name describes the mechanism rather than promising an outcome. It keeps the "-tune" familiarity of Neurotunes without copying it, and a quick web and App Store search found no app using it.

The main downside is that "iso" isn't self-explanatory to most consumers, so onboarding should explain it in one line, for example: "We start where you are, then tune you toward where you want to be."

### Shortlist

| Name | Meaning and research tie | Strengths | Watch-outs |
|---|---|---|---|
| **IsoTune** (recommended) | Iso-principle: match the current mood, then shift gradually | Describes the mechanism; short; "-tune" familiarity; no conflict found in a quick search | "Iso" needs a one-line explanation |
| **Sintonía** | Spanish for being in tune with, or on the same wavelength as | Warm and distinctive in English-language stores; bilingual appeal | Accent and pronunciation for English speakers; not yet checked for conflicts |
| **Heartscape** | Soundscapes that follow your heart | Best fit if tempo and breath pacing adapt to wearable HRV/heart rate, the best-supported adaptive loop | Weaker fit without wearable integration; not yet checked for conflicts |
| **Cadence** | Rhythm and breathing pace (0.1 Hz pacer) | Easy to say; accurate | Common word; hard to own or trademark |
| **Inner Tempo** | Tempo as the master variable for arousal | Accurate to the evidence | Generic; two words |

### Names to Avoid (Existing Uses Found)

| Name | Existing use | Source |
|---|---|---|
| Attune | Blue Note Therapeutics' attune™, a digital software medical device tested in a randomized trial for anxiety in people with cancer | [ClinicalTrials.gov NCT05227898](https://clinicaltrials.gov/study/NCT05227898) |
| Attunes | Binaural-beat app for focus, sleep, calm and energy | [Attunes listing](https://dolphinvoice.ai/en/ai-apps/attunes-tune-your-mind-1076604) |
| My Attune | EEG-guided meditation app with auditory feedback and soundscapes | [App Store](https://apps.apple.com/us/app/my-attune/id6751806453) |
| Attune Audio | Builds layered ambient soundscapes from the user's activity and mood | [Product Hunt](https://www.producthunt.com/products/attune-audio) |
| ReAttune | Markets "therapeutic sound frequencies" for anxiety, stress, focus/ADHD and sleep | [App Store](https://apps.apple.com/app/id6757203655) |
| SoundMind | Music therapy app from USC alumni offering custom soundscapes for anxiety and stress | [USC Thornton](https://music.usc.edu/?p=120996) |
| Resona | Resona Audio, an existing App Store / Google Play audio app | [AppBrain](https://www.appbrain.com/appstore/resona-audio/ios-6759027946) |

### Before Committing to a Name

These were quick web and App Store checks, not trademark clearance, and this section is not legal advice. Before choosing, run a USPTO trademark search on the finalists in the relevant classes (for example, Class 9 for downloadable software, Class 41 for music and entertainment services, and Class 44 for health and wellness services). Also check App Store, Google Play and domain availability, and test the top two or three names with target users for recall and the feeling they convey.

## Sources

**Mechanisms and reward**
- Soula et al. 2023, 40 Hz light does not entrain native gamma in AD mice (*Nature Neuroscience*): https://www.nature.com/articles/s41593-023-01270-2
- Ferreri et al. 2019, dopamine modulates musical reward (*PNAS*): https://www.ub.edu/brainvitge/wp-content/uploads/2019/01/Ferreri_PNAS_2019-1.pdf
- Music and HRV meta-analysis of RCTs (2026): https://pubmed.ncbi.nlm.nih.gov/41822413/
- de Witte et al., music interventions and stress (*Health Psychology Review*): https://www.tandfonline.com/doi/full/10.1080/17437199.2019.1627897

**Binaural beats**
- Ingendoh et al. 2023, binaural beats and entrainment systematic review (*PLOS ONE*): https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0286023
- Garcia-Argibay et al. 2019 meta-analysis: https://www.researchgate.net/publication/326784313_Efficacy_of_binaural_auditory_beats_in_cognition_anxiety_and_pain_perception_a_meta-analysis
- Theta binaural beats meta-analysis of RCTs (2026): https://www.sciencedirect.com/science/article/abs/pii/S155083072600159X
- Music and binaural beats in young adults, systematic review (2025): https://pubmed.ncbi.nlm.nih.gov/41656644/

**40 Hz gamma stimulation**
- Cognito Therapeutics clinical studies: https://www.cognitotx.com/clinical-studies
- MIT 2025 long-term follow-up: https://news.mit.edu/2025/study-suggests-40hz-sensory-stimulation-may-benefit-some-alzheimers-patients-1114
- FELIX trial design, 40 Hz light for depression: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11107857/
- 40 Hz AM audio safety in older adults (Japan, 2025): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12564345/

**Closed-loop acoustic stimulation in sleep**
- Papalambros et al. 2017: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5340797/
- Henin et al. 2019: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6831893/
- CLAS memory meta-analysis (*Frontiers in Sleep*, 2023): https://www.frontiersin.org/journals/sleep/articles/10.3389/frsle.2023.1082253/full

**Noise and amplitude-modulated music for focus**
- Nigg et al. 2024, white/pink noise and ADHD meta-analysis (*JAACAP*): https://pubmed.ncbi.nlm.nih.gov/38428577/
- Woods et al. 2024, rapid modulation in music and attention (*Communications Biology*): https://nature.com/articles/s42003-024-07026-3

**HRV biofeedback and breathing**
- Remote HRV biofeedback meta-analysis (2025): https://link.springer.com/article/10.1007/s10484-025-09750-w
- Sumińska et al. 2026, resonance frequency vs. fixed 0.1 Hz breathing (*Scientific Reports*): https://www.nature.com/articles/s41598-026-53333-6

**Music therapy and listening**
- Cochrane, music therapy for depression: https://www.cochrane.org/evidence/CD004517_music-therapy-depression
- Transdiagnostic meta-review of music therapy and music medicine (*BJPsych Open*): https://www.cambridge.org/core/journals/bjpsych-open/article/evidence-for-music-therapy-and-music-medicine-in-psychiatry-transdiagnostic-metareview-of-metaanalyses/F9E4A53369277834810C86D1B941CAE0
- Cochrane, listening to music for insomnia (Jespersen et al. 2022): https://www.cochranelibrary.com/cdsr/doi/10.1002/14651858.CD010459.pub3/full

**Nature soundscapes**
- Buxton et al. 2021 summary (*PNAS*): https://www.eurekalert.org/news-releases/593536
- Natural sounds and stress meta-analysis (*Stress*, 2024): https://www.tandfonline.com/doi/full/10.1080/10253890.2024.2402519
- Traffic noise erases natural-soundscape mood benefits: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11602051/

**432 Hz**
- Calamassi & Pomponi 2019 pilot: https://www.academia.edu/80163432/Music_tuned_to_440_Hz_versus_432_Hz_and_the_health_effects_a_double_blind_cross_over_pilot_study

**Personalization and products**
- Arctop/Endel EEG focus study (2021): https://pmc.ncbi.nlm.nih.gov/articles/PMC8829886/
- MedRhythms InTandem multi-site RCT (*Nature Communications*, 2024): https://www.nature.com/articles/s41467-024-44791-5

**Safety and regulation**
- WHO-ITU H.870 safe listening standard: https://www.itu.int/epublications/ru/publication/itu-t-h-870-v2-2022-03-guidelines-for-safe-listening-devices-systems/en
- FDA revised General Wellness guidance (January 2026), Covington summary: https://www.cov.com/en/news-and-insights/insights/2026/01/fda-issues-revised-guidance-on-general-wellness-products
