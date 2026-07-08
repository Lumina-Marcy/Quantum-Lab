import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Network, Microscope, Database, Shield, Clock } from 'lucide-react';
import { STATUS_LABELS } from '../data/missions';

const MISSION_ICONS = { 1: Lock, 2: Network, 3: Microscope, 4: Database, 5: Shield };

/** One mission's preview card — always routes to /mission/:id; status is a badge only, never a block. */
function MissionCard({ mission, index = 0 }) {
  const isAvailable = mission.status === 'available';
  const Icon = MISSION_ICONS[mission.id] ?? Shield;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      whileHover={{ y: -6 }}
      className="group relative"
    >
      {isAvailable && (
        <motion.div
          aria-hidden="true"
          className="absolute -inset-px rounded-2xl bg-gradient-to-r from-purple-500/40 to-cyan-400/40 blur-sm"
          animate={{ opacity: [0.5, 0.9, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <Link
        to={`/mission/${mission.id}`}
        className={`relative flex h-full flex-col rounded-2xl border p-6 shadow-lg shadow-slate-950/20 transition-all duration-200 ${
          isAvailable
            ? 'border-cyan-400/50 bg-slate-900/90'
            : 'border-slate-700 bg-slate-900/80 group-hover:border-cyan-400/60 group-hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]'
        }`}
      >
        <div className="flex items-start justify-between">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/20 to-cyan-500/20 text-cyan-200">
            <Icon size={30} strokeWidth={1.5} />
          </span>
          <span
            className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              isAvailable ? 'bg-cyan-500/15 text-cyan-300' : 'bg-slate-700/50 text-slate-400'
            }`}
          >
            {STATUS_LABELS[mission.status]}
          </span>
        </div>

        <h3 className="mt-5 text-xl font-semibold text-white">{mission.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{mission.summary}</p>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock size={13} strokeWidth={1.75} />
            {mission.estimatedTime}
          </span>
          <span>{mission.difficulty}</span>
        </div>

        <span
          className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${
            isAvailable ? 'text-cyan-200' : 'text-cyan-300 group-hover:text-cyan-200'
          }`}
        >
          {isAvailable ? 'Start Here →' : 'Explore →'}
        </span>
      </Link>
    </motion.div>
  );
}

export default MissionCard;
