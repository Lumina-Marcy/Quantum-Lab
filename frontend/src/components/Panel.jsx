/**
 * Shared card/panel shell — the rounded-border-shadow treatment repeated by hand
 * across MissionCard, ComparisonPanel, etc. `as` lets callers render
 * it as a `Link` or other element when the whole panel needs to be interactive.
 */
function Panel({ as: As = 'div', className = '', children, ...rest }) {
  return (
    <As
      className={`rounded-2xl border border-white/[0.08] bg-white/[0.03] shadow-xl shadow-black/20 backdrop-blur-sm ${className}`}
      {...rest}
    >
      {children}
    </As>
  );
}

export default Panel;
