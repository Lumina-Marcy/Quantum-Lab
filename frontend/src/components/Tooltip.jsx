import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

/** Hover/focus tooltip for inline glossary terms. */
function Tooltip({ label, definition, children }) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span
        tabIndex={0}
        role="button"
        className="cursor-help border-b border-dotted border-cyan-400/60 text-cyan-200 outline-none focus:text-cyan-100"
      >
        {children}
      </span>
      <AnimatePresence>
        {open && (
          <motion.span
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 rounded-lg border border-slate-700 bg-slate-900 p-3 text-left text-xs leading-relaxed text-slate-300 shadow-xl"
          >
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-cyan-300">{label}</span>
            <span className="mt-1 block">{definition}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default Tooltip;
