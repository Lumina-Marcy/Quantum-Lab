import { useState } from 'react';
import { motion } from 'framer-motion';
import Panel from '../components/Panel';
import Button from '../components/Button';
import Modal from '../components/Modal';
import SandboxCore from '../components/SandboxCore';
import SpaceBackdrop from '../components/SpaceBackdrop';

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-quantum-cyan" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-quantum-cyan" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
      <path d="M20 20l-4.3-4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-quantum-cyan" aria-hidden="true">
      <circle cx="5" cy="6" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="19" cy="18" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6.5 7.5C10 11 8 14 12 15.5s3 2.5 5 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const SIMULATIONS = [
  { key: 'encryption', icon: LockIcon, title: 'Encryption', copy: 'Watch a quantum attacker explore keys that would take classical computers millennia.' },
  { key: 'search', icon: SearchIcon, title: 'Search', copy: 'Compare classical and quantum search racing through the same maze of possibilities.' },
  { key: 'optimization', icon: RouteIcon, title: 'Optimization', copy: 'See quantum-inspired optimization untangle a route problem in real time.' },
];

function Sandbox() {
  const [hoveredCard, setHoveredCard] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <main className="relative isolate mx-auto max-w-5xl px-6 py-16">
      <SpaceBackdrop />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="text-center"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-quantum-cyan/80">Quantum Sandbox</p>
        <h1 className="mt-4 font-display text-4xl font-bold text-white sm:text-5xl">
          Experiment with the unseen logic of quantum computing.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-slate-400">
          Choose interactive simulations to explore how quantum behavior changes the way complex problems are solved.
        </p>
        {/* Upfront, not just revealed on click — this page is honest about its status the moment
            it loads; "Begin Experiment" below still opens the fuller modal as reinforcement. */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-1.5 text-xs font-medium text-amber-200/90">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
          Under construction — simulations are still being calibrated
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
        className="my-16 flex justify-center"
      >
        <SandboxCore boosted={hoveredCard} />
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-3">
        {SIMULATIONS.map(({ key, icon: Icon, title, copy }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 * i, ease: 'easeOut' }}
            onHoverStart={() => setHoveredCard(true)}
            onHoverEnd={() => setHoveredCard(false)}
            whileHover={{ y: -4 }}
          >
            <Panel className="h-full p-6 transition-colors duration-300 hover:border-quantum-cyan/40">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-quantum-cyan/30 bg-quantum-cyan/10">
                <Icon />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{copy}</p>
            </Panel>
          </motion.div>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <Button onClick={() => setModalOpen(true)} variant="primary">
          Begin Experiment
        </Button>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Still Calibrating">
        <p>Quantum Sandbox is currently under construction. Our simulations are still being calibrated. Check back soon.</p>
      </Modal>
    </main>
  );
}

export default Sandbox;
