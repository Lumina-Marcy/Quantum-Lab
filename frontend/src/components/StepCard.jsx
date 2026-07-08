import { motion } from 'framer-motion';

/** Small numbered card used for algorithm steps; highlights when `active`. */
function StepCard({ number, title, description, active = false }) {
  return (
    <motion.div
      animate={{
        borderColor: active ? 'rgba(168,85,247,0.6)' : 'rgba(51,65,85,0.6)',
        backgroundColor: active ? 'rgba(88,28,135,0.25)' : 'rgba(15,23,42,0.6)',
      }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border p-4"
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
            active ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
          }`}
        >
          {number}
        </span>
        <p className={`text-xs font-semibold uppercase tracking-wide ${active ? 'text-purple-300' : 'text-slate-500'}`}>
          Step {number}
        </p>
      </div>
      <h4 className="mt-2 text-sm font-semibold text-white">{title}</h4>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>
    </motion.div>
  );
}

export default StepCard;
