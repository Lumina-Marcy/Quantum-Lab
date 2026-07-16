import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { evaluatePassword } from '../utils/passwordStrength';
import { ACCOUNTS, DEFENSES, VALUE_META, VALUE_WEIGHTS, curvedStealChance, CASCADE_BONUS_RATIO } from '../utils/triageData';

// The breach is not preventable in this mission — every run ends with the master
// password cracked. Entropy only changes how the narration reads, never the outcome,
// which is what hands control over to the triage loop that follows.
const buildBreachLines = (username, email, assessment) => [
  {
    id: 1, delay: 400, text: '> Initializing Grover\'s Algorithm...', cls: 'text-green-400',
    explain: 'A quantum search trick that tests every possible password at once, instead of guessing one at a time.',
  },
  {
    id: 2, delay: 1400, text: `> Generating quantum superposition across 2^${assessment.entropyBits} password states...`, cls: 'text-green-400',
    explain: 'The quantum computer holds every possible password matching your password\'s length and character types in play simultaneously.',
  },
  {
    id: 3, delay: 2500, text: `> Target acquired: ${username} — ${email}`, cls: 'text-yellow-300',
    explain: 'The attacker now knows exactly which account they are trying to break into.',
  },
  {
    id: 4, delay: 3600, text: '> Running quantum interference amplification...', cls: 'text-green-400',
    explain: 'The algorithm boosts the odds of the real password while cancelling out the wrong guesses.',
  },
  assessment.quantumResistant
    ? {
      id: 5, delay: 4700, text: `> Entropy check: ${assessment.entropyBits} bits — theoretically sufficient, but the search found this account's angle anyway`, cls: 'text-orange-400',
      explain: 'A strong password buys time, not immunity. Given enough amplification rounds, even a well-built lock eventually opens.',
    }
    : {
      id: 5, delay: 4700, text: `> Entropy check: ${assessment.entropyBits} bits — INSUFFICIENT FOR QUANTUM RESISTANCE`, cls: 'text-orange-400',
      explain: `This password fell quickly because ${assessment.reasons.join('; ') || 'it was too short and predictable'}.`,
    },
  {
    id: 6, delay: 5800, text: '> Wavefunction collapsed — password hash isolated...', cls: 'text-green-400',
    explain: 'The search has narrowed down to one answer: the scrambled (hashed) version of your password.',
  },
  {
    id: 7, delay: 6800, text: '█████████ BREACH SUCCESSFUL — CREDENTIALS EXPOSED █████████', cls: 'text-red-400 font-bold tracking-wider',
    explain: 'The hash has been cracked — the attacker now has your real, plaintext password.',
  },
];

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

const RECOVERY_ACTIONS = [
  { id: 'freeze', label: 'Freeze Account', icon: '🧊' },
  { id: 'reset', label: 'Reset Credentials', icon: '🔄' },
  { id: 'report', label: 'Report Fraud', icon: '🚨' },
  { id: 'call', label: 'Call Support', icon: '📞' },
  { id: 'revoke', label: 'Revoke Sessions', icon: '🔌' },
];
const RECOVERY_SEQUENCE_LENGTH = 3;
const RECOVERY_TIME_MS = 6000;
const RECOVERY_TIME_STEP_MS = 1000;
const RECOVERY_TIME_FLOOR_MS = 2000;

// The recovery window doesn't close, but it does decay: every round it's left unattended
// shaves time off the clock and, every other round, adds one more step to the sequence —
// capped at how many distinct recovery actions exist at all.
function recoveryTimeForRound(round) {
  return Math.max(RECOVERY_TIME_FLOOR_MS, RECOVERY_TIME_MS - round * RECOVERY_TIME_STEP_MS);
}
function recoverySequenceLengthForRound(round) {
  return Math.min(RECOVERY_ACTIONS.length, RECOVERY_SEQUENCE_LENGTH + Math.floor(round / 2));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Shared timed-sequence mechanic: repeat a shuffled subset of actions, in order,
// before the clock runs out. Powers both the biometric liveness check and the
// post-theft recovery race — same tension, different skin.
function SequenceChallenge({ actions, sequenceLength, timeMs, onResolve }) {
  const [sequence] = useState(() => shuffle(actions).slice(0, sequenceLength));
  const [buttonOrder] = useState(() => shuffle(actions));
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeMs);
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
        <div className="h-full bg-amber-500" style={{ width: `${(timeLeft / timeMs) * 100}%` }} />
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

function LivenessChallenge({ onResolve }) {
  return (
    <SequenceChallenge
      actions={LIVENESS_ACTIONS}
      sequenceLength={LIVENESS_SEQUENCE_LENGTH}
      timeMs={LIVENESS_TIME_MS}
      onResolve={onResolve}
    />
  );
}

function RecoveryChallenge({ round, onResolve }) {
  return (
    <SequenceChallenge
      actions={RECOVERY_ACTIONS}
      sequenceLength={recoverySequenceLengthForRound(round)}
      timeMs={recoveryTimeForRound(round)}
      onResolve={onResolve}
    />
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

// ---------------------------------------------------------------------------
// Triage loop: the core new gameplay. The breach already happened — this is
// the damage-control phase where the player decides what to defend, one
// decision at a time. There is no timer and no action budget: probabilities
// only move when a decision is made. Each account carries its own percentage
// chance of being stolen, and that chance is what actually gets rolled — a
// percentage never has to hit 100 to lose, and never has to hit 0 to survive.
// ---------------------------------------------------------------------------

const STATUS_META = {
  atrisk: { label: 'At Risk', cls: 'text-slate-400' },
  vaulted: { label: 'Vaulted — Awaiting Seal', cls: 'text-cyan-300' },
  resolving: { label: 'Verifying…', cls: 'text-cyan-300' },
  safe: { label: 'Safe', cls: 'text-emerald-400' },
  stolen: { label: 'Stolen', cls: 'text-red-400' },
  lockedout: { label: 'Locked Out', cls: 'text-amber-400' },
};

function initialAccountState() {
  return Object.fromEntries(
    ACCOUNTS.map((a) => [
      a.id,
      {
        probability: a.startProbability,
        status: 'atrisk',
        defense: null,
        recoveryUsed: false,
        recovered: false,
        roundsSinceStolen: 0,
      },
    ])
  );
}

function ValueBadge({ value }) {
  const meta = VALUE_META[value] ?? VALUE_META.medium;
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function ReversibleBadge({ reversible }) {
  return reversible ? (
    <span className="rounded-full border border-slate-600/60 bg-slate-800/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
      Recoverable
    </span>
  ) : (
    <span className="rounded-full border border-red-600/50 bg-red-950/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-red-300">
      Irreversible
    </span>
  );
}

function percentageColor(probability) {
  if (probability >= 60) return 'text-red-400';
  if (probability >= 30) return 'text-amber-400';
  return 'text-cyan-300';
}

function AccountCard({ account, state, cascading, cascadeSourceLabel, onClick }) {
  const meta = STATUS_META[state.status];
  const recoveryAvailable = state.status === 'stolen' && account.reversible && !state.recoveryUsed;
  const clickable = state.status === 'atrisk' || recoveryAvailable;

  return (
    <motion.div
      layout
      onClick={clickable ? onClick : undefined}
      whileHover={clickable ? { y: -2 } : {}}
      className={`flex flex-col rounded-2xl border p-5 transition-colors ${clickable ? 'cursor-pointer border-slate-700 bg-slate-900/80 hover:border-cyan-500/60' : 'border-slate-800 bg-slate-900/50'
        }`}
    >
      <div className="flex items-start justify-between">
        <span className="text-3xl">{account.icon}</span>
        <div className="flex flex-col items-end gap-1">
          <ValueBadge value={account.value} />
          <ReversibleBadge reversible={account.reversible} />
        </div>
      </div>
      <h3 className="mt-3 text-base font-semibold text-white">{account.label}</h3>

      {state.status === 'atrisk' ? (
        <>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold tabular-nums ${percentageColor(state.probability)}`}>
              {Math.round(state.probability)}%
            </span>
            <span className="text-xs text-slate-500">risk level right now</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">+{account.climbRate} pts every round it's left exposed</p>
          {cascading && (
            <p className="mt-1 text-[11px] font-semibold text-red-400">
              ⚠ {cascadeSourceLabel} was stolen — climbing faster now
            </p>
          )}
          <p className="mt-2 text-[11px] italic leading-4 text-slate-500">{account.naturalDefenseHint}</p>
          <p className="mt-2 text-[11px] text-cyan-400/80">Click to defend →</p>
        </>
      ) : recoveryAvailable ? (
        <>
          <p className="mt-2 text-sm font-mono text-red-400">Stolen — Still Recoverable</p>
          <p className="mt-2 text-[11px] italic leading-4 text-slate-500">
            {state.roundsSinceStolen > 0
              ? `Unattended for ${state.roundsSinceStolen} round${state.roundsSinceStolen === 1 ? '' : 's'} — the recovery window is getting harder to hit.`
              : "Act now — attempting recovery still costs a turn, and it only gets harder the longer you wait."}
          </p>
          <p className="mt-2 text-[11px] text-cyan-400/80">Click to attempt recovery →</p>
        </>
      ) : (
        <p className={`mt-2 text-sm font-mono ${meta.cls}`}>
          {meta.label}
          {state.status === 'safe' && state.recovered ? ' — Recovered' : ''}
        </p>
      )}
    </motion.div>
  );
}

function DefensePicker({ account, vault, defenseUses, onChooseSingle, onStartVault, onAddToVault, onSkip, onClose }) {
  const vaultIsOpenElsewhere = vault.active && !vault.resolved;
  const vaultHasRoom = vault.memberIds.length < DEFENSES.manager.maxTargets;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950/95 p-6 shadow-2xl shadow-black/60"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-400/80">Defend</p>
          <h3 className="mt-1 text-xl font-bold text-white">{account.icon} {account.label}</h3>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">✕</button>
      </div>

      <p className="mt-2 text-xs text-slate-400">{account.naturalDefenseHint}</p>

      <div className="mt-4 space-y-3">
        {Object.values(DEFENSES).map((def) => {
          let action = null;
          let buttonLabel = 'Deploy';
          let disabledReason = '';
          const usesLeft = def.maxUses != null ? def.maxUses - (defenseUses[def.id] ?? 0) : null;

          if (def.mode === 'vault') {
            if (vaultIsOpenElsewhere) {
              if (!vaultHasRoom) disabledReason = 'Vault is full';
              action = () => onAddToVault(account.id);
              buttonLabel = 'Add to Vault — Free';
            } else {
              action = () => onStartVault(account.id);
              buttonLabel = 'Start Vault';
            }
          } else {
            if (usesLeft !== null && usesLeft <= 0) disabledReason = 'No uses left';
            action = () => onChooseSingle(def.id, account.id);
          }

          return (
            <div key={def.id} className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-white">
                    {def.icon} {def.title}
                    {usesLeft !== null && (
                      <span className="ml-2 text-[10px] font-normal uppercase tracking-wide text-slate-500">
                        {Math.max(0, usesLeft)}/{def.maxUses} left
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">{def.tagline}</p>
                </div>
                <button
                  onClick={action}
                  disabled={!!disabledReason}
                  className="shrink-0 rounded-full bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
                >
                  {disabledReason || buttonLabel}
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{def.explain}</p>
            </div>
          );
        })}
      </div>

      <button
        onClick={onSkip}
        className="mt-4 w-full text-center text-xs text-slate-500 underline decoration-dotted hover:text-slate-300"
      >
        Skip — leave every exposed account as-is and let this round pass
      </button>
    </motion.div>
  );
}

function VaultBanner({ vault, accountsById, onSeal }) {
  const members = vault.memberIds.map((id) => accountsById[id]);
  const hasRoom = vault.memberIds.length < DEFENSES.manager.maxTargets;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-600/40 bg-cyan-950/20 px-5 py-4"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">🗝️</span>
        <div>
          <p className="text-sm font-semibold text-cyan-200">
            Vault open — {members.map((m) => `${m.icon} ${m.label}`).join(', ')}
          </p>
          <p className="text-xs text-cyan-400/70">
            {hasRoom
              ? `Room for ${DEFENSES.manager.maxTargets - members.length} more — click another at-risk account and choose "Add to Vault." Assembling is free; sealing is the only step that costs a round.`
              : 'Vault is full — seal it whenever you\'re ready.'}
          </p>
        </div>
      </div>
      <button
        onClick={onSeal}
        className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
      >
        Seal Vault & Verify
      </button>
    </motion.div>
  );
}

function scamCopyFor(label) {
  return {
    prompt:
      `A new email arrives in your inbox.\n\nFrom: Account Security <noreply@secure-alerts.com>\nSubject: Confirm your recent sign-in to ${label}\n\n"We noticed a new sign-in to your account. To confirm this was you and keep your account secure, please reply to this email with the 6-digit verification code below.\n\nCode: 482913"`,
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
  };
}

// Recoverable info (reversible: true) gets a second chance after it's already been marked
// stolen — this confirms the player wants to spend their turn chasing it instead of letting
// it go, before the recovery minigame itself opens.
function RecoveryPrompt({ account, onAttempt, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950/95 p-6 shadow-2xl shadow-black/60"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-cyan-400/80">Recovery Window</p>
          <h3 className="mt-1 text-xl font-bold text-white">{account.icon} {account.label}</h3>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-300">✕</button>
      </div>

      <p className="mt-3 text-sm text-slate-300">
        This account's data was already stolen, but it's a recoverable loss — freezing, resetting, or reporting it
        fast enough can still claw it back before the attacker cashes in.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Attempting recovery still counts as taking your turn — every other exposed account keeps climbing while
        you're focused here, and you only get one attempt.
      </p>

      <div className="mt-5 flex justify-end gap-3">
        <button onClick={onClose} className="rounded-full px-4 py-2 text-xs text-slate-400 hover:text-slate-200">
          Not Now
        </button>
        <button
          onClick={onAttempt}
          className="rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          Attempt Recovery
        </button>
      </div>
    </motion.div>
  );
}

// Handles all four minigames (2FA scam-code, biometric deepfake QTE, vault master-password
// re-entry, post-theft recovery race) behind one modal so the dashboard's other accounts stay visible.
function MinigameOverlay({ kind, targetIds, round, accountsById, password, onFinish }) {
  const targets = targetIds.map((id) => accountsById[id]);
  const labelList = targets.map((t) => t.label).join(' + ');
  const [outcome, setOutcome] = useState(null);
  const managerPasswords = useMemo(
    () => Object.fromEntries(targetIds.map((id) => [id, generateManagerPassword()])),
    [targetIds]
  );

  function resolve(holds, resultText) {
    setOutcome({ holds, resultText });
    setTimeout(() => onFinish(holds), 2000);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"
    >
      <div className="w-full max-w-lg">
        <div className="mb-4 text-center">
          <p className="text-xs uppercase tracking-widest text-cyan-400/80">
            {kind === 'vault' ? 'Vault Verification' : kind === 'recovery' ? 'Recovery Attempt' : 'Real-Time Defense Check'}
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">
            {kind === 'recovery' ? '🔁' : DEFENSES[kind === 'vault' ? 'manager' : kind].icon} {labelList}
          </h2>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-black/80 p-6 shadow-2xl shadow-black/60">
          {!outcome && kind === 'twofa' && (() => {
            const scenario = scamCopyFor(targets[0].label);
            return (
              <>
                <p className="whitespace-pre-line text-sm text-slate-200">{scenario.prompt}</p>
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
              </>
            );
          })()}

          {!outcome && kind === 'biometric' && (
            <>
              <p className="text-sm text-slate-200">
                The attacker pulls a high-resolution photo of you from social media and holds it up to the camera trying to reach <span className="text-cyan-300">{labelList}</span>.
              </p>
              <p className="mt-2 text-xs text-slate-400">
                Before granting access, the system challenges whoever's in front of the camera to prove they're actually alive.
              </p>
              <LivenessChallenge
                onResolve={(holds) =>
                  resolve(
                    holds,
                    holds
                      ? "Liveness confirmed — a static photo could never have replicated that. The attacker is denied before they ever get in."
                      : "You didn't complete the sequence right — and that's exactly the gap attackers count on. This account is gone, and biometrics can't be reset like a password."
                  )
                }
              />
            </>
          )}

          {!outcome && kind === 'vault' && (
            <>
              <p className="text-sm text-slate-200">
                Your password manager is only as strong as the ONE master password that unlocks everything inside it.
              </p>
              <p className="mt-1 text-xs text-slate-400">The attacker now targets that single master password directly.</p>
              <div className="mt-4 space-y-2">
                {targets.map((t) => (
                  <div key={t.id} className="rounded-lg border border-cyan-700/40 bg-slate-950/60 p-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500">{t.icon} {t.label} — Stored In Vault</p>
                    <p className="mt-1 break-all font-mono text-sm text-cyan-300">{managerPasswords[t.id]}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-center text-[11px] text-slate-500">
                You never see or type these — the manager fills them in. Only your master password unlocks them, and re-entering it below reseals the vault. Fail, and every account above falls together.
              </p>
              <PasswordReentryChallenge
                password={password}
                confirmLabel="Confirm Master Password"
                placeholder="Re-enter your master password"
                onResolve={(holds) =>
                  resolve(
                    holds,
                    holds
                      ? 'Correct — the master password held. Every account behind it stays safe.'
                      : `Three wrong guesses. The master password fell, and ${labelList} fell with it.`
                  )
                }
              />
            </>
          )}

          {!outcome && kind === 'recovery' && (
            <>
              <p className="text-sm text-slate-200">
                The attacker already has <span className="text-cyan-300">{labelList}</span>'s data — but a recoverable
                loss isn't a final one yet. Freeze it, reset it, report it: get ahead of it before they cash out.
              </p>
              {round > 0 && (
                <p className="mt-2 text-xs text-amber-400">
                  Left unattended for {round} round{round === 1 ? '' : 's'} — the window's tighter and the sequence is
                  longer than it would have been.
                </p>
              )}
              <RecoveryChallenge
                round={round}
                onResolve={(holds) =>
                  resolve(
                    holds,
                    holds
                      ? `Recovered — you got ahead of the attacker before ${labelList} could be fully exploited.`
                      : `Too slow. The recovery window closed, and ${labelList} stays lost for good.`
                  )
                }
              />
            </>
          )}

          <AnimatePresence>
            {outcome && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`rounded-2xl border p-5 text-center ${outcome.holds ? 'border-emerald-500/50 bg-emerald-950/30' : 'border-red-500/50 bg-red-950/30'}`}
              >
                <p className={`text-xs uppercase tracking-widest ${outcome.holds ? 'text-emerald-400' : 'text-red-400'}`}>
                  {outcome.holds ? 'Defense Held' : 'Defense Compromised'}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{outcome.resultText}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function TriageDashboard({
  accounts, vault, pickerAccountId, recoveryAccountId, activeMinigame, password, canFinishTriage, defenseUses,
  onOpenPicker, onClosePicker, onChooseSingle, onStartVault, onAddToVault, onSealVault, onSkipRound,
  onOpenRecovery, onCloseRecovery, onAttemptRecovery, onFinishTriage, onMinigameFinish,
}) {
  const accountsById = Object.fromEntries(ACCOUNTS.map((a) => [a.id, a]));
  const pickerAccount = pickerAccountId ? accountsById[pickerAccountId] : null;
  const recoveryAccount = recoveryAccountId ? accountsById[recoveryAccountId] : null;

  function handleCardClick(account) {
    const s = accounts[account.id];
    if (s.status === 'atrisk') onOpenPicker(account.id);
    else if (s.status === 'stolen' && account.reversible && !s.recoveryUsed) onOpenRecovery(account.id);
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-6 text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-red-400/80">Damage Control</p>
        <h2 className="mt-2 text-3xl font-bold text-white">You Can't Undo the Breach — Only Triage It</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-400">
          Each percentage is a risk level, not the exact odds — staying low is safer than the number suggests, and
          letting one climb high is more dangerous than the number suggests. It doesn't have to reach 100 to lose.
          Nothing moves until you act: the moment you defend one account, every other account's risk ticks up and gets
          rolled. You can't watch everything at once, and time only passes when you make a decision.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-center gap-4 font-mono text-xs text-slate-400">
        <span>🔐 2FA: {Math.max(0, DEFENSES.twofa.maxUses - defenseUses.twofa)}/{DEFENSES.twofa.maxUses} left</span>
        <span>👆 Biometric: {Math.max(0, DEFENSES.biometric.maxUses - defenseUses.biometric)}/{DEFENSES.biometric.maxUses} left</span>
        <span>🗝️ Password Manager: unlimited seals</span>
      </div>

      {vault.active && !vault.resolved && (
        <VaultBanner vault={vault} accountsById={accountsById} onSeal={onSealVault} />
      )}

      {canFinishTriage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-600/40 bg-amber-950/20 px-5 py-4"
        >
          <p className="text-sm text-amber-200">
            Nothing left to defend — but a stolen account above can still be recovered if you act. Move on whenever
            you're ready.
          </p>
          <button
            onClick={onFinishTriage}
            className="shrink-0 rounded-full bg-slate-800 px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-slate-700"
          >
            Move to Aftermath
          </button>
        </motion.div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ACCOUNTS.map((account) => {
          const cascading = Boolean(account.cascadeFrom && accounts[account.cascadeFrom]?.status === 'stolen');
          return (
            <AccountCard
              key={account.id}
              account={account}
              state={accounts[account.id]}
              cascading={cascading}
              cascadeSourceLabel={cascading ? accountsById[account.cascadeFrom].label : null}
              onClick={() => handleCardClick(account)}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {pickerAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-6"
            onClick={onClosePicker}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <DefensePicker
                account={pickerAccount}
                vault={vault}
                defenseUses={defenseUses}
                onChooseSingle={onChooseSingle}
                onStartVault={onStartVault}
                onAddToVault={onAddToVault}
                onSkip={onSkipRound}
                onClose={onClosePicker}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {recoveryAccount && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-6"
            onClick={onCloseRecovery}
          >
            <div onClick={(e) => e.stopPropagation()}>
              <RecoveryPrompt
                account={recoveryAccount}
                onAttempt={() => onAttemptRecovery(recoveryAccount.id)}
                onClose={onCloseRecovery}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeMinigame && (
          <MinigameOverlay
            key={activeMinigame.targetIds.join(',')}
            kind={activeMinigame.kind}
            targetIds={activeMinigame.targetIds}
            round={activeMinigame.round}
            accountsById={accountsById}
            password={password}
            onFinish={onMinigameFinish}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Quantum Readiness Score: a weighted grade (not the raw saved-count) driven mainly by how
// valuable each account was and how it ended up. Full credit for staying safe, most of it back
// for a successful recovery, partial credit for a theft that was still recoverable (even if never
// claimed), and none for a permanent loss or a lockout — those two are what should actually hurt.
const READINESS_CREDIT = {
  safe: 1,
  recovered: 0.75,
  stolenRecoverable: 0.35,
  stolenIrreversible: 0,
  lockedout: 0.05,
};

const READINESS_TIERS = [
  { min: 95, grade: 'S', label: 'Quantum-Ready', cls: 'border-cyan-400/50 bg-cyan-950/30 text-cyan-300' },
  { min: 85, grade: 'A', label: 'Well Defended', cls: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300' },
  { min: 70, grade: 'B', label: 'Mostly Secure', cls: 'border-lime-500/40 bg-lime-950/20 text-lime-300' },
  { min: 50, grade: 'C', label: 'Exposed', cls: 'border-amber-500/40 bg-amber-950/30 text-amber-300' },
  { min: 30, grade: 'D', label: 'Compromised', cls: 'border-orange-500/40 bg-orange-950/30 text-orange-300' },
  { min: 0, grade: 'F', label: 'Breach Catastrophe', cls: 'border-red-500/40 bg-red-950/30 text-red-300' },
];

function readinessBucket(account, state) {
  if (state.status === 'safe') return state.recovered ? 'recovered' : 'safe';
  if (state.status === 'lockedout') return 'lockedout';
  return account.reversible ? 'stolenRecoverable' : 'stolenIrreversible';
}

function computeQuantumReadiness(accounts) {
  const counts = { safe: 0, recovered: 0, stolenRecoverable: 0, stolenIrreversible: 0, lockedout: 0 };
  let possible = 0;
  let achieved = 0;
  for (const account of ACCOUNTS) {
    const weight = VALUE_WEIGHTS[account.value] ?? 1;
    const bucket = readinessBucket(account, accounts[account.id]);
    counts[bucket] += 1;
    possible += weight;
    achieved += weight * READINESS_CREDIT[bucket];
  }
  const percentage = possible === 0 ? 100 : Math.round((achieved / possible) * 100);
  const tier = READINESS_TIERS.find((t) => percentage >= t.min) ?? READINESS_TIERS[READINESS_TIERS.length - 1];
  return { percentage, counts, ...tier };
}

const READINESS_COUNT_LABELS = [
  ['safe', 'text-emerald-300', 'safe'],
  ['recovered', 'text-cyan-300', 'recovered'],
  ['stolenRecoverable', 'text-amber-300', 'stolen (recoverable)'],
  ['stolenIrreversible', 'text-red-300', 'lost completely'],
  ['lockedout', 'text-orange-300', 'locked out'],
];

function QuantumReadinessPanel({ accounts }) {
  const readiness = useMemo(() => computeQuantumReadiness(accounts), [accounts]);

  return (
    <div className={`mx-auto mb-8 max-w-md rounded-2xl border p-6 ${readiness.cls}`}>
      <p className="text-center text-xs uppercase tracking-widest opacity-80">Quantum Readiness Score</p>
      <div className="mt-3 flex items-center justify-center gap-4">
        <span className="text-5xl font-bold leading-none">{readiness.grade}</span>
        <span className="text-2xl font-semibold tabular-nums">{readiness.percentage}%</span>
      </div>
      <p className="mt-1 text-center text-sm font-semibold">{readiness.label}</p>
      <p className="mt-3 text-center text-[11px] leading-relaxed opacity-80">
        Weighted by how valuable each account was and how it ended up — full credit for staying safe, most of it
        back for a successful recovery, partial credit for a theft that was still recoverable, and none for a
        permanent loss or a lockout.
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-3 text-[11px] font-mono">
        {READINESS_COUNT_LABELS.filter(([key]) => readiness.counts[key] > 0).map(([key, cls, text]) => (
          <span key={key} className={cls}>{readiness.counts[key]} {text}</span>
        ))}
      </div>
    </div>
  );
}

function ConsequencesScreen({ accounts, onReplay }) {
  const savedCount = ACCOUNTS.filter((a) => accounts[a.id].status === 'safe').length;
  const irreversibleAccounts = ACCOUNTS.filter((a) => !a.reversible);
  const irreversibleLost = irreversibleAccounts.filter((a) => accounts[a.id].status !== 'safe');
  const perfect = savedCount === ACCOUNTS.length;

  return (
    <div className="mx-auto max-w-2xl px-6 py-16 text-center">
      {perfect && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', bounce: 0.4 }}
          className="mb-8 rounded-2xl border border-amber-400/60 bg-gradient-to-b from-amber-950/40 to-slate-950 p-6"
        >
          <p className="text-4xl">🏆</p>
          <p className="mt-2 text-xs uppercase tracking-widest text-amber-300">Perfect Defense</p>
          <p className="mt-1 text-lg font-bold text-white">Every single account survived the breach.</p>
          <p className="mt-2 text-sm text-slate-300">
            Rare, and it took every roll going your way — that's exactly why real security doesn't rely on getting lucky.
          </p>
        </motion.div>
      )}

      <p className="text-xs uppercase tracking-widest text-cyan-400/80">Aftermath</p>
      <h1 className="mt-2 text-3xl font-bold text-white">{savedCount}/{ACCOUNTS.length} Accounts Saved</h1>
      <p className="mt-3 text-sm text-slate-400">
        {irreversibleLost.length === 0
          ? `All ${irreversibleAccounts.length} irreversible-loss accounts (${irreversibleAccounts.map((a) => a.label).join(', ')}) were avoided. That prioritization is what mattered most.`
          : `${irreversibleLost.length} of ${irreversibleAccounts.length} irreversible loss${irreversibleLost.length === 1 ? '' : 'es'} occurred — the kind no password reset can undo.`}
      </p>

      <QuantumReadinessPanel accounts={accounts} />

      <div className="mt-8 space-y-3 text-left">
        {ACCOUNTS.map((account) => {
          const state = accounts[account.id];
          const isLoss = state.status === 'stolen' || state.status === 'lockedout';
          const heavy = isLoss && !account.reversible;
          const cardCls = state.status === 'safe'
            ? 'border-emerald-500/40 bg-emerald-950/20'
            : heavy
              ? 'border-red-600/60 bg-red-950/50'
              : isLoss
                ? 'border-amber-500/40 bg-amber-950/20'
                : 'border-slate-700 bg-slate-900/50';
          const consequence = state.status === 'lockedout' ? account.lockedOutConsequence : account.lostConsequence;

          return (
            <div key={account.id} className={`rounded-xl border p-4 ${cardCls}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{account.icon} {account.label}</p>
                <span className={`text-xs uppercase tracking-wide ${STATUS_META[state.status].cls}`}>
                  {STATUS_META[state.status].label}
                  {heavy ? ' — Irreversible Loss' : isLoss ? ' — Recoverable Loss' : ''}
                </span>
              </div>
              {state.status !== 'safe' && (
                <p className="mt-2 text-sm text-slate-300">{consequence}</p>
              )}
              {state.status === 'safe' && state.recovered && (
                <p className="mt-2 text-sm text-emerald-300">
                  Stolen, then clawed back before the damage stuck — recovery doesn't erase the scare, but it does
                  erase the loss.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-left">
        <p className="text-sm font-semibold text-cyan-300">The lesson</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Damage control means minimizing loss, not preventing it — every decision bought time for one account while
          the odds kept climbing everywhere else. The only real fix is migrating to quantum-resistant security
          <em> before</em> quantum arrives: long random keys stay hard to search, not merely hard to guess.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onReplay}
          className="rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700"
        >
          Run It Back
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
}

function PasswordMission() {
  const { state: profile } = useLocation();
  const username = profile?.username ?? 'agent_42';
  const email = profile?.email ?? 'user@example.com';
  const password = profile?.password || DEFAULT_PASSWORD;
  const passwordSlots = password.split('').map(classifyPasswordChar);

  const assessment = useMemo(() => evaluatePassword(password, username, email), [password, username, email]);
  const lines = useMemo(() => buildBreachLines(username, email, assessment), [assessment, username, email]);

  const [visibleLines, setVisibleLines] = useState([]);
  const [phase, setPhase] = useState('breaching'); // 'breaching' | 'breached' | 'triage' | 'consequences'
  const [crackComplete, setCrackComplete] = useState(false);

  const [accounts, setAccounts] = useState(initialAccountState);
  const [vault, setVault] = useState({ active: false, memberIds: [], resolved: false, held: null });
  const [pickerAccountId, setPickerAccountId] = useState(null);
  const [recoveryAccountId, setRecoveryAccountId] = useState(null);
  const [activeMinigame, setActiveMinigame] = useState(null); // { kind, targetIds, round? }
  const [defenseUses, setDefenseUses] = useState({ twofa: 0, biometric: 0 });

  useEffect(() => {
    const timers = lines.map((line) =>
      setTimeout(() => setVisibleLines((prev) => [...prev, line]), line.delay)
    );
    const lastDelay = lines[lines.length - 1].delay;
    const t1 = setTimeout(() => setPhase('breached'), lastDelay + 800);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(t1);
    };
  }, []);

  // One round of Grover's amplification: every still-at-risk account NOT excluded
  // (i.e. not the one just being defended) climbs by its own rate, then is rolled
  // against that new percentage to see if the attacker measures it out right now.
  // Coupled accounts climb harder while their linked account sits stolen, and any
  // stolen-but-recoverable account left unattended racks up another round of decay
  // on its recovery window.
  function advanceRound(excludeIds) {
    setAccounts((prev) => {
      const next = { ...prev };
      for (const account of ACCOUNTS) {
        const s = prev[account.id];
        if (excludeIds.includes(account.id)) continue;

        if (s.status === 'atrisk') {
          const cascading = account.cascadeFrom && prev[account.cascadeFrom]?.status === 'stolen';
          const cascadeBonus = cascading ? Math.round(account.climbRate * CASCADE_BONUS_RATIO) : 0;
          const increased = Math.min(100, s.probability + account.climbRate + cascadeBonus);
          const stolen = Math.random() * 100 < curvedStealChance(increased);
          next[account.id] = stolen
            ? { ...s, probability: increased, status: 'stolen', roundsSinceStolen: 0 }
            : { ...s, probability: increased };
        } else if (s.status === 'stolen' && account.reversible && !s.recoveryUsed) {
          next[account.id] = { ...s, roundsSinceStolen: s.roundsSinceStolen + 1 };
        }
      }
      return next;
    });
  }

  const TERMINAL_STATUSES = ['safe', 'stolen', 'lockedout'];
  // A stolen account only counts as truly settled once its one recovery attempt (if it was
  // eligible for one) has been used — that's what holds the aftermath transition open long
  // enough for the player to actually take the recovery minigame.
  const allSettled = ACCOUNTS.every((a) => {
    const s = accounts[a.id];
    if (!TERMINAL_STATUSES.includes(s.status)) return false;
    if (s.status === 'stolen' && a.reversible) return s.recoveryUsed;
    return true;
  });
  const canFinishTriage =
    phase === 'triage' &&
    !activeMinigame &&
    !allSettled &&
    ACCOUNTS.every((a) => TERMINAL_STATUSES.includes(accounts[a.id].status));

  // Once every account has reached a terminal state, move on to the aftermath.
  useEffect(() => {
    if (phase !== 'triage' || activeMinigame) return;
    if (allSettled) {
      const t = setTimeout(() => setPhase('consequences'), 1200);
      return () => clearTimeout(t);
    }
  }, [phase, accounts, activeMinigame]);

  function openPicker(accountId) {
    if (accounts[accountId].status !== 'atrisk') return;
    setPickerAccountId(accountId);
  }
  function closePicker() {
    setPickerAccountId(null);
  }

  function openRecovery(accountId) {
    const s = accounts[accountId];
    const account = ACCOUNTS.find((a) => a.id === accountId);
    if (s.status !== 'stolen' || !account.reversible || s.recoveryUsed) return;
    setRecoveryAccountId(accountId);
  }
  function closeRecovery() {
    setRecoveryAccountId(null);
  }
  function attemptRecovery(accountId) {
    const round = accounts[accountId].roundsSinceStolen;
    advanceRound([accountId]);
    setRecoveryAccountId(null);
    setActiveMinigame({ kind: 'recovery', targetIds: [accountId], round });
  }
  function finishTriage() {
    setPhase('consequences');
  }

  function chooseSingleDefense(defenseId, accountId) {
    advanceRound([accountId]);
    if (DEFENSES[defenseId].maxUses != null) {
      setDefenseUses((u) => ({ ...u, [defenseId]: (u[defenseId] ?? 0) + 1 }));
    }
    setAccounts((prev) => ({
      ...prev,
      [accountId]: { ...prev[accountId], status: 'resolving', defense: defenseId },
    }));
    setPickerAccountId(null);
    setActiveMinigame({ kind: defenseId, targetIds: [accountId] });
  }

  function startVault(accountId) {
    advanceRound([accountId]);
    setVault({ active: true, memberIds: [accountId], resolved: false, held: null });
    setAccounts((prev) => ({
      ...prev,
      [accountId]: { ...prev[accountId], status: 'vaulted', defense: 'manager' },
    }));
    setPickerAccountId(null);
  }

  function addToVault(accountId) {
    // Assembling the vault is free — no round passes just from adding a member.
    setVault((v) => (v.memberIds.length >= DEFENSES.manager.maxTargets ? v : { ...v, memberIds: [...v.memberIds, accountId] }));
    setAccounts((prev) => ({
      ...prev,
      [accountId]: { ...prev[accountId], status: 'vaulted', defense: 'manager' },
    }));
    setPickerAccountId(null);
  }

  function sealVault() {
    advanceRound(vault.memberIds);
    setActiveMinigame({ kind: 'vault', targetIds: vault.memberIds });
  }

  function skipRound() {
    advanceRound([]);
    setPickerAccountId(null);
  }

  function handleMinigameFinish(holds) {
    const { kind, targetIds } = activeMinigame;
    setAccounts((prev) => {
      const next = { ...prev };
      for (const id of targetIds) {
        next[id] = {
          ...next[id],
          status: holds ? 'safe' : kind === 'biometric' ? 'lockedout' : 'stolen',
          recoveryUsed: kind === 'recovery' ? true : next[id].recoveryUsed,
          recovered: kind === 'recovery' && holds ? true : next[id].recovered,
        };
      }
      return next;
    });
    if (kind === 'vault') setVault((v) => ({ ...v, resolved: true, held: holds }));
    setActiveMinigame(null);
  }

  function resetTriage() {
    setAccounts(initialAccountState());
    setVault({ active: false, memberIds: [], resolved: false, held: null });
    setPickerAccountId(null);
    setRecoveryAccountId(null);
    setActiveMinigame(null);
    setDefenseUses({ twofa: 0, biometric: 0 });
    setPhase('triage');
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <AnimatePresence mode="wait">
        {phase === 'breaching' || phase === 'breached' ? (
          <motion.div
            key="breach"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 py-10"
          >
            <motion.div
              className="pointer-events-none fixed inset-0"
              animate={phase === 'breached' ? { opacity: [0, 0.18, 0.09] } : { opacity: 0 }}
              transition={{ duration: 1.5 }}
              style={{ background: 'radial-gradient(circle at 50% 40%, #dc2626 0%, transparent 70%)' }}
            />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-2xl"
            >
              <div className="mb-6 text-center">
                <p className="text-sm uppercase tracking-[0.35em] text-red-400/80">Mission 1 — Damage Control</p>
                <h1 className="mt-2 text-3xl font-bold text-white">A Quantum Attack Is Underway</h1>
                <p className="mt-2 text-slate-400">
                  Targeting <span className="text-cyan-300">{username}</span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-black/80 p-6 shadow-2xl shadow-black/60">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="ml-2 font-mono text-xs text-slate-500">quantum_attack.exe</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600"></span>
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
                    </div>

                    <AnimatePresence>
                      {crackComplete && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="mt-8"
                        >
                          <p className="mb-4 text-sm leading-relaxed text-slate-300">
                            You can't undo this. But the master password was only the front door — the attacker still
                            has to break into every account behind it, one at a time.
                          </p>
                          <button
                            onClick={() => setPhase('triage')}
                            className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                          >
                            Begin Damage Control
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : phase === 'triage' ? (
          <motion.div
            key="triage"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <TriageDashboard
              accounts={accounts}
              vault={vault}
              pickerAccountId={pickerAccountId}
              recoveryAccountId={recoveryAccountId}
              activeMinigame={activeMinigame}
              password={password}
              canFinishTriage={canFinishTriage}
              defenseUses={defenseUses}
              onOpenPicker={openPicker}
              onClosePicker={closePicker}
              onChooseSingle={chooseSingleDefense}
              onStartVault={startVault}
              onAddToVault={addToVault}
              onSealVault={sealVault}
              onSkipRound={skipRound}
              onOpenRecovery={openRecovery}
              onCloseRecovery={closeRecovery}
              onAttemptRecovery={attemptRecovery}
              onFinishTriage={finishTriage}
              onMinigameFinish={handleMinigameFinish}
            />
          </motion.div>
        ) : (
          <motion.div
            key="consequences"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <ConsequencesScreen accounts={accounts} onReplay={resetTriage} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default PasswordMission;
