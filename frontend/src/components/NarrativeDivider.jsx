import { motion } from 'framer-motion';

/** Short connective line between sections so the page reads as one story, not stacked blocks. */
function NarrativeDivider({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.8 }}
      className="mx-auto max-w-2xl px-6 py-16 text-center"
    >
      <p className="text-lg italic text-slate-500 sm:text-xl">{children}</p>
    </motion.div>
  );
}

export default NarrativeDivider;
