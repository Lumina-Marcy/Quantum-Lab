import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SectionCard from '../components/SectionCard';
import SignUpForm from '../components/SignUpForm';

const missions = [
  { id: '1', title: 'Password Vault', description: 'Learn how encryption works and why quantum computing challenges current security systems.' },
  { id: '2', title: 'Find the Exit', description: 'Navigate a maze using both classical and quantum search strategies.' },
  { id: '3', title: 'Lost Medical Breakthrough', description: 'Search millions of molecular combinations to find a life-saving treatment.' },
  { id: '4', title: 'The Supply Chain Crisis', description: 'Optimize routes and deliveries through a complex logistics network.' },
];

function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="space-y-6 text-center">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Quantum Lab
        </motion.h1>
        <p className="mx-auto max-w-3xl text-lg leading-8 text-slate-300">
          Experience the future of problem solving with interactive missions that show how quantum and classical computers think differently.
        </p>
      </section>

      <section className="mt-12 grid gap-6 lg:grid-cols-2">
        {missions.map((mission) => (
          <SectionCard
            key={mission.id}
            title={mission.title}
            description={mission.description}
            path={`/mission/${mission.id}`}
          />
        ))}
      </section>

      <section className="mt-14 rounded-3xl border border-slate-700 bg-slate-900/80 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Sandbox</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Try the quantum sandbox</h2>
            <p className="mt-3 text-slate-300">Explore simulations in encryption, search, and optimization without writing any code.</p>
          </div>
          <Link
            to="/sandbox"
            className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Launch Sandbox
          </Link>
        </div>
      </section>

      <SignUpForm />
    </main>
  );
}

export default Home;
