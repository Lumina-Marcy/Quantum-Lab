import { motion } from 'framer-motion';

/**
 * The first beat after the awakening — distinct from `QuantumExplainer.jsx` (which teaches
 * quantum *concepts*): this one explains why Quantum Lab itself exists. Short and text-led on
 * purpose — the concept walkthrough right after this is where the visuals/interactivity live;
 * this section's whole job is a single, inspiring reframe before that begins.
 */
function WhyQuantumLab() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-quantum-cyan/70">Why Quantum Lab Exists</p>
        <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">
          Headlines mention quantum computing. Almost nothing explains it.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
          Quantum Lab turns impossible-sounding ideas — encryption, algorithms, probability, the
          future of computation — into experiences you can actually explore. Not another article
          to read. Something to feel.
        </p>
      </motion.div>
    </section>
  );
}

export default WhyQuantumLab;
