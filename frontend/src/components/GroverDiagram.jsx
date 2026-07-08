import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const STAGES = ['Initialize', 'Oracle', 'Amplify', 'Measure'];
const INTERVAL_MS = 1200;

/** Small looping 4-box flow diagram illustrating the shape of a Grover search, no math required. */
function GroverDiagram() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((i) => (i + 1) % STAGES.length), INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-between gap-2">
      {STAGES.map((stage, i) => (
        <div key={stage} className="flex flex-1 items-center gap-2">
          <motion.div
            animate={{
              borderColor: active === i ? 'rgba(34,211,238,0.7)' : 'rgba(51,65,85,0.6)',
              backgroundColor: active === i ? 'rgba(8,145,178,0.25)' : 'rgba(15,23,42,0.6)',
              scale: active === i ? 1.05 : 1,
            }}
            transition={{ duration: 0.4 }}
            className="flex-1 rounded-lg border p-3 text-center"
          >
            <p className={`text-xs font-semibold ${active === i ? 'text-cyan-200' : 'text-slate-400'}`}>{stage}</p>
          </motion.div>
          {i < STAGES.length - 1 && <span className="text-slate-600">→</span>}
        </div>
      ))}
    </div>
  );
}

export default GroverDiagram;
