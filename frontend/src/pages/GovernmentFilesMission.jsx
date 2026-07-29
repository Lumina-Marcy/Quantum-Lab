import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QuantumCore from '../components/QuantumCore';
import { jitter } from '../utils/deterministicRandom';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Every phase below kicks off its own animation from a button click (a plain event handler, not a
// mount effect), so the only safety net needed is "stop touching state if this phase unmounted
// mid-sequence" — this ref is that guard, checked after every await.
function useMountedRef() {
  const ref = useRef(true);
  useEffect(() => {
    // React 18 StrictMode dev mode mounts, fires this cleanup, then re-runs the effect to catch
    // impure effects — without resetting ref.current back to true here, that simulated cycle would
    // leave it permanently false even though the component is still genuinely mounted, silently
    // breaking every `if (!mountedRef.current) return` check later in a real user session.
    ref.current = true;
    return () => {
      ref.current = false;
    };
  }, []);
  return ref;
}

const INTRO_LINES = [
  { id: 1, delay: 400, text: '> WASHINGTON D.C. — SECURE CHANNEL REQUEST', cls: 'text-orange-400' },
  { id: 2, delay: 1500, text: '> A classified intelligence report is queued for transmission...', cls: 'text-green-400' },
  { id: 3, delay: 2700, text: '> The report is encrypted, but the key has to be shared first', cls: 'text-yellow-300' },
  { id: 4, delay: 3900, text: '> A classical key can be copied in transit without anyone noticing...', cls: 'text-orange-400' },
  { id: 5, delay: 5100, text: '> Quantum key distribution makes silent interception impossible', cls: 'text-green-400' },
  { id: 6, delay: 6300, text: '█████████ SECURE CHANNEL READY — AWAITING TRANSMISSION █████████', cls: 'text-emerald-400 font-bold tracking-wider' },
];

const PRIMARY_BTN = 'rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-cyan-400';
const GHOST_BTN = 'rounded-full border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:border-slate-400';

function AgencyBar({ showSpy }) {
  return (
    <div className="flex w-full max-w-md items-center gap-3">
      <span className="shrink-0 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-300">
        Agency A
      </span>
      <div className="relative h-px flex-1 bg-slate-700">
        {showSpy && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xl" aria-hidden="true">
            👤
          </span>
        )}
      </div>
      <span className="shrink-0 rounded-xl border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-300">
        Agency B
      </span>
    </div>
  );
}

// A row of photon emoji drifting left-to-right along the AgencyBar's line — purely decorative
// motion, driven by the caller's `sent` flag. `render(i, symbol)` lets each phase override an
// individual photon's displayed symbol (e.g. the one that gets tampered with mid-transit).
function PhotonRow({ symbols, sent, staggerS, durationS, render }) {
  // Every photon shares the same start/end x position, so without a distinct vertical lane per
  // photon they'd all converge on the exact same point at the end — visually collapsing into a
  // single dot (only the last one in DOM order stays visible on top of the rest).
  const n = symbols.length;
  return (
    <div className="relative h-20 w-full max-w-md">
      {sent &&
        symbols.map((symbol, i) => {
          const topPct = n > 1 ? 15 + (i * 70) / (n - 1) : 50;
          return (
            <motion.span
              key={i}
              className="absolute -translate-y-1/2 text-2xl"
              style={{ top: `${topPct}%` }}
              initial={{ left: '2%', opacity: 0 }}
              animate={{ left: '92%', opacity: [0, 1, 1, 1] }}
              transition={{ delay: i * staggerS, duration: durationS, ease: 'linear' }}
            >
              {render ? render(i, symbol) : symbol}
            </motion.span>
          );
        })}
    </div>
  );
}

// A slow, looping drift path through a handful of waypoints — same jitter-seeded idiom Molecule
// Mission's FloatingAtom uses, so every photon gets its own reproducible-but-scattered path instead
// of a straight line, and the whole field never looks like one synchronized group.
function driftWaypoints(seed) {
  const xs = [];
  const ys = [];
  for (let i = 0; i < 4; i++) {
    xs.push(12 + jitter(seed * 3.1 + i * 1.7) * 76);
    ys.push(14 + jitter(seed * 4.3 + i * 2.3) * 66);
  }
  xs.push(xs[0]);
  ys.push(ys[0]);
  return { xs, ys, duration: 3.5 + jitter(seed * 9.1) * 2 };
}

// A single photon drifting continuously inside a PhotonField — never pauses, so "catching" a color
// change or clicking the tampered one is a genuine track-it-while-it-moves challenge, closer to a
// shell game than a static before/after comparison. `showDot` overlays a small integrity indicator
// (the "Quantum Vision" idea: green = untouched, red = the one that was actually intercepted).
function DriftingPhoton({ seed, symbol, onClick, clickable, showDot, isTarget }) {
  const { xs, ys, duration } = useMemo(() => driftWaypoints(seed), [seed]);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 ${
        clickable ? 'cursor-pointer' : 'cursor-default'
      }`}
      initial={{ left: `${xs[0]}%`, top: `${ys[0]}%` }}
      animate={{ left: xs.map((x) => `${x}%`), top: ys.map((y) => `${y}%`) }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      <span className="text-3xl">{symbol}</span>
      {showDot && <span className={`h-2 w-2 rounded-full ${isTarget ? 'bg-rose-500' : 'bg-emerald-500'}`} />}
    </motion.button>
  );
}

function PhotonField({ children }) {
  return (
    <div className="relative h-56 w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/70">
      {children}
    </div>
  );
}

function IntroPhase({ onNext }) {
  const [visibleLines, setVisibleLines] = useState([]);

  useEffect(() => {
    const timers = INTRO_LINES.map((line) =>
      setTimeout(() => setVisibleLines((prev) => [...prev, line]), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const introDone = visibleLines.length === INTRO_LINES.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-2xl flex-col items-center justify-center gap-6 px-6 py-10"
    >
      <div className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-orange-400/80">Mission 5 — Government Files</p>
        <h1 className="mt-2 text-3xl font-bold text-white">A Secret Has to Travel First</h1>
      </div>

      <div className="w-full rounded-2xl border border-slate-700 bg-black/80 p-6 shadow-2xl shadow-black/60">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="ml-2 font-mono text-xs text-slate-500">secure_channel.exe</span>
        </div>
        <div className="min-h-40 space-y-1 font-mono">
          {visibleLines.map((line) => (
            <motion.p
              key={line.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className={`text-sm leading-7 ${line.cls}`}
            >
              {line.text}
            </motion.p>
          ))}
          {!introDone && visibleLines.length > 0 && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.7 }}
              className="inline-block h-4 w-2 bg-green-400"
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {introDone && (
          <motion.button
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            onClick={onNext}
            className={PRIMARY_BTN}
          >
            Begin Transmission
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const TUTORIAL_PHOTONS = ['🔵', '🟢', '🟣', '🟡', '🔴'];

function TutorialPhase({ onNext }) {
  const [sent, setSent] = useState(false);
  const [arrived, setArrived] = useState(false);
  const mountedRef = useMountedRef();

  async function handleStart() {
    setSent(true);
    await sleep(TUTORIAL_PHOTONS.length * 220 + 700);
    if (!mountedRef.current) return;
    setArrived(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col items-center justify-center gap-5 px-6 py-16 text-center"
    >
      <p className="text-xs uppercase tracking-widest text-cyan-300/80">Phase 1 — Key Generation</p>
      <h2 className="text-2xl font-bold text-white">Generate a Quantum Key</h2>
      <p className="max-w-md text-sm text-slate-400">
        Each colored photon carries one bit of the shared key. Watch them travel from Agency A to
        Agency B — this is the key both sides will use to encrypt the actual report.
      </p>

      <AgencyBar />
      <PhotonRow symbols={TUTORIAL_PHOTONS} sent={sent} staggerS={0.22} durationS={0.9} />

      {!sent ? (
        <button onClick={handleStart} className={PRIMARY_BTN}>
          Generate Quantum Key — Start
        </button>
      ) : !arrived ? (
        <p className="text-xs text-slate-500">Transmitting…</p>
      ) : (
        <>
          <p className="text-lg font-semibold text-emerald-400">✓ Key Established</p>
          <button onClick={onNext} className={PRIMARY_BTN}>
            Continue
          </button>
        </>
      )}
    </motion.div>
  );
}

const SPY_PHOTONS = ['🔵', '🟢', '🟣', '🟡', '🔴'];
const SPY_TARGET = 3; // the 🟡 quietly becomes 🟠 partway through — a color already used elsewhere
// in the field, so catching it takes real attention, not just "spot the odd one out."
const SPY_TAMPER_MS = 2200;

function SpyPhase({ onNext }) {
  const [running, setRunning] = useState(false);
  const [tampered, setTampered] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [resolved, setResolved] = useState(false);
  const mountedRef = useMountedRef();

  async function handleStart() {
    setRunning(true);
    await sleep(SPY_TAMPER_MS);
    if (!mountedRef.current) return;
    setTampered(true);
  }

  function handleDecision(choice) {
    if (choice === 'discard') {
      setResolved(true);
      setFeedback(null);
      return;
    }
    setFeedback(
      choice === 'continue'
        ? "Continuing hands over the report using a key someone else has already touched. Don't risk it."
        : 'A new key only helps once the compromised one is gone — discard it first.'
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col items-center justify-center gap-5 px-6 py-16 text-center"
    >
      <p className="text-xs uppercase tracking-widest text-violet-300">Round 2 — Interception</p>
      <h2 className="text-2xl font-bold text-white">Watch the Transmission Closely</h2>
      <p className="max-w-md text-sm text-slate-400">
        A spy may be intercepting the key mid-flight. Keep an eye on every photon — if one changes
        color while it's moving, the key has been touched.
      </p>

      <AgencyBar showSpy />

      <PhotonField>
        {running &&
          SPY_PHOTONS.map((symbol, i) => (
            <DriftingPhoton key={i} seed={i + 1} symbol={i === SPY_TARGET && tampered ? '🟠' : symbol} />
          ))}
      </PhotonField>

      {!running ? (
        <button onClick={handleStart} className={PRIMARY_BTN}>
          Send Quantum Bits
        </button>
      ) : !resolved ? (
        <div className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 p-5 text-left">
          <p className="text-sm font-semibold text-slate-200">Did the transmission look the same the whole time?</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => handleDecision('continue')} className={GHOST_BTN}>
              Looked Fine — Continue
            </button>
            <button onClick={() => handleDecision('regenerate')} className={GHOST_BTN}>
              Generate New Key
            </button>
            <button onClick={() => handleDecision('discard')} className={GHOST_BTN}>
              Something Changed — Discard
            </button>
          </div>
          {feedback && <p className="mt-3 text-xs text-amber-300">{feedback}</p>}
        </div>
      ) : (
        <>
          <p className="text-lg font-semibold text-emerald-400">✓ Compromised key discarded</p>
          <button onClick={onNext} className={PRIMARY_BTN}>
            Continue
          </button>
        </>
      )}
    </motion.div>
  );
}

const ROUND3_PHOTONS = ['🔵', '🟢', '🟣', '🟡', '🔴', '🟠', '⚪'];
const ROUND3_TARGET = 4; // the 🔴 — no visible color change this round, only the scan gives it away

function Round3Phase({ onNext }) {
  const [running, setRunning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [identified, setIdentified] = useState(false);
  const [missClick, setMissClick] = useState(false);
  const [secured, setSecured] = useState(false);

  function handlePick(i) {
    if (identified) return;
    if (i === ROUND3_TARGET) {
      setIdentified(true);
      setMissClick(false);
    } else {
      setMissClick(true);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col items-center justify-center gap-5 px-6 py-16 text-center"
    >
      <p className="text-xs uppercase tracking-widest text-violet-300">Round 3 — Find the Interception</p>
      <h2 className="text-2xl font-bold text-white">A Larger Batch, One Tampered Bit</h2>
      <p className="max-w-md text-sm text-slate-400">
        This time nothing visibly changes color — scan the transmission, then click the tampered
        photon while it's still moving.
      </p>

      <AgencyBar showSpy />

      <PhotonField>
        {running &&
          ROUND3_PHOTONS.map((symbol, i) => (
            <DriftingPhoton
              key={i}
              seed={i + 21}
              symbol={symbol}
              onClick={() => handlePick(i)}
              clickable={scanned && !identified}
              showDot={scanned}
              isTarget={i === ROUND3_TARGET}
            />
          ))}
      </PhotonField>

      {!running ? (
        <button onClick={() => setRunning(true)} className={PRIMARY_BTN}>
          Send Quantum Bits
        </button>
      ) : !scanned ? (
        <button onClick={() => setScanned(true)} className={PRIMARY_BTN}>
          🔍 Scan Transmission
        </button>
      ) : !identified ? (
        <>
          <p className="text-xs text-slate-400">One photon's integrity reading is off — click it to isolate it.</p>
          {missClick && <p className="text-xs text-amber-300">That one checks out — look again.</p>}
        </>
      ) : !secured ? (
        <div className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-left">
          <p className="text-sm font-semibold text-emerald-300">✓ Interception isolated</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => setSecured(true)} className={GHOST_BTN}>
              Discard Key
            </button>
            <button onClick={() => setSecured(true)} className={GHOST_BTN}>
              Generate New One
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-lg font-semibold text-emerald-400">✓ Transmission secured</p>
          <button onClick={onNext} className={PRIMARY_BTN}>
            Continue
          </button>
        </>
      )}
    </motion.div>
  );
}

const SMALL_GHOST_BTN = 'rounded-full border border-slate-600 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-400';

// Five independent 3-photon messages instead of two — closer (at this game's scale) to the reality
// that a real agency isn't triaging one or two keys, it's triaging a flood of them. A message only
// counts as secured if every photon in its cluster gets the right Keep/Discard call, not just most.
const MEMORY_MESSAGE_TOPICS = [
  'Personnel Roster',
  'Satellite Coordinates',
  'Diplomatic Cable',
  'Troop Movement Log',
  'Budget Authorization',
];
const MEMORY_MESSAGES = MEMORY_MESSAGE_TOPICS.map((topic, idx) => ({
  id: idx + 1,
  label: `Message ${idx + 1} — ${topic}`,
  ballIndices: [idx * 3, idx * 3 + 1, idx * 3 + 2],
}));
const MEMORY_COUNT = MEMORY_MESSAGES.reduce((sum, m) => sum + m.ballIndices.length, 0);
const MEMORY_COLOR_PALETTE = ['🔵', '🟢', '🟣', '🟡', '🔴', '🟠', '⚫', '⚪', '🟤'];
const MEMORY_ORIGINAL_COLORS = Array.from({ length: MEMORY_COUNT }, (_, i) => MEMORY_COLOR_PALETTE[i % MEMORY_COLOR_PALETTE.length]);
const MEMORY_PREVIEW_S = 4;
const MEMORY_TRAVEL_MS = 2700;
const MEMORY_CHANGE_COUNT = 5;

// Clusters each message's photons close together (a tight band per message) with a visible gap
// between messages, instead of spreading them evenly across the whole field regardless of message.
function messageBand(messageIndex) {
  const bandHeight = 100 / MEMORY_MESSAGES.length;
  return { bandStart: messageIndex * bandHeight, bandHeight };
}

function memoryLaneTop(i) {
  const perMessage = 3;
  const messageIndex = Math.floor(i / perMessage);
  const withinMessage = i % perMessage;
  const { bandStart, bandHeight } = messageBand(messageIndex);
  const contentStart = bandStart + bandHeight * 0.22;
  const usableHeight = bandHeight * 0.62;
  return contentStart + (withinMessage * usableHeight) / (perMessage - 1);
}

// A swapped photon always becomes one of the OTHER palette colors, never a genuinely new one — so
// at the end you're still looking at ordinary-looking colored photons, and only actual memory of
// which position started as which color reveals which ones moved.
function pickSwappedColor(originalColor) {
  const others = MEMORY_COLOR_PALETTE.filter((c) => c !== originalColor);
  return others[Math.floor(Math.random() * others.length)];
}

// Two distinct movement styles, assigned randomly per photon (not per message) — so no two photons
// necessarily move the same way even within one cluster, which is the point: a uniform crowd is easy
// to track as a block, a mismatched one forces you to watch each photon individually.
function bouncePath(seed, startTop) {
  const bounces = 4 + Math.floor(jitter(seed * 2.2) * 3); // 4-6 sharp ricochet points
  const tops = [startTop];
  for (let i = 0; i < bounces; i++) {
    tops.push(i % 2 === 0 ? 8 + jitter(seed * 1.7 + i) * 8 : 84 + jitter(seed * 3.3 + i) * 8);
  }
  const lefts = tops.map((_, i) => `${4 + (i * 88) / (tops.length - 1)}%`);
  return { tops: tops.map((t) => `${t}%`), lefts };
}

function wavePath(seed, startTop) {
  const swings = 2 + Math.floor(jitter(seed * 1.3) * 2); // 2-3 wide, smooth swings
  const amplitude = 22 + jitter(seed * 2.9) * 18;
  const tops = [startTop];
  for (let i = 1; i <= swings * 2; i++) {
    const dir = i % 2 === 0 ? 1 : -1;
    tops.push(Math.min(96, Math.max(4, startTop + dir * amplitude)));
  }
  const lefts = tops.map((_, i) => `${4 + (i * 88) / (tops.length - 1)}%`);
  return { tops: tops.map((t) => `${t}%`), lefts };
}

function MemoryPhase({ onNext }) {
  // 'preview' | 'traveling' | 'deciding'
  const [stage, setStage] = useState('preview');
  const [countdown, setCountdown] = useState(MEMORY_PREVIEW_S);
  const [revealed, setRevealed] = useState(() => new Set());
  const [decisions, setDecisions] = useState({});
  const mountedRef = useMountedRef();

  // Which lanes actually get swapped, what they swap to, and each lane's own random travel
  // path/timing — all decided once per round via lazy useState initializers, not re-rolled on
  // re-render.
  const [changedLanes] = useState(() => {
    const set = new Set();
    while (set.size < MEMORY_CHANGE_COUNT) set.add(Math.floor(Math.random() * MEMORY_COUNT));
    return set;
  });
  const [finalColors] = useState(() =>
    MEMORY_ORIGINAL_COLORS.map((color, i) => (changedLanes.has(i) ? pickSwappedColor(color) : color))
  );
  const [laneParams] = useState(() =>
    Array.from({ length: MEMORY_COUNT }, (_, i) => {
      const pathFn = Math.random() < 0.5 ? bouncePath : wavePath;
      return {
        duration: 1.0 + Math.random() * 1.4, // 1.0s-2.4s — genuinely different speeds, not just different bounce heights
        path: pathFn(i + 1, memoryLaneTop(i)),
      };
    })
  );

  useEffect(() => {
    if (stage !== 'preview') return;
    if (countdown <= 0) {
      setStage('traveling');
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [stage, countdown]);

  useEffect(() => {
    if (stage !== 'traveling') return;
    const timers = [];
    changedLanes.forEach((i) => {
      const delay = MEMORY_TRAVEL_MS * (0.35 + Math.random() * 0.4);
      timers.push(
        setTimeout(() => {
          if (!mountedRef.current) return;
          setRevealed((prev) => new Set(prev).add(i));
        }, delay)
      );
    });
    timers.push(
      setTimeout(() => {
        if (!mountedRef.current) return;
        setStage('deciding');
      }, MEMORY_TRAVEL_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [stage]);

  function handleDecision(i, action) {
    setDecisions((prev) => ({ ...prev, [i]: action }));
  }

  const allDecided = Object.keys(decisions).length === MEMORY_COUNT;

  // A message only counts as secured if every one of its photons got the right call — one missed
  // swap anywhere in the cluster compromises the whole message, not just that one bit.
  let messageResults = null;
  let securedCount = 0;
  if (allDecided) {
    messageResults = MEMORY_MESSAGES.map((msg) => {
      const secured = msg.ballIndices.every((i) => (decisions[i] === 'discard') === changedLanes.has(i));
      if (secured) securedCount += 1;
      return { ...msg, secured };
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col items-center justify-center gap-5 px-6 py-16 text-center"
    >
      <p className="text-xs uppercase tracking-widest text-violet-300">Round 4 — Memory Check</p>
      <h2 className="text-2xl font-bold text-white">
        {stage === 'preview' ? 'Memorize the Colors' : stage === 'traveling' ? 'Watch Them Travel' : 'Keep or Discard Each One'}
      </h2>
      <p className="max-w-md text-sm text-slate-400">
        {stage === 'preview'
          ? `${MEMORY_MESSAGES.length} messages, three photons each, queued at Agency A. In reality you'd be triaging thousands at once — here, just try to keep track of all of them. A message is only secure if every one of its photons still checks out.`
          : stage === 'traveling'
          ? "They're moving toward Agency B now, each at its own speed and path. Keep watching — a swap might happen in transit."
          : "Compare what arrived against what you remember. Keep the ones that still match, discard the ones that don't — get every photon in a message right to secure it."}
      </p>

      <AgencyBar showSpy={stage !== 'preview'} />

      <div className="relative h-72 w-full max-w-md">
        {MEMORY_MESSAGES.map((msg, mi) => (
          <span
            key={msg.id}
            className="absolute left-1 text-[10px] uppercase tracking-wide text-slate-500"
            style={{ top: `${messageBand(mi).bandStart + 1}%` }}
          >
            {msg.label}
          </span>
        ))}
        {Array.from({ length: MEMORY_COUNT }, (_, i) => {
          const top = memoryLaneTop(i);
          const symbol = stage === 'preview' ? MEMORY_ORIGINAL_COLORS[i] : revealed.has(i) || stage === 'deciding' ? finalColors[i] : MEMORY_ORIGINAL_COLORS[i];
          return (
            <motion.span
              key={i}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-2xl"
              initial={{ left: '4%', top: `${top}%` }}
              animate={
                stage === 'preview'
                  ? { left: '4%', top: `${top}%` }
                  : { left: laneParams[i].path.lefts, top: laneParams[i].path.tops }
              }
              transition={stage === 'preview' ? { duration: 0.3 } : { duration: laneParams[i].duration, ease: 'easeInOut' }}
            >
              {symbol}
            </motion.span>
          );
        })}
      </div>

      {stage === 'preview' ? (
        <p className="text-lg font-semibold text-cyan-300">Releasing in {countdown}…</p>
      ) : stage === 'traveling' ? (
        <p className="text-xs text-slate-500">Transmitting…</p>
      ) : (
        <>
          {/* Grouped by message, photons listed top-to-bottom in the same order they traveled in —
              a grid that wrapped into columns would reshuffle lane 4 next to lane 1 instead of
              below it, breaking the spatial memory the player just built up watching them travel. */}
          <div className="flex w-full flex-col gap-3">
            {MEMORY_MESSAGES.map((msg) => {
              const result = messageResults?.find((m) => m.id === msg.id);
              return (
                <div
                  key={msg.id}
                  className={`rounded-2xl border p-3 text-left ${
                    !result
                      ? 'border-slate-700 bg-slate-900/40'
                      : result.secured
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-rose-500/40 bg-rose-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">{msg.label}</p>
                    {result && (
                      <span className={`text-xs font-semibold ${result.secured ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {result.secured ? '✓ Secured' : '✗ Compromised'}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-col gap-2">
                    {msg.ballIndices.map((i) => {
                      const decision = decisions[i];
                      return (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2"
                        >
                          <span className="text-xl">{finalColors[i]}</span>
                          {decision ? (
                            <span className={`text-xs font-semibold ${decision === 'discard' ? 'text-rose-300' : 'text-emerald-300'}`}>
                              {decision === 'discard' ? 'Discarded' : 'Kept'}
                            </span>
                          ) : (
                            <div className="flex gap-2">
                              <button onClick={() => handleDecision(i, 'keep')} className={SMALL_GHOST_BTN}>
                                Keep
                              </button>
                              <button onClick={() => handleDecision(i, 'discard')} className={SMALL_GHOST_BTN}>
                                Discard
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {messageResults !== null && (
            <>
              <p className="text-lg font-semibold text-emerald-400">
                You secured {securedCount} of {MEMORY_MESSAGES.length} messages
              </p>
              <button onClick={onNext} className={PRIMARY_BTN}>
                Continue
              </button>
            </>
          )}
        </>
      )}
    </motion.div>
  );
}

const FINAL_GRID_SIZE = 100;
const FINAL_DISTURBED_INDEX = 47;

function FinalRoundPhase({ onNext }) {
  const [revealed, setRevealed] = useState(0);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      for (let i = 5; i <= FINAL_GRID_SIZE; i += 5) {
        if (cancelled) return;
        await sleep(35);
        if (cancelled) return;
        setRevealed(i);
      }
      if (cancelled) return;
      await sleep(500);
      if (cancelled) return;
      setChecked(true);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col items-center justify-center gap-5 px-6 py-16 text-center"
    >
      <p className="text-xs uppercase tracking-widest text-violet-300">Final Round — Full-Scale Transmission</p>
      <h2 className="text-2xl font-bold text-white">100 Photons, One Attack</h2>

      <div className="grid grid-cols-10 gap-1 rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
        {Array.from({ length: FINAL_GRID_SIZE }, (_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-sm ${
              i >= revealed ? 'bg-slate-800' : i === FINAL_DISTURBED_INDEX ? 'bg-rose-500' : 'bg-cyan-400'
            }`}
          />
        ))}
      </div>

      {!checked ? (
        <p className="text-xs text-slate-500">
          Scanning {Math.min(revealed, FINAL_GRID_SIZE)}/{FINAL_GRID_SIZE}…
        </p>
      ) : (
        <>
          <div>
            <p className="text-3xl font-bold text-rose-400">Integrity Check: 97%</p>
            <p className="mt-1 text-sm font-semibold text-amber-300">⚠ Transmission Compromised</p>
          </div>
          <button onClick={onNext} className={PRIMARY_BTN}>
            Regenerate Key &amp; Resend
          </button>
        </>
      )}
    </motion.div>
  );
}

function OutcomePhase({ onReplay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-2xl px-6 py-16 text-center"
    >
      <div className="flex items-center justify-center gap-2">
        <QuantumCore stage="stabilizing" className="h-9 w-9" particleCount={6} detail="minimal" />
        <p className="text-xs uppercase tracking-widest text-emerald-400">Classified Files</p>
      </div>
      <h1 className="mt-3 text-3xl font-bold text-white">Delivered Securely</h1>
      <p className="mt-2 text-sm font-semibold text-emerald-300">✓ No Information Leaked</p>

      <div className="mt-8 grid gap-4 text-left sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Classical Communication</p>
          <ol className="mt-3 space-y-2 text-sm text-slate-300">
            <li>1. A spy copies the message</li>
            <li>2. Nobody notices</li>
          </ol>
        </div>
        <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300">Quantum Communication</p>
          <ol className="mt-3 space-y-2 text-sm text-slate-300">
            <li>1. A spy measures a photon</li>
            <li>2. The photon changes</li>
            <li>3. The receiver notices</li>
            <li>4. The key gets discarded</li>
          </ol>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-left">
        <p className="text-sm font-semibold text-cyan-300">The lesson</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Measuring a quantum bit disturbs it — there's no way to secretly read a photon's state
          without changing it. That's not an engineering limitation to be patched later; it's a law
          of quantum mechanics. So instead of trying to make interception impossible, quantum key
          distribution just makes it impossible to hide: Agency A and B compare notes after sending
          the key, and any mismatch means someone touched it, so it gets thrown away before it's ever
          used to encrypt anything real. A classical wire offers no equivalent guarantee — it can
          always be tapped without leaving a trace.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button onClick={onReplay} className="rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700">
          Run It Back
        </button>
        <Link
          to="/missions"
          className="rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Finish Mission
        </Link>
      </div>
    </motion.div>
  );
}

function GovernmentFilesMission() {
  // 'intro' | 'tutorial' | 'spy' | 'round3' | 'memory' | 'final' | 'outcome'
  const [phase, setPhase] = useState('intro');

  function handleReplay() {
    setPhase('tutorial');
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="flex items-center justify-center gap-2 border-b border-slate-800/60 py-3">
        <QuantumCore stage="alive" className="h-5 w-5" particleCount={5} detail="minimal" />
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Secure Communications Channel</span>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'intro' ? (
          <IntroPhase key="intro" onNext={() => setPhase('tutorial')} />
        ) : phase === 'tutorial' ? (
          <TutorialPhase key="tutorial" onNext={() => setPhase('spy')} />
        ) : phase === 'spy' ? (
          <SpyPhase key="spy" onNext={() => setPhase('round3')} />
        ) : phase === 'round3' ? (
          <Round3Phase key="round3" onNext={() => setPhase('memory')} />
        ) : phase === 'memory' ? (
          <MemoryPhase key="memory" onNext={() => setPhase('final')} />
        ) : phase === 'final' ? (
          <FinalRoundPhase key="final" onNext={() => setPhase('outcome')} />
        ) : (
          <OutcomePhase key="outcome" onReplay={handleReplay} />
        )}
      </AnimatePresence>
    </main>
  );
}

export default GovernmentFilesMission;
