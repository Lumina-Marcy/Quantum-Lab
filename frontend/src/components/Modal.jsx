import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * A small glass-panel modal — the "elegant modal, not a browser alert or placeholder page"
 * treatment for moments like Sandbox's "under construction" notice. Backdrop click and Escape
 * both close it; kept generic (no variants, no portal) since the only current caller needs
 * exactly this.
 */
function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-6 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-white/10 bg-quantum-panel/90 p-8 text-center shadow-xl shadow-black/40 backdrop-blur-md"
          >
            {title && <h3 className="font-display text-xl font-semibold text-white">{title}</h3>}
            <div className="mt-3 text-slate-400">{children}</div>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 rounded-full border border-slate-600 px-6 py-2.5 text-sm font-semibold text-slate-200 transition-colors duration-300 hover:border-quantum-cyan/60 hover:text-quantum-cyan"
            >
              Got it
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Modal;
