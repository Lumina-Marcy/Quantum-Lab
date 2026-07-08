import { motion } from 'framer-motion';

/** Terminal-styled lead-in to the mission grid — same visual language as BruteForceTerminal. */
function SystemReadyBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-2xl text-center"
    >
      <p className="flex items-center justify-center gap-1 font-mono text-sm uppercase tracking-[0.3em] text-emerald-400">
        System Ready
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ repeat: Infinity, duration: 0.7 }}
          className="inline-block h-4 w-2 bg-emerald-400"
        />
      </p>
      <p className="mt-4 text-lg text-slate-300">Quantum computers are changing cybersecurity.</p>
      <p className="text-slate-400">Select your first mission.</p>
    </motion.div>
  );
}

export default SystemReadyBanner;
