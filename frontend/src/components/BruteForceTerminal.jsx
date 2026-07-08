import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { generateCandidateSequence } from '../utils/bruteForce';

// Pacing decelerates as candidates approach the end so the "close calls" right
// before the match feel slower and more deliberate than the initial flurry.
function buildScript(candidates) {
  const steps = [];
  candidates.forEach((candidate, i) => {
    const fraction = candidates.length > 1 ? i / (candidates.length - 1) : 1;
    const delay = i === 0 ? 500 : Math.round(70 + fraction * fraction * 380);
    steps.push({ text: candidate.text, cls: 'text-green-400', delay });
    if (!candidate.isMatch) {
      steps.push({ text: '✗ No match', cls: 'text-red-400/70', delay: 90 });
    }
  });
  steps.push({ text: '...', cls: 'text-slate-600', delay: 500 });
  steps.push({ text: 'Comparing hashes...', cls: 'text-green-400', delay: 500 });
  steps.push({ text: 'Verifying...', cls: 'text-green-400', delay: 700 });
  steps.push({ text: 'Match Found.', cls: 'text-emerald-300 font-bold tracking-wide', delay: 1000 });
  return steps;
}

/**
 * Simulates a classical brute-force password search: a flurry of misses that
 * decelerate into a suspenseful hash-check sequence, ending in "Match Found."
 */
function BruteForceTerminal({ password, onProgress, onComplete }) {
  const steps = useMemo(() => buildScript(generateCandidateSequence(password)), [password]);
  const [visibleLines, setVisibleLines] = useState([]);
  const [done, setDone] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let index = 0;
    let timeoutId;
    setVisibleLines([]);
    setDone(false);

    function step() {
      if (cancelled) return;
      if (index >= steps.length) {
        setDone(true);
        onComplete?.();
        return;
      }
      const current = steps[index];
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        setVisibleLines((prev) => [...prev, { ...current, key: index }]);
        onProgress?.((index + 1) / steps.length);
        index += 1;
        step();
      }, current.delay);
    }

    step();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [visibleLines]);

  return (
    <motion.div
      animate={{ opacity: [1, 0.97, 1, 0.985, 1] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
      className="rounded-xl border border-slate-800 bg-black/70 p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <span className="ml-2 font-mono text-[11px] text-slate-500">classical_search.exe</span>
      </div>
      <div ref={scrollRef} className="h-40 space-y-1 overflow-y-auto pr-1 font-mono text-sm leading-6">
        {visibleLines.map((line, i) => (
          <p key={line.key} className={line.cls}>
            {line.text}
            {!done && i === visibleLines.length - 1 && (
              <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
                className="ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-green-400 align-middle"
              />
            )}
          </p>
        ))}
      </div>
    </motion.div>
  );
}

export default BruteForceTerminal;
