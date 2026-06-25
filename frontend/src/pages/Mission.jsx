import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const missionData = {
  1: {
    title: 'Password Vault',
    summary: 'Learn how encryption works and why quantum computing challenges current security systems.',
  },
  2: {
    title: 'Find the Exit',
    summary: 'Navigate a maze using both classical and quantum search strategies.',
  },
  3: {
    title: 'Lost Medical Breakthrough',
    summary: 'Search millions of molecular combinations to find a life-saving treatment.',
  },
  4: {
    title: 'The Supply Chain Crisis',
    summary: 'Optimize routes and deliveries through a complex logistics network.',
  },
};

function Mission() {
  const { id } = useParams();
  const mission = missionData[id] || missionData[1];

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Mission {id}</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">{mission.title}</h1>
        <p className="mt-4 text-slate-300">{mission.summary}</p>

        <div className="mt-8 space-y-4">
          <div className="rounded-2xl bg-slate-950/70 p-6">
            <h2 className="text-xl font-semibold text-cyan-200">1-Minute Interactive Experience</h2>
            <p className="mt-2 text-slate-300">Play through a scenario and make decisions that shape the outcome.</p>
          </div>
          <div className="rounded-2xl bg-slate-950/70 p-6">
            <h2 className="text-xl font-semibold text-cyan-200">Decision Point</h2>
            <p className="mt-2 text-slate-300">Choose strategies, then see consequences unfold in real time.</p>
          </div>
          <div className="rounded-2xl bg-slate-950/70 p-6">
            <h2 className="text-xl font-semibold text-cyan-200">How Did The Computer Think?</h2>
            <p className="mt-2 text-slate-300">Compare classical and quantum explanations side by side.</p>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/" className="rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700">
            Back to Home
          </Link>
          <button className="rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400">
            Start Mission
          </button>
        </div>
      </motion.div>
    </main>
  );
}

export default Mission;
