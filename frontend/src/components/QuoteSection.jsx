import { motion } from 'framer-motion';

/** Closing fade-in quote for the Landing page. */
function QuoteSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="mx-auto max-w-3xl px-6 py-20 text-center"
    >
      <p className="text-2xl font-medium italic leading-relaxed text-slate-200 sm:text-3xl">
        "The best way to prepare for the future is to understand it."
      </p>
      <p className="mt-4 text-sm uppercase tracking-[0.3em] text-slate-500">— Quantum Lab</p>
    </motion.section>
  );
}

export default QuoteSection;
