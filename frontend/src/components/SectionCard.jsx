import { motion } from 'framer-motion';

function SectionCard({ title, description, path }) {
  return (
    <motion.article
      whileHover={{ y: -4 }}
      className="rounded-3xl border border-slate-700 bg-slate-900/80 p-6 shadow-xl shadow-slate-950/20"
    >
      <h2 className="text-2xl font-semibold text-cyan-300">{title}</h2>
      <p className="mt-3 text-slate-300">{description}</p>
      {path && (
        <a href={path} className="mt-4 inline-flex text-cyan-200 hover:text-cyan-100">
          Explore →
        </a>
      )}
    </motion.article>
  );
}

export default SectionCard;
