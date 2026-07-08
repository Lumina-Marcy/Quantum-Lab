import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ComparisonPanel from '../components/ComparisonPanel';
import ComparisonDivider from '../components/ComparisonDivider';
import BruteForceTerminal from '../components/BruteForceTerminal';
import BreachReveal from '../components/BreachReveal';
import QuantumVisualization from '../components/QuantumVisualization';
import ProgressBar from '../components/ProgressBar';
import KeyTakeaway from '../components/KeyTakeaway';
import { useMission } from '../context/MissionContext';
import { randomClassicalDuration, randomQuantumDuration } from '../utils/timing';
import {
  CLASSICAL_SEARCH_SPACE_LABEL,
  QUANTUM_MESSAGES,
  QUANTUM_SEARCH_SPACE_LABEL,
  KEY_TAKEAWAY_POINTS,
  GROVER_NOTE,
  buildBreachItems,
} from '../data/learnWhyData';

// Screen 5 — side-by-side comparison of classical vs. quantum search strategies.
function LearnWhy() {
  const navigate = useNavigate();
  const { vault } = useMission();
  const password = vault?.password || 'game';
  const username = vault?.username || 'agent_42';
  const email = vault?.email || 'user@example.com';

  const [classicalProgress, setClassicalProgress] = useState(0);
  const [breached, setBreached] = useState(false);
  const [classicalTime] = useState(randomClassicalDuration);
  const [quantumTime] = useState(randomQuantumDuration);
  const [breachItems] = useState(() =>
    buildBreachItems({
      email,
      fullName: vault?.fullName,
      address: vault?.address,
      bankName: vault?.bankName,
      accountNumber: vault?.accountNumber,
    }),
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className="text-sm uppercase tracking-[0.35em] text-purple-300/80">Mission 1 — Password Vault</p>
        <h1 className="mt-3 text-4xl font-bold text-white">Learn Why It Happened</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-400">
          Compare how a classical computer searches versus how a quantum algorithm approaches the same problem.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_auto_1fr] lg:items-stretch">
        <ComparisonPanel eyebrow="The Normal Way" title="Classical Search" accent="green">
          <BruteForceTerminal
            password={password}
            onProgress={(p) => setClassicalProgress(p * 100)}
            onComplete={() => setBreached(true)}
          />

          <div className="mt-5 space-y-4">
            <ProgressBar value={classicalProgress} duration={0.3} gradient="from-emerald-500 to-emerald-300" />
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Search Space</dt>
                <dd className="mt-1 font-mono text-emerald-200">{CLASSICAL_SEARCH_SPACE_LABEL}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Time</dt>
                <dd className="mt-1 font-mono text-emerald-200">{classicalTime.label}</dd>
              </div>
            </dl>
          </div>
        </ComparisonPanel>

        <ComparisonDivider />

        <ComparisonPanel eyebrow="The Quantum Way" title="Quantum Search" accent="cyan">
          <QuantumVisualization
            messages={QUANTUM_MESSAGES}
            searchSpaceLabel={QUANTUM_SEARCH_SPACE_LABEL}
            timeLabel={quantumTime.label}
          />
          <p className="mt-5 border-t border-slate-800 pt-4 text-xs italic leading-relaxed text-slate-500">
            {GROVER_NOTE}
          </p>
        </ComparisonPanel>
      </div>

      <AnimatePresence>
        {breached && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mt-8 rounded-2xl border border-red-500/50 bg-red-950/30 p-6"
          >
            <p className="text-center text-xs uppercase tracking-[0.3em] text-red-400">Breach Report</p>
            <h2 className="mt-2 text-center text-2xl font-bold text-red-200">PASSWORD COMPROMISED</h2>
            <div className="mx-auto mt-6 max-w-md">
              <BreachReveal items={breachItems} />
            </div>
            <p className="mt-6 text-center text-xs text-slate-500">
              Targeting <span className="text-cyan-300">{username}</span> — a reminder that a compromised password
              rarely stays isolated.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-8 flex justify-center lg:justify-end">
        <div className="w-full lg:max-w-md">
          <KeyTakeaway points={KEY_TAKEAWAY_POINTS} />
        </div>
      </div>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/mission/1')}
          className="rounded-full bg-slate-800 px-6 py-3 text-slate-200 transition-colors hover:bg-slate-700"
        >
          Continue
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/mission/1/visualize')}
          className="rounded-full bg-purple-500 px-6 py-3 font-semibold text-white shadow-lg shadow-purple-500/30 transition-colors hover:bg-purple-400"
        >
          Next →
        </motion.button>
      </div>
    </main>
  );
}

export default LearnWhy;
