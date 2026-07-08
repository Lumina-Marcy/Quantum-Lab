import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchLessons, groupByCategory } from '../data/lessonsApi';
import LessonCard from '../components/LessonCard';

function Resources() {
  const [groups, setGroups] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchLessons()
      .then((lessons) => setGroups(groupByCategory(lessons)))
      .catch(() => setError(true));
  }, []);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Resources</p>
        <h1 className="mt-2 text-4xl font-bold text-white sm:text-5xl">Mini Lessons</h1>
        <p className="mt-4 max-w-3xl text-lg text-slate-300">
          Short videos and reading to build up your quantum computing vocabulary — what a qubit is, the
          methods quantum computers use, and more.
        </p>
      </motion.div>

      {error && <p className="mt-8 text-slate-400">Couldn't load lessons. Is the backend running?</p>}

      {!error && !groups && <p className="mt-8 text-slate-400">Loading lessons…</p>}

      {groups?.map(({ category, lessons }) => (
        <section key={category} className="mt-12">
          <h2 className="text-2xl font-semibold text-cyan-200">{category}</h2>
          <div className="mt-4 grid gap-6 lg:grid-cols-2">
            {lessons.map((lesson) => (
              <LessonCard key={lesson.id} lesson={lesson} />
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

export default Resources;
