import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CubeIllustration from './CubeIllustration';

/** Horizontal Landing-page teaser for the Sandbox. */
function SandboxPreview() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-6xl rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900 to-indigo-950/40 px-6 py-14 sm:px-12"
    >
      <div className="flex flex-col items-center gap-10 lg:flex-row lg:justify-between">
        <div className="max-w-lg text-center lg:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80">Sandbox</p>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">Experiment Inside the Quantum Sandbox</h2>
          <p className="mt-4 text-slate-400">
            Run educational simulations to visualize how classical and quantum approaches differ.
          </p>
          <Link
            to="/sandbox"
            className="mt-6 inline-flex rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            Launch Sandbox
          </Link>
        </div>
        <CubeIllustration className="h-48 w-48 shrink-0 sm:h-56 sm:w-56" />
      </div>
    </motion.section>
  );
}

export default SandboxPreview;
