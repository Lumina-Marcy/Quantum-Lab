import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const ACTION_DURATION_MS = 850;
const GAP_MS = 450;

/**
 * Reveals a breach log one item at a time — an action label pulses, then resolves
 * into a checkmarked result — so compromised data feels like it's unfolding, not dumped.
 */
function BreachReveal({ items, onComplete }) {
  const [stage, setStage] = useState(0);
  const [completedIds, setCompletedIds] = useState([]);

  useEffect(() => {
    if (stage >= items.length) {
      onComplete?.();
      return undefined;
    }
    let doneTimer;
    const actionTimer = setTimeout(() => {
      setCompletedIds((prev) => [...prev, items[stage].id]);
      doneTimer = setTimeout(() => setStage((s) => s + 1), GAP_MS);
    }, ACTION_DURATION_MS);

    return () => {
      clearTimeout(actionTimer);
      clearTimeout(doneTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, items.length]);

  return (
    <div className="space-y-3 font-mono text-sm">
      {items.slice(0, stage + 1).map((item, i) => {
        const isDone = completedIds.includes(item.id);
        return (
          <div key={item.id} className="min-h-[1.5rem]">
            <AnimatePresence mode="wait">
              {!isDone ? (
                <motion.p
                  key="action"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="text-slate-400"
                >
                  {item.actionLabel}
                </motion.p>
              ) : (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, scale: 0.96, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.35 }}
                  className="flex flex-wrap items-baseline gap-2"
                >
                  <span className="text-emerald-400">✓</span>
                  <span className="text-red-300">{item.resultLabel}</span>
                  {item.value && <span className="text-slate-500">— {item.value}</span>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export default BreachReveal;
