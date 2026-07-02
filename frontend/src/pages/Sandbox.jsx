import { motion } from 'framer-motion';

const sandboxOptions = [
  { title: 'Encryption', description: 'Simulate how classical and quantum attackers explore keys.' },
  { title: 'Search', description: 'Compare classical and quantum search behavior in a maze.' },
  { title: 'Optimization', description: 'See how quantum-inspired optimization finds better routes.' },
];

function Sandbox() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/20">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-200/80">Quantum Sandbox</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Experiment with the unseen logic of quantum computing</h1>
        <p className="mt-4 text-slate-300">Choose a simulation and explore how quantum behavior changes the way problems are solved.</p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {sandboxOptions.map((option) => (
            <div key={option.title} className="rounded-3xl border border-slate-700 bg-slate-950/80 p-6 text-slate-200">
              <h2 className="text-2xl font-semibold text-cyan-300">{option.title}</h2>
              <p className="mt-3 text-slate-400">{option.description}</p>
            </div>
          ))}
        </div>
      </motion.section>
    </main>
  );
}

export default Sandbox;
