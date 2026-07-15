import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Zap, Atom, Brain } from 'lucide-react';
import PortalIllustration from './PortalIllustration';

const STATS = [
  { icon: BookOpen, label: 'Interactive Stories' },
  { icon: Zap, label: 'Real Consequences' },
  { icon: Atom, label: 'Quantum Simulations' },
  { icon: Brain, label: 'Build Knowledge' },
];

/** Landing page hero: logo, headline, CTAs, and the animated portal illustration. */
function HeroSection() {
  return (
    <section className="mx-auto flex max-w-6xl flex-col items-center gap-16 px-6 pb-16 pt-20 lg:flex-row lg:pt-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-xl text-center lg:text-left"
      >
        <p className="text-lg font-semibold tracking-tight text-white">⚛ Quantum Lab</p>
        <h1 className="mt-8 text-5xl font-bold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Experience How Quantum Computers Think Differently
        </h1>
        <p className="mt-8 max-w-lg text-lg leading-relaxed text-slate-400">
          Explore interactive missions, make real decisions, and discover how emerging quantum technology could
          reshape cybersecurity and everyday life.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/missions"
              className="inline-block rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-8 py-4 font-semibold text-slate-950 shadow-[0_0_25px_rgba(168,85,247,0.35)] transition-shadow duration-300 hover:shadow-[0_0_40px_rgba(34,211,238,0.45)]"
            >
              Start Your Journey
            </Link>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/sandbox"
              className="inline-block rounded-full border border-slate-600 px-8 py-4 font-semibold text-slate-200 transition-colors duration-300 hover:border-cyan-400/60 hover:bg-cyan-400/5 hover:text-cyan-200"
            >
              Explore Sandbox
            </Link>
          </motion.div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs text-slate-500 lg:justify-start">
          {STATS.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2">
              <Icon size={15} strokeWidth={1.75} className="text-slate-500" />
              {label}
            </span>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="shrink-0"
      >
        <PortalIllustration className="h-64 w-64 sm:h-80 sm:w-80" />
      </motion.div>
    </section>
  );
}

export default HeroSection;
