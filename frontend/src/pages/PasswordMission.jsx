import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'passw0rd', '123456', '12345678', '123456789', '1234567890',
  'qwerty', 'qwerty123', 'abc123', '111111', '123123', 'letmein', 'welcome', 'monkey',
  'dragon', 'iloveyou', 'admin', 'trustno1', 'sunshine', 'princess', 'football',
  'baseball', 'master', 'superman', 'starwars', 'whatever', 'qazwsx', 'shadow',
  'michael', 'jennifer', '000000', '123321', 'freedom', 'whatever1',
]);

const KEYBOARD_SEQUENCES = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function hasSequentialRun(lower, minRun = 4) {
  for (const seq of KEYBOARD_SEQUENCES) {
    for (let i = 0; i <= seq.length - minRun; i++) {
      const forward = seq.slice(i, i + minRun);
      const backward = [...forward].reverse().join('');
      if (lower.includes(forward) || lower.includes(backward)) return true;
    }
  }
  return false;
}

function hasRepeatedRun(str, minRun = 3) {
  return new RegExp(`(.)\\1{${minRun - 1},}`).test(str);
}

// Rule-based read on the player's real password: how large its keyspace is (entropy) and
// whether it's the kind of predictable pattern Grover's speedup chews through instantly.
function evaluatePassword(password, username, email) {
  const length = password.length;
  const lower = password.toLowerCase();
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const categoryCount = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  let poolSize = 0;
  if (hasLower) poolSize += 26;
  if (hasUpper) poolSize += 26;
  if (hasDigit) poolSize += 10;
  if (hasSymbol) poolSize += 32;
  poolSize = poolSize || 26;

  const entropyBits = Math.round(length * Math.log2(poolSize));
  const effectiveBits = Math.round(entropyBits / 2);

  const emailLocal = (email.split('@')[0] || '').toLowerCase();
  const reasons = [];

  const isCommon = COMMON_PASSWORDS.has(lower);
  if (isCommon) reasons.push('it matches a known top-breached password list');

  const containsIdentity =
    (username && username.length > 2 && lower.includes(username.toLowerCase())) ||
    (emailLocal.length > 2 && lower.includes(emailLocal));
  if (containsIdentity) reasons.push('it contains your username or email');

  const sequential = hasSequentialRun(lower);
  if (sequential) reasons.push('it contains a keyboard or alphabetic/numeric sequence');

  const repeated = hasRepeatedRun(password);
  if (repeated) reasons.push('it repeats the same character too many times in a row');

  if (length < 12) reasons.push('it is shorter than 12 characters');
  if (categoryCount < 3) reasons.push('it uses fewer than 3 character types (lowercase, uppercase, digits, symbols)');

  const predictable = isCommon || containsIdentity || sequential || repeated;
  const quantumResistant = !predictable && length >= 12 && categoryCount >= 3;

  return { length, entropyBits, effectiveBits, poolSize, categoryCount, predictable, quantumResistant, reasons };
}

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

const CONSEQUENCES = {
  twofa: {
    verdict: 'VAULT SECURED',
    concept: "Grover's Algorithm can't search a factor it was never given",
    lines: [
      { id: 1, delay: 400, text: '> Re-running Grover\'s Algorithm with recovered password hash...', cls: 'text-green-400' },
      { id: 2, delay: 1600, text: '> Password accepted — proceeding to second factor...', cls: 'text-yellow-300' },
      { id: 3, delay: 2900, text: '> One-time code requested from authenticator device...', cls: 'text-green-400' },
      { id: 4, delay: 4200, text: '> No physical device in attacker\'s possession — code unknown', cls: 'text-orange-400' },
      { id: 5, delay: 5400, text: '> Quantum speedup cannot brute-force a code that changes every 30 seconds off-network', cls: 'text-orange-400' },
      { id: 6, delay: 6600, text: '█████████ ACCESS DENIED — SECOND FACTOR REQUIRED █████████', cls: 'text-emerald-400 font-bold tracking-wider' },
    ],
    explanation:
      "Grover's algorithm sped up the search through your password's keyspace, and it still cracked the hash. But 2FA doesn't try to out-math the quantum computer — it moves the real secret off the wire entirely. The one-time code lives on your physical device and is never transmitted as something a computer, quantum or classical, could intercept and search. Cracking your password no longer means cracking your account.",
  },
  biometric: {
    verdict: 'VAULT SECURED',
    concept: 'No password hash means no search space to accelerate',
    lines: [
      { id: 1, delay: 400, text: '> Re-running Grover\'s Algorithm to search password states...', cls: 'text-green-400' },
      { id: 2, delay: 1600, text: '> Scanning login endpoint for a password hash to target...', cls: 'text-green-400' },
      { id: 3, delay: 2900, text: '> No password hash found — authentication is not secret-based', cls: 'text-yellow-300' },
      { id: 4, delay: 4200, text: '> Biometric template stored in local secure hardware — never transmitted', cls: 'text-orange-400' },
      { id: 5, delay: 5400, text: '> Search space: undefined — there is nothing here to amplify', cls: 'text-orange-400' },
      { id: 6, delay: 6600, text: '█████████ ACCESS DENIED — NO SECRET TO CRACK █████████', cls: 'text-emerald-400 font-bold tracking-wider' },
    ],
    explanation:
      "Grover's algorithm only helps an attacker who has a search space of guesses to explore — a password hash, a key. Biometric login removes that search space instead of trying to make it bigger. Your fingerprint or face never becomes a string of characters sitting in a database for a quantum computer to reconstruct, so there's nothing for the amplification step to lock onto.",
  },
  manager: {
    verdict: 'VAULT SECURED',
    concept: "Grover's quadratic speedup still isn't enough against real entropy",
    lines: [
      { id: 1, delay: 400, text: '> Re-running Grover\'s Algorithm on new 30-character password...', cls: 'text-green-400' },
      { id: 2, delay: 1600, text: '> Generating quantum superposition across 2¹⁹⁶ password states...', cls: 'text-green-400' },
      { id: 3, delay: 2900, text: '> Applying quadratic speedup — effective search reduced to 2⁹⁸ operations', cls: 'text-yellow-300' },
      { id: 4, delay: 4200, text: '> Estimated time to completion: ~10¹³ years on largest known quantum hardware', cls: 'text-orange-400' },
      { id: 5, delay: 5400, text: '> Entropy check: SUFFICIENT FOR QUANTUM RESISTANCE', cls: 'text-orange-400' },
      { id: 6, delay: 6600, text: '█████████ ACCESS DENIED — BRUTE-FORCE INFEASIBLE █████████', cls: 'text-emerald-400 font-bold tracking-wider' },
    ],
    explanation:
      "Grover's algorithm gives a quantum computer a quadratic speedup on brute-force search — it roughly squares the search space it can get through, which is the same as cutting a password's effective strength in half. Your original human-made password had so little entropy that halving it still left an easy search. A random 30+ character password carries roughly 196 bits of entropy; even after the quantum speedup, the attacker is left searching a space of about 2⁹⁸ possibilities — a number so large that no quantum computer we can foresee finishes in time that matters. Length and true randomness are what make a password itself quantum-resistant, without needing any extra hardware.",
  },
};

function DefenseCard({ option, onSelect }) {
  return (
    <motion.div
      initial="idle"
      whileHover="hovered"
      onClick={() => onSelect(option.id)}
      className="relative flex flex-col rounded-2xl border border-slate-700 bg-slate-900/80 p-6 cursor-pointer select-none transition-colors hover:border-cyan-500/60"
    >
      <span className="text-4xl">{option.icon}</span>
      <h3 className="mt-3 text-lg font-semibold text-white">{option.title}</h3>
      <p className="mt-1 text-xs text-slate-500">Hover to learn more · Click to deploy</p>

      <motion.div
        variants={{
          idle: { opacity: 0, height: 0, marginTop: 0 },
          hovered: { opacity: 1, height: 'auto', marginTop: 12 },
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <p className="text-sm text-slate-300 leading-relaxed">{option.description}</p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-cyan-400">
          Deploy This Defense →
        </p>
      </motion.div>

      <motion.div
        variants={{ idle: { opacity: 0 }, hovered: { opacity: 1 } }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.12)]"
      />
    </motion.div>
  );
}

function OutcomeTerminal({ option, username }) {
  const consequence = CONSEQUENCES[option.id];
  const [visibleLines, setVisibleLines] = useState([]);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    const timers = consequence.lines.map((line) =>
      setTimeout(() => setVisibleLines((prev) => [...prev, line]), line.delay)
    );
    const lastDelay = consequence.lines[consequence.lines.length - 1].delay;
    const t1 = setTimeout(() => setResolved(true), lastDelay + 700);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(t1);
    };
  }, [option.id]);

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-400/80">Defense Deployed</p>
        <h1 className="mt-2 text-3xl font-bold text-white">
          {option.icon} {option.title}
        </h1>
        <p className="mt-2 text-slate-400">
          The quantum attacker returns to finish breaching <span className="text-cyan-300">{username}</span>'s account.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-700 bg-black/80 p-6 shadow-2xl shadow-black/60">
        <div className="mb-4 flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          <div className="h-3 w-3 rounded-full bg-yellow-500" />
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="ml-2 font-mono text-xs text-slate-500">quantum_attack.exe</span>
        </div>

        <div className="min-h-48 space-y-1 font-mono">
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

          {!resolved && visibleLines.length > 0 && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.7 }}
              className="inline-block h-4 w-2 bg-green-400"
            />
          )}
        </div>
      </div>

      <AnimatePresence>
        {resolved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mt-6 rounded-2xl border border-emerald-500/50 bg-emerald-950/30 p-6"
          >
            <p className="text-center text-xs uppercase tracking-widest text-emerald-400">{consequence.verdict}</p>
            <p className="mt-1 text-center text-sm font-semibold text-emerald-200">{consequence.concept}</p>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">{consequence.explanation}</p>
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
  const [phase, setPhase] = useState('breaching'); // 'breaching' | 'breached' | 'resisted' | 'defending' | 'outcome'
  const [selectedOption, setSelectedOption] = useState(null);
  const [crackComplete, setCrackComplete] = useState(false);

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

  function handleSelectDefense(optionId) {
    setSelectedOption(optionId);
    setPhase('outcome');
  }

  function handleTryAnother() {
    setSelectedOption(null);
    setPhase('defending');
  }

  const selected = DEFENSE_OPTIONS.find((o) => o.id === selectedOption);

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
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : phase === 'defending' ? (
          <motion.div
            key="defend"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl px-6 py-16"
          >
            <div className="mb-12 text-center">
              <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">What Happens Next?</p>
              <h2 className="mt-3 text-4xl font-bold text-white">How Do You Fight Back?</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-400">
                {assessment.quantumResistant
                  ? 'Your password already held the line — but no password stays quantum-resistant forever. Choose one of three strategies to see what real defense-in-depth looks like.'
                  : 'Your password alone is no longer enough. Choose one of three strategies to see how it holds up against the same quantum attack.'}
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {DEFENSE_OPTIONS.map((option) => (
                <DefenseCard key={option.id} option={option} onSelect={handleSelectDefense} />
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                to="/mission/1"
                className="inline-flex rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700"
              >
                Back to Mission
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="outcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 py-16"
          >
            <OutcomeTerminal option={selected} username={username} />

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleTryAnother}
                className="rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700"
              >
                Try a Different Defense
              </button>
              <Link
                to="/mission/1"
                className="rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Finish Mission
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default PasswordMission;
