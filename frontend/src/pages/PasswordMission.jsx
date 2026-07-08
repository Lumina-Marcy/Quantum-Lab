import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { evaluatePassword } from '../utils/passwordStrength';

const buildBreachLines = (username, email, assessment) => [
  {
    id: 1, delay: 500, text: '> Initializing Grover\'s Algorithm...', cls: 'text-green-400',
    explain: 'A quantum search trick that tests every possible password at once, instead of guessing one at a time.',
  },
  {
    id: 2, delay: 1700, text: `> Generating quantum superposition across 2^${assessment.entropyBits} password states...`, cls: 'text-green-400',
    explain: 'The quantum computer holds every possible password matching your password\'s length and character types in play simultaneously.',
  },
  {
    id: 3, delay: 3100, text: `> Target acquired: ${username} — ${email}`, cls: 'text-yellow-300',
    explain: 'The attacker now knows exactly which account they are trying to break into.',
  },
  {
    id: 4, delay: 4400, text: '> Running quantum interference amplification...', cls: 'text-green-400',
    explain: 'The algorithm boosts the odds of the real password while cancelling out the wrong guesses.',
  },
  {
    id: 5, delay: 5700, text: '> Wavefunction collapsed — password hash isolated...', cls: 'text-green-400',
    explain: 'The search has narrowed down to one answer: the scrambled (hashed) version of your password.',
  },
  {
    id: 6, delay: 6800, text: `> Entropy check: ${assessment.entropyBits} bits — INSUFFICIENT FOR QUANTUM RESISTANCE`, cls: 'text-orange-400',
    explain: `Your password fell to this attack because ${assessment.reasons.join('; ')}.`,
  },
  {
    id: 7, delay: 7800, text: '█████████ BREACH SUCCESSFUL — CREDENTIALS EXPOSED █████████', cls: 'text-red-400 font-bold tracking-wider',
    explain: 'The hash has been cracked — the attacker now has your real, plaintext password.',
  },
];

const buildResistLines = (username, email, assessment) => [
  {
    id: 1, delay: 500, text: '> Initializing Grover\'s Algorithm...', cls: 'text-green-400',
    explain: 'A quantum search trick that tests every possible password at once, instead of guessing one at a time.',
  },
  {
    id: 2, delay: 1700, text: `> Generating quantum superposition across 2^${assessment.entropyBits} password states...`, cls: 'text-green-400',
    explain: 'The quantum computer holds every possible password matching your password\'s length and character types in play simultaneously.',
  },
  {
    id: 3, delay: 3100, text: `> Target acquired: ${username} — ${email}`, cls: 'text-yellow-300',
    explain: 'The attacker now knows exactly which account they are trying to break into.',
  },
  {
    id: 4, delay: 4400, text: '> Running quantum interference amplification...', cls: 'text-green-400',
    explain: 'The algorithm boosts the odds of the real password while cancelling out the wrong guesses.',
  },
  {
    id: 5, delay: 5700, text: `> Applying quadratic speedup — effective search reduced to 2^${assessment.effectiveBits} operations`, cls: 'text-yellow-300',
    explain: "Grover's algorithm roughly squares the search space it can get through — the same as cutting your password's strength in half. Even halved, this one is still huge.",
  },
  {
    id: 6, delay: 6800, text: `> Entropy check: ${assessment.entropyBits} bits — SUFFICIENT FOR QUANTUM RESISTANCE`, cls: 'text-emerald-400',
    explain: "Your password is long, unpredictable, and mixes enough character types that even the quantum speed-up can't search it in time.",
  },
  {
    id: 7, delay: 7800, text: '█████████ ACCESS DENIED — BRUTE-FORCE INFEASIBLE █████████', cls: 'text-emerald-400 font-bold tracking-wider',
    explain: 'The attack ran out of time before it ran out of guesses. Your real password was never recovered.',
  },
];

const DEFENSE_OPTIONS = [
  {
    id: 'twofa',
    icon: '🔐',
    title: 'Two-Step Authentication',
    description:
      'A one-time code is sent to your phone or authenticator app on every login. Even with your password cracked, the hacker cannot get in without physically having your device.',
  },
  {
    id: 'biometric',
    icon: '👆',
    title: 'Biometric Login',
    description:
      'Your fingerprint or face scan replaces the password entirely. Biometric data is stored only on your device and never transmitted — nothing for a quantum computer to intercept.',
  },
  {
    id: 'manager',
    icon: '🗝️',
    title: 'Password Manager',
    description:
      'Generates a unique 30+ character random password for every account. Quantum brute-force relies on predictable patterns — a truly random password has none.',
  },
];

// Each layer still has to survive its OWN attack after it blocks the quantum one —
// stacking defenses only helps if every layer you actually deploy is used correctly.
const CONSEQUENCES = {
  twofa: {
    lines: [
      { id: 1, delay: 400, text: '> Re-running Grover\'s Algorithm with recovered password hash...', cls: 'text-green-400' },
      { id: 2, delay: 1600, text: '> Password accepted — proceeding to second factor...', cls: 'text-yellow-300' },
      { id: 3, delay: 2900, text: '> One-time code requested from authenticator device...', cls: 'text-green-400' },
      { id: 4, delay: 4200, text: '> No physical device in attacker\'s possession — code unknown', cls: 'text-orange-400' },
      { id: 5, delay: 5400, text: '> Quantum speedup cannot brute-force a code that changes every 30 seconds off-network', cls: 'text-orange-400' },
      { id: 6, delay: 6600, text: '█████████ QUANTUM VECTOR BLOCKED — SWITCHING TACTICS █████████', cls: 'text-emerald-400 font-bold tracking-wider' },
    ],
  },
  biometric: {
    lines: [
      { id: 1, delay: 400, text: '> Re-running Grover\'s Algorithm to search password states...', cls: 'text-green-400' },
      { id: 2, delay: 1600, text: '> Scanning login endpoint for a password hash to target...', cls: 'text-green-400' },
      { id: 3, delay: 2900, text: '> No password hash found — authentication is not secret-based', cls: 'text-yellow-300' },
      { id: 4, delay: 4200, text: '> Biometric template stored in local secure hardware — never transmitted', cls: 'text-orange-400' },
      { id: 5, delay: 5400, text: '> Search space: undefined — there is nothing here to amplify', cls: 'text-orange-400' },
      { id: 6, delay: 6600, text: '█████████ QUANTUM VECTOR BLOCKED — SWITCHING TACTICS █████████', cls: 'text-emerald-400 font-bold tracking-wider' },
    ],
  },
  manager: {
    lines: [
      { id: 1, delay: 400, text: '> Re-running Grover\'s Algorithm on new 30-character password...', cls: 'text-green-400' },
      { id: 2, delay: 1600, text: '> Generating quantum superposition across 2¹⁹⁶ password states...', cls: 'text-green-400' },
      { id: 3, delay: 2900, text: '> Applying quadratic speedup — effective search reduced to 2⁹⁸ operations', cls: 'text-yellow-300' },
      { id: 4, delay: 4200, text: '> Estimated time to completion: ~10¹³ years on largest known quantum hardware', cls: 'text-orange-400' },
      { id: 5, delay: 5400, text: '> Entropy check: SUFFICIENT FOR QUANTUM RESISTANCE', cls: 'text-orange-400' },
      { id: 6, delay: 6600, text: '█████████ QUANTUM VECTOR BLOCKED — SWITCHING TACTICS █████████', cls: 'text-emerald-400 font-bold tracking-wider' },
    ],
  },
};

// The realistic, non-quantum weakness of each defense — what actually breaks these in practice.
const WEAKNESS_SCENARIOS = {
  twofa: {
    prompt:
      'A new email arrives in your inbox.\n\nFrom: Account Security <noreply@secure-alerts.com>\nSubject: Confirm your recent sign-in\n\n"We noticed a new sign-in to your account. To confirm this was you and keep your account secure, please reply to this email with the 6-digit verification code below.\n\nCode: 482913"',
    choices: [
      {
        id: 'reply', holds: false,
        label: 'Reply to the email with the code to confirm it was you',
        resultText:
          "That's exactly what the attacker wanted. No legitimate service ever asks you to reply with a one-time code by email — they only accept it typed directly into their real login page. The moment you sent it back, they used it to get in.",
      },
      {
        id: 'ignore', holds: true,
        label: 'Open the authenticator app directly and check your account there instead',
        resultText:
          "Good instinct. That email was fake — legitimate providers never ask you to reply with a verification code. By going straight to the app instead of trusting the email, the attacker never got the code they needed.",
      },
    ],
  },
  biometric: {
    isLiveness: true,
    prompt: "The attacker pulls a high-resolution photo of you from social media and holds it up to your camera.",
    context: "Before granting access, the system challenges whoever's in front of the camera to prove they're actually alive.",
    successText:
      "Liveness confirmed — a static photo or replayed video could never have replicated that. The attacker is denied before they ever reach a password or code.",
    failText:
      "You didn't complete the sequence right — and that's exactly the gap attackers count on. Strict liveness checks cause enough false rejections that many real systems quietly fall back to something weaker (a PIN, a retry, a plain photo match) rather than lock real users out, and that fallback is what gets exploited.",
  },
  manager: {
    isReentry: true,
    prompt: 'Your password manager is only as strong as the ONE master password that unlocks all the others.',
    context: 'The attacker now targets that single master password directly. Re-enter it from memory.',
  },
};

function PasswordReentryChallenge({ password, maxAttempts = 3, confirmLabel = 'Confirm Password', placeholder = 'Re-enter your password', onResolve }) {
  const [input, setInput] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(maxAttempts);
  const [justFailed, setJustFailed] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (input === password) {
      onResolve(true);
      return;
    }
    const left = attemptsLeft - 1;
    setAttemptsLeft(left);
    setInput('');
    setJustFailed(true);
    if (left <= 0) onResolve(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col items-center gap-3">
      <input
        type="password"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        autoFocus
        className="w-full max-w-xs rounded-xl bg-slate-950/70 border border-slate-700 px-4 py-2.5 text-center font-mono text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!input}
          className="rounded-full bg-emerald-500 px-6 py-2.5 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-40"
        >
          {confirmLabel}
        </button>
        <span className="font-mono text-xs text-slate-500">Attempts left: {attemptsLeft}</span>
      </div>
      {justFailed && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-400">
          That's not it. Are you sure that's what you typed?
        </motion.p>
      )}
    </form>
  );
}

function DefenseCard({ option, selected, onToggle }) {
  return (
    <motion.div
      initial="idle"
      whileHover="hovered"
      onClick={onToggle}
      className={`relative flex flex-col rounded-2xl border p-6 cursor-pointer select-none transition-colors ${
        selected ? 'border-cyan-500 bg-cyan-950/20' : 'border-slate-700 bg-slate-900/80 hover:border-cyan-500/60'
      }`}
    >
      <span className="text-4xl">{option.icon}</span>
      <h3 className="mt-3 text-lg font-semibold text-white">{option.title}</h3>
      <p className="mt-1 text-xs text-slate-500">{selected ? 'Selected — click to remove' : 'Click to deploy'}</p>

      <motion.div
        variants={{
          idle: { opacity: 0, height: 0, marginTop: 0 },
          hovered: { opacity: 1, height: 'auto', marginTop: 12 },
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <p className="text-sm text-slate-300 leading-relaxed">{option.description}</p>
      </motion.div>

      {selected && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.15)]" />
      )}
    </motion.div>
  );
}

const MANAGER_PASSWORD_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

function generateManagerPassword(length = 28) {
  let out = '';
  for (let i = 0; i < length; i++) {
    out += MANAGER_PASSWORD_CHARS[Math.floor(Math.random() * MANAGER_PASSWORD_CHARS.length)];
  }
  return out;
}

const LIVENESS_ACTIONS = [
  { id: 'blink', label: 'Blink', icon: '👁️' },
  { id: 'left', label: 'Turn Left', icon: '⬅️' },
  { id: 'right', label: 'Turn Right', icon: '➡️' },
  { id: 'smile', label: 'Smile', icon: '😊' },
  { id: 'nod', label: 'Nod', icon: '🙂' },
];
const LIVENESS_SEQUENCE_LENGTH = 3;
const LIVENESS_TIME_MS = 6000;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function LivenessChallenge({ onResolve }) {
  const [sequence] = useState(() => shuffle(LIVENESS_ACTIONS).slice(0, LIVENESS_SEQUENCE_LENGTH));
  const [buttonOrder] = useState(() => shuffle(LIVENESS_ACTIONS));
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(LIVENESS_TIME_MS);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 100) {
          clearInterval(interval);
          setDone(true);
          onResolve(false);
          return 0;
        }
        return t - 100;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [done]);

  function handleClick(actionId) {
    if (done) return;
    if (actionId !== sequence[progress].id) {
      setDone(true);
      onResolve(false);
      return;
    }
    const next = progress + 1;
    if (next === sequence.length) {
      setDone(true);
      onResolve(true);
    } else {
      setProgress(next);
    }
  }

  return (
    <div className="mt-4">
      <p className="text-center text-xs text-slate-400">Repeat this sequence before time runs out:</p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2 font-mono text-base">
        {sequence.map((action, i) => (
          <span key={action.id} className={i < progress ? 'text-emerald-400' : 'text-slate-200'}>
            {action.icon} {action.label}
            {i < sequence.length - 1 ? ' →' : ''}
          </span>
        ))}
      </div>
      <div className="mx-auto mt-3 h-1.5 w-48 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full bg-amber-500" style={{ width: `${(timeLeft / LIVENESS_TIME_MS) * 100}%` }} />
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {buttonOrder.map((action) => (
          <button
            key={action.id}
            onClick={() => handleClick(action.id)}
            disabled={done}
            className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 transition-colors hover:border-cyan-500/60 disabled:opacity-40"
          >
            {action.icon} {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function GauntletRound({ defenseId, password, roundNumber, totalRounds, onComplete }) {
  const option = DEFENSE_OPTIONS.find((o) => o.id === defenseId);
  const consequence = CONSEQUENCES[defenseId];
  const scenario = WEAKNESS_SCENARIOS[defenseId];
  const managerPassword = useMemo(() => generateManagerPassword(), [defenseId]);

  const [visibleLines, setVisibleLines] = useState([]);
  const [animDone, setAnimDone] = useState(false);
  const [outcome, setOutcome] = useState(null); // { holds, resultText }

  useEffect(() => {
    const timers = consequence.lines.map((line) =>
      setTimeout(() => setVisibleLines((prev) => [...prev, line]), line.delay)
    );
    const lastDelay = consequence.lines[consequence.lines.length - 1].delay;
    const t1 = setTimeout(() => setAnimDone(true), lastDelay + 700);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(t1);
    };
  }, [defenseId]);

  function resolve(holds, resultText) {
    setOutcome({ holds, resultText });
    setTimeout(() => onComplete({ id: defenseId, title: option.title, holds, resultText }), 2000);
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-4 text-center">
        <p className="text-xs uppercase tracking-widest text-cyan-400/80">Layer {roundNumber} of {totalRounds}</p>
        <h2 className="mt-2 text-2xl font-bold text-white">{option.icon} {option.title}</h2>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-black/80 p-6 shadow-2xl shadow-black/60">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="ml-2 font-mono text-xs text-slate-500">quantum_attack.exe</span>
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
          {!animDone && visibleLines.length > 0 && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.7 }}
              className="inline-block h-4 w-2 bg-green-400"
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {animDone && !outcome && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-950/20 p-6"
          >
            <p className="text-xs uppercase tracking-widest text-amber-400">New Attack Vector — Not Quantum</p>
            <p className="mt-2 whitespace-pre-line text-sm text-slate-200">{scenario.prompt}</p>
            {scenario.context && <p className="mt-2 text-xs text-slate-400">{scenario.context}</p>}

            {scenario.isReentry ? (
              <>
                <div className="mt-4 rounded-lg border border-cyan-700/40 bg-slate-950/60 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500">Stored In Your Vault For This Account</p>
                  <p className="mt-1 break-all font-mono text-sm text-cyan-300">{managerPassword}</p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    You never see or type this — the manager fills it in for you. Only your master password unlocks it.
                  </p>
                </div>
                <PasswordReentryChallenge
                  password={password}
                  confirmLabel="Confirm Master Password"
                  placeholder="Re-enter your master password"
                  onResolve={(holds) =>
                    resolve(
                      holds,
                      holds
                        ? 'Correct — the master password held. Every generated password behind it stays safe.'
                        : "Three wrong guesses. You've locked yourself out of the one password protecting all the others."
                    )
                  }
                />
              </>
            ) : scenario.isLiveness ? (
              <LivenessChallenge
                onResolve={(holds) => resolve(holds, holds ? scenario.successText : scenario.failText)}
              />
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {scenario.choices.map((choice) => (
                  <button
                    key={choice.id}
                    onClick={() => resolve(choice.holds, choice.resultText)}
                    className="rounded-xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-left text-sm text-slate-200 transition-colors hover:border-cyan-500/60"
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {outcome && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`mt-6 rounded-2xl border p-6 text-center ${outcome.holds ? 'border-emerald-500/50 bg-emerald-950/30' : 'border-red-500/50 bg-red-950/30'}`}
          >
            <p className={`text-xs uppercase tracking-widest ${outcome.holds ? 'text-emerald-400' : 'text-red-400'}`}>
              {outcome.holds ? 'Layer Held' : 'Layer Compromised'}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{outcome.resultText}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const LOCK_STEP_MS = 150;
const SCRAMBLE_INTERVAL_MS = 40;

const CRACK_CHARSETS = {
  letter: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  digit: '0123456789',
  symbol: '!@#$%^&*?-_=+~',
};

const SLOT_STYLES = {
  letter: 'border-red-500 bg-red-950/60 text-red-300',
  digit: 'border-amber-500 bg-amber-950/60 text-amber-300',
  symbol: 'border-fuchsia-500 bg-fuchsia-950/60 text-fuchsia-300',
};

const DEFAULT_PASSWORD = 'Passw0rd!';
const REENTRY_MAX_ATTEMPTS = 3;

function classifyPasswordChar(ch) {
  if (/[0-9]/.test(ch)) return 'digit';
  if (/[a-zA-Z]/.test(ch)) return 'letter';
  return 'symbol';
}

function randomCrackChar(type) {
  const pool = CRACK_CHARSETS[type] ?? CRACK_CHARSETS.letter;
  return pool[Math.floor(Math.random() * pool.length)];
}

// Animates each character slot scrambling through same-category glyphs (letter/digit/symbol)
// before locking, one at a time, onto the real password character at that position — showing
// the plaintext a quantum attacker would recover from the hash, not a look-alike stand-in.
function PasswordCrackDisplay({ password, slots, active, onDone }) {
  const [chars, setChars] = useState(() => slots.map((type) => randomCrackChar(type)));
  const [lockedCount, setLockedCount] = useState(0);
  const lockedRef = useRef(0);

  useEffect(() => {
    if (!active || slots.length === 0) return;

    lockedRef.current = 0;
    setLockedCount(0);
    setChars(slots.map((type) => randomCrackChar(type)));

    const scrambleId = setInterval(() => {
      setChars((prev) =>
        prev.map((ch, i) => (i < lockedRef.current ? ch : randomCrackChar(slots[i])))
      );
    }, SCRAMBLE_INTERVAL_MS);

    const lockTimers = slots.map((_, i) =>
      setTimeout(() => {
        lockedRef.current = i + 1;
        setLockedCount(i + 1);
        setChars((prev) => prev.map((ch, idx) => (idx === i ? password[i] : ch)));
      }, LOCK_STEP_MS * (i + 1))
    );

    const doneTimer = setTimeout(() => onDone?.(), LOCK_STEP_MS * slots.length + 500);

    return () => {
      clearInterval(scrambleId);
      lockTimers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
  }, [active, password]);

  return (
    <div className="flex flex-wrap justify-center gap-1.5 font-mono">
      {slots.map((type, i) => {
        const locked = i < lockedCount;
        return (
          <motion.span
            key={i}
            animate={locked ? { scale: [1.35, 1] } : {}}
            transition={{ duration: 0.25 }}
            className={`flex h-9 w-7 items-center justify-center rounded-md border text-base font-bold ${locked ? SLOT_STYLES[type] : 'border-cyan-800/50 bg-slate-900 text-cyan-400/70'
              }`}
          >
            {chars[i]}
          </motion.span>
        );
      })}
    </div>
  );
}

function SlotLegend({ slots }) {
  const letters = slots.filter((t) => t === 'letter').length;
  const digits = slots.filter((t) => t === 'digit').length;
  const symbols = slots.filter((t) => t === 'symbol').length;

  return (
    <div className="mt-3 flex flex-wrap justify-center gap-4 font-mono text-xs">
      <span className="text-red-400">{letters} letter{letters === 1 ? '' : 's'}</span>
      <span className="text-amber-400">{digits} number{digits === 1 ? '' : 's'}</span>
      <span className="text-fuchsia-400">{symbols} symbol{symbols === 1 ? '' : 's'}</span>
    </div>
  );
}

function PasswordMission() {
  const { state: profile } = useLocation();
  const username = profile?.username ?? 'agent_42';
  const email = profile?.email ?? 'user@example.com';
  const password = profile?.password || DEFAULT_PASSWORD;
  const passwordSlots = password.split('').map(classifyPasswordChar);

  const assessment = useMemo(() => evaluatePassword(password, username, email), [password, username, email]);
  const lines = useMemo(
    () => (assessment.quantumResistant ? buildResistLines(username, email, assessment) : buildBreachLines(username, email, assessment)),
    [assessment, username, email]
  );

  const [visibleLines, setVisibleLines] = useState([]);
  const [phase, setPhase] = useState('breaching'); // 'breaching' | 'breached' | 'resisted' | 'lockedOut' | 'defending' | 'gauntlet' | 'outcome'
  const [crackComplete, setCrackComplete] = useState(false);

  const [reentryPassed, setReentryPassed] = useState(false);

  const [selectedDefenses, setSelectedDefenses] = useState([]);
  const [gauntletIndex, setGauntletIndex] = useState(0);
  const [gauntletResults, setGauntletResults] = useState([]);

  useEffect(() => {
    const timers = lines.map((line) =>
      setTimeout(() => setVisibleLines((prev) => [...prev, line]), line.delay)
    );

    const lastDelay = lines[lines.length - 1].delay;
    const t1 = setTimeout(() => setPhase(assessment.quantumResistant ? 'resisted' : 'breached'), lastDelay + 800);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(t1);
    };
  }, []);

  function handleToggleDefense(id) {
    setSelectedDefenses((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function handleDeploy() {
    setGauntletIndex(0);
    setGauntletResults([]);
    setPhase('gauntlet');
  }

  function handleRoundComplete(result) {
    setGauntletResults((prev) => {
      const next = [...prev, result];
      if (gauntletIndex + 1 < selectedDefenses.length) {
        setGauntletIndex((i) => i + 1);
      } else {
        setPhase('outcome');
      }
      return next;
    });
  }

  function handleRestartLoadout() {
    setSelectedDefenses([]);
    setGauntletResults([]);
    setGauntletIndex(0);
    setPhase('defending');
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <AnimatePresence mode="wait">
        {phase === 'breaching' || phase === 'breached' || phase === 'resisted' ? (
          <motion.div
            key="breach"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 py-10"
          >
            {/* Ambient glow: red once cracked, emerald if the password held */}
            <motion.div
              className="pointer-events-none fixed inset-0"
              animate={
                phase === 'breached'
                  ? { opacity: [0, 0.18, 0.09] }
                  : phase === 'resisted'
                    ? { opacity: [0, 0.16, 0.08] }
                    : { opacity: 0 }
              }
              transition={{ duration: 1.5 }}
              style={{
                background:
                  phase === 'resisted'
                    ? 'radial-gradient(circle at 50% 40%, #10b981 0%, transparent 70%)'
                    : 'radial-gradient(circle at 50% 40%, #dc2626 0%, transparent 70%)',
              }}
            />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl"
            >
              <div className="mb-6 text-center">
                <p className="text-sm uppercase tracking-[0.35em] text-red-400/80">Mission 1 — Password Vault</p>
                <h1 className="mt-2 text-3xl font-bold text-white">A Quantum Attack Is Underway</h1>
                <p className="mt-2 text-slate-400">
                  Targeting <span className="text-cyan-300">{username}</span>
                </p>
              </div>

              {/* Terminal window */}
              <div className="rounded-2xl border border-slate-700 bg-black/80 p-6 shadow-2xl shadow-black/60">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="ml-2 font-mono text-xs text-slate-500">quantum_attack.exe</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">↳ plain English</span>
                </div>

                <div className="min-h-48 space-y-2 font-mono">
                  {visibleLines.map((line) => (
                    <div key={line.id}>
                      <motion.p
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`text-sm leading-6 ${line.cls}`}
                      >
                        {line.text}
                      </motion.p>
                      {line.explain && (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.25 }}
                          className="pl-4 text-xs italic leading-5 text-slate-500"
                        >
                          ↳ {line.explain}
                        </motion.p>
                      )}
                    </div>
                  ))}

                  {phase === 'breaching' && visibleLines.length > 0 && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.7 }}
                      className="inline-block h-4 w-2 bg-green-400"
                    />
                  )}
                </div>
              </div>

              {/* Exposed credentials panel */}
              <AnimatePresence>
                {phase === 'breached' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="mt-6 rounded-2xl border border-red-500/50 bg-red-950/40 p-6 text-center"
                  >
                    <p className="text-xs uppercase tracking-widest text-red-400">Credentials Exposed</p>
                    <div className="mt-4 flex justify-center gap-10 font-mono text-sm">
                      <div>
                        <p className="text-slate-500 mb-1">Username</p>
                        <p className="text-red-300">{username}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Email</p>
                        <p className="text-red-300">{email}</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <p className="text-slate-500 mb-2 font-mono text-sm">Password</p>
                      <PasswordCrackDisplay
                        password={password}
                        slots={passwordSlots}
                        active={phase === 'breached'}
                        onDone={() => setCrackComplete(true)}
                      />
                      <SlotLegend slots={passwordSlots} />
                      <AnimatePresence>
                        {crackComplete && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mt-3"
                          >
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <AnimatePresence>
                      {crackComplete && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="mt-8"
                        >
                          <button
                            onClick={() => setPhase('defending')}
                            className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                          >
                            Find Ways to Combat
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Vault secured panel — the password itself stopped the attack */}
              <AnimatePresence>
                {phase === 'resisted' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="mt-6 rounded-2xl border border-emerald-500/50 bg-emerald-950/30 p-6 text-center"
                  >
                    <p className="text-xs uppercase tracking-widest text-emerald-400">Vault Secured</p>
                    <p className="mt-2 text-sm font-semibold text-emerald-200">
                      Your password's own entropy defeated the quantum attack
                    </p>
                    <div className="mt-4 flex justify-center gap-10 font-mono text-sm">
                      <div>
                        <p className="text-slate-500 mb-1">Length</p>
                        <p className="text-emerald-300">{assessment.length} chars</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Entropy</p>
                        <p className="text-emerald-300">{assessment.entropyBits} bits</p>
                      </div>
                      <div>
                        <p className="text-slate-500 mb-1">Char Types</p>
                        <p className="text-emerald-300">{assessment.categoryCount}/4</p>
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-slate-300">
                      No password hash was ever recovered — this attack never even reached your account's other defenses.
                    </p>

                    {!reentryPassed ? (
                      <div className="mt-6 rounded-xl border border-emerald-500/30 bg-black/40 p-5 text-left">
                        <p className="text-center text-sm font-semibold text-emerald-200">
                          One last check: prove it's really yours.
                        </p>
                        <p className="mt-1 text-center text-xs text-slate-400">
                          A password a quantum computer can't guess is only useful if <em>you</em> can. Re-enter it from memory — no peeking.
                        </p>
                        <PasswordReentryChallenge
                          password={password}
                          onResolve={(holds) => (holds ? setReentryPassed(true) : setPhase('lockedOut'))}
                        />
                      </div>
                    ) : (
                      <>
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-4 text-sm font-semibold text-emerald-300"
                        >
                          Confirmed — you remembered it. Quantum-resistant and yours.
                        </motion.p>
                        <p className="mt-2 text-sm leading-relaxed text-slate-300">
                          But no password stays quantum-resistant forever. Want to see how much further you can harden this vault?
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                          <button
                            onClick={() => setPhase('defending')}
                            className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                          >
                            Add Extra Layers Anyway
                          </button>
                          <Link
                            to="/mission/1"
                            className="rounded-full bg-slate-800 px-6 py-3 text-slate-200 hover:bg-slate-700"
                          >
                            Finish Mission
                          </Link>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : phase === 'lockedOut' ? (
          <motion.div
            key="lockedOut"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
          >
            <motion.div
              className="pointer-events-none fixed inset-0"
              animate={{ opacity: [0, 0.18, 0.09] }}
              transition={{ duration: 1.5 }}
              style={{ background: 'radial-gradient(circle at 50% 40%, #dc2626 0%, transparent 70%)' }}
            />
            <div className="w-full max-w-xl rounded-2xl border border-red-500/50 bg-black/80 p-8 text-center shadow-2xl shadow-black/60">
              <p className="text-xs uppercase tracking-widest text-red-400">
                █████████ ACCOUNT LOCKED █████████
              </p>
              <h1 className="mt-4 text-2xl font-bold text-white">You Forgot the Password You Chose</h1>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                A quantum computer with {assessment.entropyBits} bits of keyspace to search couldn't crack this password.
                But after {REENTRY_MAX_ATTEMPTS} tries, neither could you remember it. Entropy that only lives on a screen you mashed once
                isn't a defense — it's just a different way to lock yourself out.
              </p>
              <p className="mt-4 text-xs text-slate-500">
                A password only protects an account if the person who owns it can actually use it.
              </p>
              <Link
                to="/mission/1"
                className="mt-8 inline-flex rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Restart Mission
              </Link>
            </div>
          </motion.div>
        ) : phase === 'defending' ? (
          <motion.div
            key="defend"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl px-6 py-16"
          >
            <div className="mb-8 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">What Happens Next?</p>
              <h2 className="mt-3 text-4xl font-bold text-white">Build Your Defense Loadout</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-400">
                {assessment.quantumResistant
                  ? 'Your password already held the line — but no password stays quantum-resistant forever. Deploy as many layers as you want: the more you stack, the harder this account is to fully compromise. But every layer you deploy still has to survive its own attack.'
                  : 'Your password alone is no longer enough. Deploy as many layers as you want: the more you stack, the harder this account is to fully compromise. But every layer you deploy still has to survive its own attack.'}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {DEFENSE_OPTIONS.map((option) => (
                <DefenseCard
                  key={option.id}
                  option={option}
                  selected={selectedDefenses.includes(option.id)}
                  onToggle={() => handleToggleDefense(option.id)}
                />
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleDeploy}
                disabled={selectedDefenses.length === 0}
                className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Deploy {selectedDefenses.length || ''} Layer{selectedDefenses.length === 1 ? '' : 's'}
              </button>
              <Link
                to="/mission/1"
                className="inline-flex rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700"
              >
                Back to Mission
              </Link>
            </div>
          </motion.div>
        ) : phase === 'gauntlet' ? (
          <motion.div
            key="gauntlet"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
          >
            <GauntletRound
              key={selectedDefenses[gauntletIndex]}
              defenseId={selectedDefenses[gauntletIndex]}
              password={password}
              roundNumber={gauntletIndex + 1}
              totalRounds={selectedDefenses.length}
              onComplete={handleRoundComplete}
            />
          </motion.div>
        ) : (
          <motion.div
            key="outcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
          >
            {(() => {
              const holdsCount = gauntletResults.filter((r) => r.holds).length;
              const totalCount = gauntletResults.length;
              const allHeld = totalCount > 0 && holdsCount === totalCount;
              const noneHeld = totalCount > 0 && holdsCount === 0;
              const verdictColor = allHeld ? 'text-emerald-400' : noneHeld ? 'text-red-400' : 'text-amber-400';

              return (
                <div className="w-full max-w-2xl text-center">
                  <p className={`text-xs uppercase tracking-widest ${verdictColor}`}>
                    {allHeld ? 'FULL DEFENSE-IN-DEPTH' : noneHeld ? 'ACCOUNT COMPROMISED' : 'BREACH PARTIALLY CONTAINED'}
                  </p>
                  <h1 className="mt-2 text-3xl font-bold text-white">
                    {holdsCount}/{totalCount} Layer{totalCount === 1 ? '' : 's'} Held
                  </h1>

                  <div className="mt-8 space-y-3 text-left">
                    {gauntletResults.map((r) => (
                      <div
                        key={r.id}
                        className={`rounded-xl border p-4 ${r.holds ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-red-500/40 bg-red-950/20'}`}
                      >
                        <p className={`text-xs uppercase tracking-wide ${r.holds ? 'text-emerald-400' : 'text-red-400'}`}>
                          {r.title} — {r.holds ? 'Held' : 'Compromised'}
                        </p>
                        <p className="mt-1 text-sm text-slate-300">{r.resultText}</p>
                      </div>
                    ))}
                  </div>

                  <p className="mt-6 text-sm leading-relaxed text-slate-400">
                    {allHeld
                      ? "Every layer you chose survived its own attack, not just the quantum one. That's what real defense-in-depth looks like — no single point of failure."
                      : noneHeld
                        ? 'Every layer you picked had a gap, and the attacker found all of them. Stacking defenses only helps if each one is actually used correctly.'
                        : "At least one layer held, so the attacker didn't get everything — but a failed layer is still a real exposure. Defense-in-depth reduces risk, it doesn't erase it."}
                  </p>

                  <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handleRestartLoadout}
                      className="rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700"
                    >
                      Try a Different Loadout
                    </button>
                    <Link
                      to="/mission/1"
                      className="rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                    >
                      Finish Mission
                    </Link>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default PasswordMission;
