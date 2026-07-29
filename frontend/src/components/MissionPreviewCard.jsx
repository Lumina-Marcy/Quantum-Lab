import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, Zap, Brain, Atom, Clock, Circle, FlaskConical, Sparkles, GitBranch, Lock } from 'lucide-react';
import Panel from './Panel';

// Each mission's actual flow — keyed by `mission.id` from data/missions.js. Previously this was a
// single hardcoded list (Password Vault's own flow) shown unconditionally for every mission,
// including ones whose gameplay looks nothing like "make security decisions / watch a breach."
const FLOW_STEPS_BY_MISSION = {
  1: [
    { icon: Atom, text: 'Assemble a candidate molecule' },
    { icon: FlaskConical, text: 'Test it the classical way — one at a time' },
    { icon: Sparkles, text: 'Watch quantum search explore millions at once' },
    { icon: Brain, text: 'See why the quantum approach wins' },
  ],
  2: [
    { icon: GitBranch, text: 'Split your qubit down every path at once' },
    { icon: Lock, text: 'Watch dead ends lock away for good' },
    { icon: Sparkles, text: 'Follow the winning path collapse into view' },
    { icon: Brain, text: 'See the quantum concepts behind it' },
  ],
  3: [
    { icon: ShieldAlert, text: 'Make security decisions' },
    { icon: Zap, text: 'Watch a simulated breach' },
    { icon: Brain, text: 'Learn why it happened' },
    { icon: Atom, text: 'Explore quantum concepts' },
  ],
};

const DIFFICULTY_COLORS = { Beginner: 'text-emerald-400', Intermediate: 'text-amber-400', Advanced: 'text-red-400' };

/** Mission overview card: time/difficulty at a glance, the mission flow, and the Start CTA. Only
 * the outer shell is a bordered `Panel` — a preview card genuinely earns that boundary; the
 * metadata and flow steps inside read through typography and spacing, not nested boxes. */
function MissionPreviewCard({ mission, onStart, canStart, lockedMessage = 'Secure your vault above to begin.' }) {
  const flowSteps = FLOW_STEPS_BY_MISSION[mission.id] || [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <Panel className="p-8">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Mission {mission.id}</p>
        <h1 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">{mission.title}</h1>
        <p className="mt-4 text-slate-300">{mission.summary}</p>

        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-slate-800 pt-6 text-sm">
          <span className="flex items-center gap-2 text-slate-300">
            <Clock className="h-4 w-4 text-quantum-cyan" /> {mission.estimatedTime}
          </span>
          <span className="flex items-center gap-2 text-slate-300">
            <Circle className={`h-2.5 w-2.5 fill-current ${DIFFICULTY_COLORS[mission.difficulty] ?? 'text-emerald-400'}`} />
            {mission.difficulty}
          </span>
        </div>

        {flowSteps.length > 0 && (
          <div className="mt-6 border-t border-slate-800 pt-6">
            <p className="text-xs uppercase tracking-wide text-slate-500">Mission Flow</p>
            <ul className="mt-3 space-y-2.5">
              {flowSteps.map((step) => (
                <li key={step.text} className="flex items-center gap-3 text-slate-200">
                  <step.icon aria-hidden="true" className="h-4 w-4 text-quantum-cyan" />
                  {step.text}
                </li>
              ))}
            </ul>
          </div>
        )}

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
            {!canStart && <p className="text-sm text-slate-500">{lockedMessage}</p>}
          </div>
        </div>
      </Panel>
    </motion.div>
  );
}

export default MissionPreviewCard;
