import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import MissionGrid from '../components/MissionGrid';

// Restyled mission-selection screen — same mission data/routing as before, new presentation.
function MissionHub() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80">Missions</p>
        <h1 className="mt-3 text-4xl font-bold text-white sm:text-5xl">Choose Your Mission</h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Every mission explores a real-world application of quantum computing.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-6 py-4 sm:flex-row"
      >
        <p className="text-sm text-slate-200">
          <span aria-hidden="true">✨</span> New here? Start with the Password Vault mission.
        </p>
        <Link
          to="/mission/1"
          className="rounded-full bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:bg-purple-400"
        >
          Start Mission
        </Link>
      </motion.div>

      <div className="mt-12">
        <MissionGrid />
      </div>
    </main>
  );
}

export default MissionHub;
