import { motion } from 'framer-motion';

const containerVariants = (stagger) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger } },
});

const lineVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

/**
 * Reveals a list of lines one at a time — fade + slight upward drift, no typewriter
 * animation — via Framer Motion's staggerChildren rather than a hand-rolled timer chain.
 * Reused by BootSequence (scroll-triggered, `active` omitted) and per-mission hover
 * overlays (`active` passed as the card's own hover state) so this one primitive covers both.
 * `onComplete` fires once the last line has actually finished revealing — BootSequence uses this
 * to fire a real, causal "system ready" signal rather than approximating it via scroll position.
 */
function SequentialLines({ lines, showCursor = false, stagger = 0.55, active, className = '', lineClassName = '', onComplete }) {
  const isControlled = typeof active === 'boolean';
  const triggerProps = isControlled
    ? { animate: active ? 'visible' : 'hidden' }
    : { whileInView: 'visible', viewport: { once: true, amount: 0.6 } };

  return (
    <motion.div
      initial="hidden"
      {...triggerProps}
      variants={containerVariants(stagger)}
      className={className}
      onAnimationComplete={(definition) => {
        if (definition === 'visible') onComplete?.();
      }}
    >
      {lines.map((text, i) => (
        <motion.p key={i} variants={lineVariants} className={lineClassName}>
          {text}
          {showCursor && i === lines.length - 1 && (
            <motion.span
              animate={{ opacity: [1, 0.2] }}
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 0.9, ease: 'easeInOut' }}
              className="ml-1 inline-block h-[1em] w-[0.5em] translate-y-[0.1em] bg-current align-middle"
            />
          )}
        </motion.p>
      ))}
    </motion.div>
  );
}

export default SequentialLines;
