import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const FLOW_STEPS = [
  { icon: '🛡️', text: 'Make security decisions' },
  { icon: '💥', text: 'Watch a simulated breach' },
  { icon: '🧠', text: 'Learn why it happened' },
  { icon: '⚛️', text: 'Explore quantum concepts' },
];

/** Mission overview card: time/difficulty at a glance, the mission flow, and the Start CTA. */
function MissionPreviewCard({ mission, onStart, canStart }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20"
    >
      <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Mission 1</p>
      <h1 className="mt-4 text-4xl font-semibold text-white">{mission.title}</h1>
      <p className="mt-4 text-slate-300">{mission.summary}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-950/70 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Estimated Time</p>
          <p className="mt-1 text-lg font-semibold text-cyan-200">⏱ 5–7 minutes</p>
        </div>
        <div className="rounded-2xl bg-slate-950/70 p-5">
          <p className="text-xs uppercase tracking-wide text-slate-500">Difficulty</p>
          <p className="mt-1 text-lg font-semibold text-cyan-200">🟢 Beginner Friendly</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-950/70 p-6">
        <p className="text-xs uppercase tracking-wide text-slate-500">Mission Flow</p>
        <ul className="mt-3 space-y-2">
          {FLOW_STEPS.map((step) => (
            <li key={step.text} className="flex items-center gap-3 text-slate-200">
              <span aria-hidden="true">{step.icon}</span>
              {step.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <Link to="/" className="rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700">
          Back to Home
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={onStart}
            disabled={!canStart}
            className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-purple-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Start Mission →
          </button>
          {!canStart && <p className="text-sm text-slate-500">Secure your vault above to begin.</p>}
        </div>
      </div>
    </motion.div>
  );
}

export default MissionPreviewCard;
