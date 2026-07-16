import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { fetchLessonById } from '../data/lessonsApi';
import { getInteractive } from '../components/interactives';

function ResourceDetail() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(undefined);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLesson(undefined);
    setError(false);
    fetchLessonById(id)
      .then(setLesson)
      .catch(() => setError(true));
  }, [id]);

  const Interactive = lesson && getInteractive(lesson.interactive);

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-slate-300">Couldn't load this lesson. Is the backend running?</p>
        <Link to="/resources" className="mt-4 inline-flex text-cyan-300 hover:text-cyan-200">
          ← Back to Resources
        </Link>
      </main>
    );
  }

  if (lesson === undefined) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-slate-400">Loading…</p>
      </main>
    );
  }

  if (lesson === null) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="text-slate-300">Lesson not found.</p>
        <Link to="/resources" className="mt-4 inline-flex text-cyan-300 hover:text-cyan-200">
          ← Back to Resources
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link to="/resources" className="text-sm text-cyan-300 hover:text-cyan-200">
        ← Back to Resources
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">{lesson.category}</p>
        <h1 className="mt-2 text-4xl font-semibold text-white">{lesson.title}</h1>
        <p className="mt-4 text-slate-300">{lesson.summary}</p>

        {Interactive && (
          <div className="mt-8 rounded-3xl border border-slate-700 bg-slate-900/80 p-8">
            <h2 className="text-center text-lg font-semibold text-white">Try it yourself</h2>
            <div className="mt-6">
              <Interactive />
            </div>
          </div>
        )}

        <div className="mt-8 aspect-video overflow-hidden rounded-3xl border border-slate-700 bg-slate-950">
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${lesson.videoId}`}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {lesson.links?.length > 0 && (
          <div className="mt-8 rounded-3xl border border-slate-700 bg-slate-900/80 p-6">
            <h2 className="text-lg font-semibold text-white">Further reading</h2>
            <ul className="mt-3 space-y-2">
              {lesson.links.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-300 hover:text-cyan-200"
                  >
                    {link.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </main>
  );
}

export default ResourceDetail;
