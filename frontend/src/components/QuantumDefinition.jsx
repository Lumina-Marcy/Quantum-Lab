import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Atom } from 'lucide-react';
import { GLOSSARY } from '../data/glossary';

const PANEL_WIDTH = 288;
const VIEWPORT_MARGIN = 12;
const GAP = 10;
const MIN_SPACE_ABOVE = 180;
const CLOSE_DELAY_MS = 120;

/**
 * The shared "instrument" tooltip for quantum vocabulary — hover or focus a highlighted term
 * anywhere in the app to get a definition panel, with an optional deeper "Learn More" expand.
 * Replaces the old Tooltip.jsx/GlossaryTerm.jsx pair.
 *
 * The panel is portaled to `document.body` rather than rendered inline: this component can
 * appear inside any of the app's many `motion.div`/`motion.span` entrance-animation wrappers,
 * and Framer Motion leaves an inline `transform` on those even at rest — which, per the CSS
 * spec, makes that ancestor the containing block for any `position: fixed` descendant instead
 * of the viewport. Portaling to `document.body` escapes that entirely. React's synthetic events
 * still bubble through the React tree (not the DOM tree) across a portal, so the hover/focus
 * wiring below works exactly as if the panel were still nested inline.
 */
function QuantumDefinition({ term, children }) {
  const entry = GLOSSARY[term];
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  function cancelClose() {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }

  function scheduleClose() {
    cancelClose();
    closeTimeoutRef.current = setTimeout(() => {
      setOpen(false);
      setExpanded(false);
    }, CLOSE_DELAY_MS);
  }

  function computeCoords() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const placement = rect.top >= MIN_SPACE_ABOVE ? 'top' : 'bottom';
    const idealLeft = rect.left + rect.width / 2 - PANEL_WIDTH / 2;
    const maxLeft = window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN;
    const left = Math.min(Math.max(idealLeft, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, maxLeft));
    const top = placement === 'top' ? rect.top - GAP : rect.bottom + GAP;
    setCoords({ top, left, placement });
  }

  function handleOpen() {
    cancelClose();
    computeCoords();
    setOpen(true);
  }

  // A small delay before actually closing means moving the pointer across the gap between the
  // trigger text and the floating panel (to click "Learn More", say) doesn't flicker-close it —
  // the panel's own onMouseEnter below cancels the pending close if the pointer lands there.
  function handleTriggerMouseLeave() {
    scheduleClose();
  }

  function handleBlur(e) {
    const next = e.relatedTarget;
    if (next && (triggerRef.current?.contains(next) || panelRef.current?.contains(next))) return;
    setOpen(false);
    setExpanded(false);
  }

  useEffect(() => cancelClose, []);

  useEffect(() => {
    if (!open) return;
    function onReposition() {
      computeCoords();
    }
    window.addEventListener('scroll', onReposition, true);
    window.addEventListener('resize', onReposition);
    return () => {
      window.removeEventListener('scroll', onReposition, true);
      window.removeEventListener('resize', onReposition);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!entry) return children ?? null;

  const Icon = entry.icon ?? Atom;

  return (
    <span
      ref={triggerRef}
      tabIndex={0}
      role="button"
      aria-describedby={open ? `qdef-${term}` : undefined}
      className="cursor-help border-b border-dotted border-cyan-400/60 text-cyan-200 outline-none focus:text-cyan-100"
      onMouseEnter={handleOpen}
      onMouseLeave={handleTriggerMouseLeave}
      onFocus={handleOpen}
      onBlur={handleBlur}
    >
      {children ?? entry.term}

      {coords &&
        createPortal(
          <span
            ref={panelRef}
            aria-hidden={!open}
            className="pointer-events-none fixed z-50"
            style={{
              top: coords.top,
              left: coords.left,
              width: PANEL_WIDTH,
              transform: coords.placement === 'top' ? 'translateY(-100%)' : undefined,
            }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <AnimatePresence>
              {open && (
                <motion.span
                  id={`qdef-${term}`}
                  role="tooltip"
                  initial={{ opacity: 0, scale: 0.96, y: coords.placement === 'top' ? 6 : -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: coords.placement === 'top' ? 6 : -6 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="pointer-events-auto block rounded-2xl border border-cyan-400/20 bg-slate-950/90 p-4 text-left shadow-2xl shadow-cyan-500/10 backdrop-blur-md"
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-cyan-300" strokeWidth={1.5} />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                      {entry.term}
                    </span>
                  </span>
                  <span className="mt-2 block text-xs leading-relaxed text-slate-300">{entry.definition}</span>

                  {entry.moreInfo && (
                    <>
                      <button
                        type="button"
                        onClick={() => setExpanded((v) => !v)}
                        className="mt-2 block text-[11px] font-medium text-cyan-400/80 hover:text-cyan-300"
                      >
                        {expanded ? 'Show less' : 'Learn more'}
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded && (
                          <motion.span
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className="mt-2 block overflow-hidden border-t border-white/[0.08] pt-2 text-xs leading-relaxed text-slate-400"
                          >
                            {entry.moreInfo}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </motion.span>
              )}
            </AnimatePresence>
          </span>,
          document.body
        )}
    </span>
  );
}

export default QuantumDefinition;
