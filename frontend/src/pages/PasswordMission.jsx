import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const buildLines = (username, email) => [
  { id: 1, delay: 500,  text: '> Initializing Grover\'s Algorithm...', cls: 'text-green-400' },
  { id: 2, delay: 1700, text: '> Generating quantum superposition across 2¹²⁸ password states...', cls: 'text-green-400' },
  { id: 3, delay: 3100, text: `> Target acquired: ${username} — ${email}`, cls: 'text-yellow-300' },
  { id: 4, delay: 4400, text: '> Running quantum interference amplification...', cls: 'text-green-400' },
  { id: 5, delay: 5700, text: '> Wavefunction collapsed — password hash isolated...', cls: 'text-green-400' },
  { id: 6, delay: 6800, text: '> Entropy check: INSUFFICIENT FOR QUANTUM RESISTANCE', cls: 'text-orange-400' },
  { id: 7, delay: 7800, text: '█████████ BREACH SUCCESSFUL — CREDENTIALS EXPOSED █████████', cls: 'text-red-400 font-bold tracking-wider' },
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

function DefenseCard({ option }) {
  return (
    <motion.div
      initial="idle"
      whileHover="hovered"
      className="relative flex flex-col rounded-2xl border border-slate-700 bg-slate-900/80 p-6 cursor-default select-none"
    >
      <span className="text-4xl">{option.icon}</span>
      <h3 className="mt-3 text-lg font-semibold text-white">{option.title}</h3>
      <p className="mt-1 text-xs text-slate-500">Hover to learn more</p>

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

      <motion.div
        variants={{ idle: { opacity: 0 }, hovered: { opacity: 1 } }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.12)]"
      />
    </motion.div>
  );
}

function PasswordMission() {
  const { state: profile } = useLocation();
  const username = profile?.username ?? 'agent_42';
  const email    = profile?.email    ?? 'user@example.com';

  const lines = buildLines(username, email);

  const [visibleLines, setVisibleLines] = useState([]);
  const [phase, setPhase] = useState('breaching'); // 'breaching' | 'breached' | 'defending'

  useEffect(() => {
    const timers = lines.map((line) =>
      setTimeout(() => setVisibleLines((prev) => [...prev, line]), line.delay)
    );

    const lastDelay = lines[lines.length - 1].delay;

    const t1 = setTimeout(() => setPhase('breached'),  lastDelay + 800);
    const t2 = setTimeout(() => setPhase('defending'), lastDelay + 2800);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950">
      <AnimatePresence mode="wait">
        {phase !== 'defending' ? (
          <motion.div
            key="breach"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 py-10"
          >
            {/* Red ambient glow after breach */}
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
                <p className="text-sm uppercase tracking-[0.35em] text-red-400/80">Mission 1 — Password Vault</p>
                <h1 className="mt-2 text-3xl font-bold text-white">A Quantum Attack Is Underway</h1>
                <p className="mt-2 text-slate-400">
                  Targeting <span className="text-cyan-300">{username}</span>
                </p>
              </div>

              {/* Terminal window */}
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
                      <div>
                        <p className="text-slate-500 mb-1">Password</p>
                        <p className="text-red-300 font-bold">CRACKED</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : (
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
                Your password alone is no longer enough. Here are three strategies that stay secure even against quantum computing.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {DEFENSE_OPTIONS.map((option) => (
                <DefenseCard key={option.id} option={option} />
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
        )}
      </AnimatePresence>
    </main>
  );
}

export default PasswordMission;
