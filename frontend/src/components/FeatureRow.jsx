import { motion } from 'framer-motion';

/** Un-boxed icon + title + description row — the editorial alternative to a feature card. */
function FeatureRow({ icon: Icon, title, description, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      className="flex items-start gap-4 border-b border-slate-800/60 py-6 last:border-b-0"
    >
      <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-1 text-slate-400">{description}</p>
      </div>
    </motion.div>
  );
}

export default FeatureRow;
