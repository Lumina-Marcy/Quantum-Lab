import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import QuantumNetwork from './QuantumNetwork';
import ProgressBar from './ProgressBar';

const MESSAGE_INTERVAL_MS = 1000;

/** Cycles through educational status messages alongside a pulsing node graph and progress bar. */
function QuantumVisualization({ messages, searchSpaceLabel, timeLabel }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (messageIndex >= messages.length - 1) return;
    const timer = setTimeout(() => setMessageIndex((i) => i + 1), MESSAGE_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [messageIndex, messages.length]);

  const progress = ((messageIndex + 1) / messages.length) * 100;

  return (
    <div className="flex h-full flex-col">
      <div className="relative h-48 overflow-hidden rounded-xl bg-slate-950/60 sm:h-56">
        <QuantumNetwork />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
      </div>

      <div className="mt-4 flex min-h-[1.75rem] items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={messageIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-center text-sm font-medium text-cyan-300"
          >
            {messages[messageIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-4">
        <ProgressBar value={progress} duration={0.5} gradient="from-cyan-500 to-purple-400" />
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-slate-500">Estimated Search Space</dt>
          <dd className="mt-1 font-mono text-cyan-200">{searchSpaceLabel}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Estimated Time</dt>
          <dd className="mt-1 font-mono text-cyan-200">{timeLabel}</dd>
        </div>
      </dl>
    </div>
  );
}

export default QuantumVisualization;
