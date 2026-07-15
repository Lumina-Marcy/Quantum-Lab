import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function LessonCard({ lesson }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">{lesson.category}</p>
      <h3 className="mt-2 text-xl font-semibold text-white">{lesson.title}</h3>
      <p className="mt-3 text-slate-300">{lesson.summary}</p>
      <Link
        to={`/resources/${lesson.id}`}
        className="mt-4 inline-flex text-cyan-200 hover:text-cyan-100"
      >
        Watch & learn →
      </Link>
    </motion.article>
  );
}

export default LessonCard;
