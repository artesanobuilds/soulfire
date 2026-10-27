"use client";
import { useEffect, useRef, useState, type Ref } from "react";
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Waves,
  ArrowLeft,
  Bookmark,
  Trash2,
  Volume2,
} from "lucide-react";
import {
  createCurrentRecipe,
  currentGoals,
  currentKinds,
  currentLabels,
  currentStorageKey,
  defaultCurrentInput,
  readCurrentMixes,
  type CurrentInput,
  type CurrentRecipe,
  type CurrentKind,
} from "../domain/current";
import {
  CurrentAudio,
  type CurrentAudioState,
} from "../infrastructure/current-audio";

const inputFromRecipe = (recipe: CurrentRecipe, words = ""): CurrentInput => ({
  goal: recipe.goal,
  preferred: recipe.preferred,
  excluded: recipe.excluded,
  intensity: recipe.intensity,
  brightness: recipe.brightness,
  movement: recipe.movement,
  minutes: recipe.minutes,
  words,
});
const emptyPlayer: CurrentAudioState = {
  phase: "idle",
  elapsed: 0,
  total: 0,
  preview: false,
  level: 0,
  message: "Ready when you are. Nothing plays automatically.",
};
const clock = (seconds: number) =>
  `${Math.floor(Math.max(0, seconds) / 60)}:${Math.floor(
    Math.max(0, seconds) % 60,
  )
    .toString()
    .padStart(2, "0")}`;

export function CurrentPanel({
  blocked,
  motionEnabled,
  headingRef,
  onBack,
}: {
  blocked: boolean;
  motionEnabled: boolean;
  headingRef: Ref<HTMLHeadingElement>;
  onBack: () => void;
}) {
  const [input, setInput] = useState<CurrentInput>({ ...defaultCurrentInput });
  const [recipe, setRecipe] = useState<CurrentRecipe | null>(null);
  const [dirty, setDirty] = useState(false),
    [variation, setVariation] = useState(0);
  const [player, setPlayer] = useState(emptyPlayer),
    [saved, setSaved] = useState<CurrentRecipe[]>([]);
  const [saveConsent, setSaveConsent] = useState(false),
    [saveMessage, setSaveMessage] = useState("");
  const [storageUnreadable, setStorageUnreadable] = useState(false),
    [resetConfirm, setResetConfirm] = useState(false);
  const [error, setError] = useState("");
  const engine = useRef<CurrentAudio | null>(null);
  const listening = useRef<HTMLDivElement>(null);
  const playerRegion = useRef<HTMLDivElement>(null);
  function focusPlayer() {
    const from = document.activeElement;
    requestAnimationFrame(() => {
      if (
        document.activeElement !== from &&
        document.activeElement !== document.body
      )
        return;
      playerRegion.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width:850px)").matches)
        listening.current?.scrollIntoView({
          block: "start",
          behavior: motionEnabled ? "smooth" : "instant",
        });
    });
  }
  useEffect(() => {
    const audio = new CurrentAudio(setPlayer);
    engine.current = audio;
    try {
      setSaved(readCurrentMixes(localStorage.getItem(currentStorageKey)));
    } catch {
      setStorageUnreadable(true);
      setSaveMessage(
        "Saved mixes are unavailable or unreadable. They were left unchanged; you can still create and play a mix.",
      );
    }
    const hide = () => {
      if (document.hidden)
        audio.pause(
          "Paused when the tab was hidden. Press Resume to continue; background playback is not guaranteed on mobile.",
        );
    };
    const leave = () =>
      audio.pause("Paused when leaving the page. Press Resume to continue.");
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", leave);
    return () => {
      engine.current = null;
      audio.dispose();
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", leave);
    };
  }, []);
  useEffect(() => {
    if (blocked)
      engine.current?.pause(
        "Paused for another activity. Press Resume when you return.",
      );
  }, [blocked]);
  function changeInput(patch: Partial<CurrentInput>) {
    engine.current?.stop(
      "Choices changed. Create your updated mix before playing.",
    );
    setInput((value) => ({ ...value, ...patch }));
    setDirty(true);
    setError("");
  }
  function preference(kind: CurrentKind, excluded: boolean) {
    const key = excluded ? "excluded" : "preferred";
    const values = input[key].includes(kind)
      ? input[key].filter((k) => k !== kind)
      : [...input[key], kind];
    changeInput({
      [key]: values,
      ...(excluded
        ? { preferred: input.preferred.filter((k) => k !== kind) }
        : { excluded: input.excluded.filter((k) => k !== kind) }),
    });
  }
  function create(nextVariation = variation) {
    engine.current?.stop("Mix ready. Press Preview or Play when you’re ready.");
    setError("");
    setSaveMessage("");
    try {
      const next = createCurrentRecipe(input, nextVariation);
      next.volume = recipe?.volume ?? 0.25;
      setRecipe(next);
      setInput((value) => inputFromRecipe(next, value.words || ""));
      setDirty(false);
      setVariation(nextVariation);
      setSaveConsent(false);
      focusPlayer();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "The mix could not be created. Adjust your choices and try again.",
      );
    }
  }
  function edit(next: CurrentRecipe) {
    setRecipe(next);
    engine.current?.layersTo(next);
    engine.current?.volumeTo(next.volume);
  }
  function play(preview = false, resume = false) {
    if (!recipe || dirty || blocked || !recipe.name.trim()) return;
    setError("");
    engine.current?.volumeTo(recipe.volume);
    void engine.current?.play(recipe, preview, resume);
  }
  function writeSaved(next: CurrentRecipe[]) {
    try {
      localStorage.setItem(currentStorageKey, JSON.stringify(next));
      setSaved(next);
      setSaveMessage("Saved mixes updated on this browser.");
      return true;
    } catch {
      setSaveMessage(
        "Couldn’t save on this browser. Your mix still works in this tab; no saved copy was changed.",
      );
      return false;
    }
  }
  function save() {
    if (!recipe || !saveConsent || storageUnreadable || !recipe.name.trim())
      return;
    const next = [recipe, ...saved.filter((mix) => mix.id !== recipe.id)];
    if (next.length > 12) {
      setSaveMessage(
        "You have 12 saved mixes. Remove one before saving another.",
      );
      return;
    }
    if (writeSaved(next))
      setSaveMessage(
        "Mix saved on this browser. Optional words were not saved.",
      );
  }
  function load(mix: CurrentRecipe) {
    engine.current?.stop("Saved mix loaded. Press Play when ready.");
    setRecipe(mix);
    setInput(inputFromRecipe(mix));
    setDirty(false);
    setSaveConsent(false);
    setError("");
    focusPlayer();
  }
  const active = player.phase === "playing" || player.phase === "starting";
  const hasAudio = active || player.phase === "paused";
  const remaining = Math.max(0, player.total - player.elapsed);
  return (
    <section className="current-page" aria-label="Current soundscapes">
      <div className="current-heading">
        <button className="text-link" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Soulfire
        </button>
        <div className="current-title">
          <span className="current-emblem" aria-hidden="true">
            <Waves size={30} />
          </span>
          <div>
            <h1 ref={headingRef} tabIndex={-1}>
              Current
            </h1>
            <p>Personalized soundscapes</p>
          </div>
        </div>
        <p>
          A little space to find your flow. Choose the sounds you enjoy, then
          shape a mix that feels right to you.
        </p>
      </div>
      {hasAudio && (
        <div className="current-livebar">
          <span>
            {player.phase === "starting"
              ? "Opening audio…"
              : player.phase === "paused"
                ? "Paused"
                : player.preview
                  ? "Preview playing"
                  : "Current is playing"}{" "}
            · {clock(remaining)}
          </span>
          <button onClick={() => engine.current?.stop()}>
            <Square size={15} /> Stop Current
          </button>
        </div>
      )}
      <div className="current-layout">
        <form
          className="current-choices"
          onSubmit={(event) => {
            event.preventDefault();
            create();
          }}
        >
          <span className="eyebrow">MAKE ROOM FOR YOUR MOMENT</span>
          <h2>What would you like support with?</h2>
          <fieldset className="current-goals">
            <legend>Choose a listening intention</legend>
            {Object.entries(currentGoals).map(([value, label]) => (
              <label
                key={value}
                className={input.goal === value ? "selected" : ""}
              >
                <input
                  type="radio"
                  name="current-goal"
                  value={value}
                  checked={input.goal === value}
                  onChange={() =>
                    changeInput({ goal: value as CurrentInput["goal"] })
                  }
                />
                {label}
              </label>
            ))}
          </fieldset>
          <h3>Your sound preferences</h3>
          <p className="small">
            Prefer a sound, leave it out, or keep an open mind. There are no
            voices in these mixes.
          </p>
          <div className="current-preferences">
            {currentKinds.map((kind) => (
              <div key={kind}>
                <span>{currentLabels[kind]}</span>
                <label>
                  <input
                    type="checkbox"
                    aria-label={`Prefer ${currentLabels[kind]}`}
                    checked={input.preferred.includes(kind)}
                    onChange={() => preference(kind, false)}
                  />{" "}
                  Prefer
                </label>
                <label>
                  <input
                    type="checkbox"
                    aria-label={`Exclude ${currentLabels[kind]}`}
                    checked={input.excluded.includes(kind)}
                    onChange={() => preference(kind, true)}
                  />{" "}
                  Leave out
                </label>
              </div>
            ))}
          </div>
          <label className="current-field">
            A few words about the sound (optional)
            <textarea
              maxLength={300}
              value={input.words || ""}
              onChange={(e) => changeInput({ words: e.target.value })}
              placeholder="For example, water and warm tones, no rain"
            />
          </label>
          <p className="small">
            Simple sound words can shape the mix. Your text stays in this tab:
            never sent to a model or saved with a recipe.
          </p>
          <details className="current-shape">
            <summary>Shape the texture</summary>
            <label>
              Texture presence{" "}
              <input
                type="range"
                min="0"
                max="1"
                step=".05"
                value={input.intensity}
                onChange={(e) =>
                  changeInput({ intensity: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Brightness{" "}
              <input
                type="range"
                min="0"
                max="1"
                step=".05"
                value={input.brightness}
                onChange={(e) =>
                  changeInput({ brightness: Number(e.target.value) })
                }
              />
            </label>
            <label>
              Movement{" "}
              <input
                type="range"
                min="0"
                max="1"
                step=".05"
                value={input.movement}
                onChange={(e) =>
                  changeInput({ movement: Number(e.target.value) })
                }
              />
              <small>Zero keeps the texture steady, without swells.</small>
            </label>
          </details>
          <button className="primary" type="submit">
            {recipe ? "Update my mix" : "Create my mix"}
          </button>
          {error && <p role="alert">{error}</p>}
        </form>
        <div className="current-listening" ref={listening}>
          <div
            className="current-landscape"
            data-playing={
              player.phase === "playing" && motionEnabled ? "true" : "false"
            }
          >
            <CurrentLandscape />
            <div className="current-landscape-caption">
              <span className="eyebrow">YOUR LISTENING SPACE</span>
              <h2>{recipe?.name || "A gentler kind of current."}</h2>
              <p>
                {recipe
                  ? "Your custom procedural mix"
                  : "Ready when you are. Nothing plays automatically."}
              </p>
            </div>
          </div>
          {!recipe ? (
            <div className="current-empty">
              <Waves size={30} />
              <h3>Start with what you enjoy.</h3>
              <p>
                Choose an intention and sound preferences. Your mix is generated
                locally, without an account or paid audio service.
              </p>
            </div>
          ) : (
            <div
              className="current-player"
              role="region"
              aria-label="Current player"
              tabIndex={-1}
              ref={playerRegion}
            >
              <label className="current-field">
                Mix name
                <input
                  maxLength={60}
                  value={recipe.name}
                  onChange={(e) => edit({ ...recipe, name: e.target.value })}
                />
              </label>
              <p className="current-ingredients">
                {recipe.layers
                  .map((layer) => currentLabels[layer.kind])
                  .join(" · ")}
              </p>
              <p className="small">
                A creative starting balance for{" "}
                {currentGoals[recipe.goal].toLowerCase()}, using your chosen
                sounds. Adjust it freely to suit your taste.
              </p>
              <p className="current-player-status" role="status">
                {player.message}
                {player.phase === "playing" &&
                recipe.layers.every((l) => l.muted || l.level === 0)
                  ? " · All layers muted"
                  : ""}
              </p>
              <div className="current-transport">
                <button
                  className="primary"
                  disabled={
                    dirty ||
                    blocked ||
                    !recipe.name.trim() ||
                    player.phase === "starting"
                  }
                  onClick={() =>
                    player.phase === "playing"
                      ? engine.current?.pause()
                      : play(
                          player.phase === "paused" && player.preview,
                          player.phase === "paused",
                        )
                  }
                >
                  {player.phase === "playing" ? (
                    <Pause size={18} />
                  ) : (
                    <Play size={18} />
                  )}{" "}
                  {player.phase === "playing"
                    ? "Pause mix"
                    : player.phase === "paused"
                      ? "Resume mix"
                      : "Play mix"}
                </button>
                <button
                  disabled={active || blocked || dirty || !recipe.name.trim()}
                  onClick={() => play(true)}
                >
                  Preview 20 seconds
                </button>
                <button
                  disabled={!hasAudio}
                  onClick={() => engine.current?.stop()}
                >
                  <Square size={16} /> Stop mix
                </button>
              </div>
              {dirty && (
                <p className="small">
                  Your choices changed. Update your mix before playing.
                </p>
              )}
              <div className="current-player-settings">
                <label>
                  <Volume2 size={16} /> Master volume{" "}
                  <input
                    aria-label="Current master volume"
                    type="range"
                    min="0"
                    max=".7"
                    step=".01"
                    value={recipe.volume}
                    onChange={(e) =>
                      edit({ ...recipe, volume: Number(e.target.value) })
                    }
                  />
                  <span>{Math.round(recipe.volume * 100)}%</span>
                </label>
                <label>
                  Duration
                  <select
                    aria-label="Current duration"
                    value={recipe.minutes}
                    onChange={(e) => {
                      const minutes = Number(e.target.value);
                      edit({ ...recipe, minutes });
                      setInput((v) => ({ ...v, minutes }));
                      if (!player.preview)
                        engine.current?.durationTo(minutes * 60);
                    }}
                  >
                    {[1, 5, 10, 20, 30, 60].map((m) => (
                      <option value={m} key={m}>
                        {m} min
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="current-time">
                <span>
                  {hasAudio || player.phase === "ended"
                    ? `${clock(player.elapsed)} / ${clock(player.total)}`
                    : `${recipe.minutes} minute mix`}
                </span>
                <meter
                  aria-label="Current audio output level"
                  min="0"
                  max="1"
                  value={player.level}
                />
              </div>
              <h3>Make it yours</h3>
              <div className="current-layers">
                {recipe.layers.map((layer) => (
                  <div className="current-layer" key={layer.kind}>
                    <label>
                      {currentLabels[layer.kind]} level
                      <input
                        aria-label={`${currentLabels[layer.kind]} layer level`}
                        type="range"
                        min="0"
                        max="1"
                        step=".05"
                        value={layer.level}
                        onChange={(e) =>
                          edit({
                            ...recipe,
                            layers: recipe.layers.map((l) =>
                              l.kind === layer.kind
                                ? { ...l, level: Number(e.target.value) }
                                : l,
                            ),
                          })
                        }
                      />
                    </label>
                    <button
                      aria-pressed={layer.muted}
                      onClick={() =>
                        edit({
                          ...recipe,
                          layers: recipe.layers.map((l) =>
                            l.kind === layer.kind
                              ? { ...l, muted: !l.muted }
                              : l,
                          ),
                        })
                      }
                    >
                      {layer.muted ? "Unmute" : "Mute"}{" "}
                      {currentLabels[layer.kind]}
                    </button>
                  </div>
                ))}
              </div>
              <button
                className="text-link"
                disabled={blocked}
                onClick={() => create(variation + 1)}
              >
                <RefreshCw size={15} /> Create another variation
              </button>
              <details className="current-recipe">
                <summary>What’s in this mix?</summary>
                <p>
                  River, rain and breeze are locally synthesized filtered-noise
                  textures. Warm tones are soft synthesized notes. This is
                  procedural sound, not field recordings, AI-composed music or
                  neurological stimulation.
                </p>
                <p>
                  Recipe {recipe.id} · engine v{recipe.version}. The saved seed
                  and settings reproduce this mix in the same audio engine;
                  hardware/sample-rate differences may change the exact
                  waveform.
                </p>
                <p>
                  Playback fades in gently and fades out over the final two
                  seconds. Stop is immediate. Start quietly; device volume is
                  not a calibrated listening-safety measurement.
                </p>
              </details>
              <div className="current-save">
                <label>
                  <input
                    type="checkbox"
                    checked={saveConsent}
                    onChange={(e) => setSaveConsent(e.target.checked)}
                  />{" "}
                  Keep this mix on this browser (optional)
                </label>
                <button
                  disabled={
                    !saveConsent ||
                    dirty ||
                    storageUnreadable ||
                    !recipe.name.trim()
                  }
                  onClick={save}
                >
                  <Bookmark size={16} /> Save mix
                </button>
                <p className="small">
                  Stores this named recipe and sound settings in unencrypted
                  browser storage, separately from conversation history.
                  Optional words are not retained. Nothing plays on reload.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      <section className="current-saved">
        <h2>Saved currents</h2>
        {!saved.length && (
          <p>
            No mixes saved. Your unsaved mix stays here until you leave this
            view.
          </p>
        )}
        <div className="current-saved-grid">
          {saved.map((mix) => (
            <article key={mix.id}>
              <h3>{mix.name}</h3>
              <p>
                {mix.layers.map((l) => currentLabels[l.kind]).join(" · ")} ·{" "}
                {mix.minutes} min
              </p>
              <div className="actions">
                <button onClick={() => load(mix)}>Load {mix.name}</button>
                <button
                  aria-label={`Remove ${mix.name}`}
                  onClick={() =>
                    writeSaved(saved.filter((m) => m.id !== mix.id))
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
        <p role="status">{saveMessage}</p>
        {storageUnreadable && (
          <div>
            {!resetConfirm ? (
              <button onClick={() => setResetConfirm(true)}>
                Reset unreadable Current saved mixes
              </button>
            ) : (
              <>
                <p>
                  Delete only Current’s unreadable saved list from this browser?
                </p>
                <button
                  onClick={() => {
                    try {
                      localStorage.removeItem(currentStorageKey);
                      setSaved([]);
                      setStorageUnreadable(false);
                      setResetConfirm(false);
                      setSaveMessage(
                        "Current saved list reset. Other browser data was not changed.",
                      );
                    } catch {
                      setSaveMessage(
                        "Browser storage is unavailable. Continue without saving.",
                      );
                    }
                  }}
                >
                  Confirm reset Current mixes
                </button>
                <button onClick={() => setResetConfirm(false)}>
                  Cancel reset
                </button>
              </>
            )}
          </div>
        )}
      </section>
      <p className="current-footnote">
        Personalized listening, at your pace. Stop or change anything that feels
        distracting or unpleasant. Current pauses when hidden or interrupted;
        mobile background playback is not guaranteed.
      </p>
    </section>
  );
}

function CurrentLandscape() {
  return (
    <svg
      viewBox="0 0 900 500"
      role="img"
      aria-label="Daylight river landscape"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="current-sky" x2="0" y2="1">
          <stop stopColor="#fcf7e9" />
          <stop offset="1" stopColor="#dce6d3" />
        </linearGradient>
        <linearGradient id="current-water" x1="0" y1="0" x2=".6" y2="1">
          <stop stopColor="#e7ecda" />
          <stop offset=".5" stopColor="#a7c7ba" />
          <stop offset="1" stopColor="#dce7d8" />
        </linearGradient>
      </defs>
      <rect width="900" height="500" fill="url(#current-sky)" />
      <circle cx="700" cy="115" r="65" fill="#efd898" opacity=".7" />
      <path d="M0 218Q155 122 335 195T660 180T900 220V500H0Z" fill="#cbd8bf" />
      <path d="M0 276Q175 192 355 252T700 216T900 250V500H0Z" fill="#b0c8ad" />
      <path d="M0 326Q160 237 363 280T690 260T900 305V500H0Z" fill="#92b7a0" />
      <path
        d="M485 225Q660 280 462 330T415 500H745Q232 393 575 330T520 225Z"
        fill="url(#current-water)"
      />
      <path d="M0 408Q158 323 340 379T385 500H0Z" fill="#719c88" />
      <path d="M900 341Q700 320 665 395T850 500H900Z" fill="#789f84" />
      <g
        className="current-river-lines"
        fill="none"
        stroke="#f9f6de"
        strokeWidth="2"
        opacity=".65"
      >
        <path d="M489 250q65 20 16 37m-46 32q-105 18-42 44m100 22q110 25 70 41m-110 14q-40 17 30 33" />
        <path d="M521 249q45 20 5 33m-20 27q-104 14-65 36m85 55q76 15 20 30" />
      </g>
      <g fill="none" stroke="#426e5d" strokeWidth="4" opacity=".65">
        <path d="M60 500q12-77-13-115m15 55q31-16 38-48m-25 108q18-70 40-88M840 500q-8-66 7-99m-12 61q-25-32-45-25" />
      </g>
    </svg>
  );
}
