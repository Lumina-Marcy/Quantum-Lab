import { motion } from 'framer-motion';

/** A pulse of light traveling down a thin beam — used above and below the divider text. */
function EnergyBeam({ delay = 0 }) {
  return (
    <div className="relative h-12 w-px overflow-hidden bg-gradient-to-b from-transparent via-quantum-cyan/30 to-transparent">
      <motion.span
        className="absolute left-1/2 h-3 w-px -translate-x-1/2 bg-quantum-cyan"
        animate={{ top: ['-10%', '110%'], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay }}
      />
    </div>
  );
}

/**
 * Short connective line between scenes. The beams thread the section above into the text into
 * the section below, so the page reads as one continuous descent rather than stacked blocks.
 */
function NarrativeDivider({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.6 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="mx-auto flex max-w-2xl flex-col items-center px-6 py-16 text-center"
    >
      <EnergyBeam />
      <p
        className="my-6 text-lg italic text-slate-400 sm:text-xl"
        style={{ textShadow: '0 2px 20px rgba(5, 8, 22, 0.9)' }}
      >
        {children}
      </p>
      <EnergyBeam delay={1.2} />
    </motion.div>
  );
}

export default NarrativeDivider;
