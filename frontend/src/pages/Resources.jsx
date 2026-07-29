import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Atom, Binary, Network, Radio, Search, ToggleLeft, Waves } from 'lucide-react';
import { fetchLessons, groupByCategory } from '../data/lessonsApi';
import QuantumCore from '../components/QuantumCore';

const INTERACTIVE_ICONS = {
  'bloch-sphere': Atom,
  entanglement: Network,
  grovers: Search,
  shors: Binary,
  'wave-superposition': Waves,
  'quantum-gates': ToggleLeft,
  interference: Radio,
};

function moduleNumber(index) {
  return String(index + 1).padStart(2, '0');
}

function LessonRow({ lesson }) {
  const Icon = INTERACTIVE_ICONS[lesson.interactive] ?? Atom;
  return (
    <Link
      to={`/resources/${lesson.id}`}
      className="group flex items-center gap-4 py-5 transition-colors hover:bg-white/[0.02]"
    >
      <Icon className="h-5 w-5 shrink-0 text-quantum-cyan" strokeWidth={1.5} />
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-white">{lesson.title}</h3>
        <p className="mt-1 truncate text-sm text-slate-400">{lesson.summary}</p>
      </div>
      <ArrowRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-1 group-hover:text-cyan-300" />
    </Link>
  );
}

function Resources() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchLessons()
      .then((lessons) => setGroups(groupByCategory(lessons).sort((a, b) => a.category.localeCompare(b.category))))
      .catch(() => setError(true));
  }, []);

  return (
    <main className="min-h-screen bg-transparent">
      <div className="flex items-center justify-center gap-4 border-b border-white/[0.06] py-6">
        <QuantumCore stage="alive" className="h-14 w-14" particleCount={10} />
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Research Wing</span>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-14">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">The Research Wing</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">Discover Through Experimentation</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-400">
            Every module pairs a short idea with a live experiment — watch a concept happen before you read about it.
          </p>
        </motion.div>

        {error && <p className="mt-12 text-center text-slate-400">Couldn't load lessons. Is the backend running?</p>}
        {!error && !groups && <p className="mt-12 text-center text-slate-400">Loading…</p>}

        {groups?.map(({ category, lessons }, index) => (
          <motion.section
            key={category}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className="mt-14"
          >
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-400/70">
              Research Module {moduleNumber(index)}
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold text-white">{category}</h2>
            <div className="mt-2 divide-y divide-white/[0.06] border-t border-white/[0.06]">
              {lessons.map((lesson) => (
                <LessonRow key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </motion.section>
        ))}
      </div>
    </main>
  );
}

export default Resources;
