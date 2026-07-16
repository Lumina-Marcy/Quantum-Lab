import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const VARIANTS = {
  primary: 'bg-quantum-gradient text-slate-950 shadow-glow-violet transition-shadow duration-300 hover:shadow-glow-cyan-lg',
  secondary:
    'border border-slate-600 text-slate-200 shadow-transparent transition-all duration-300 hover:border-quantum-cyan/60 hover:bg-quantum-cyan/5 hover:text-quantum-cyan hover:shadow-glow-cyan',
};

/**
 * Shared CTA primitive — renders a Link when given `to`, a <button> otherwise.
 * Wraps the same motion.div whileHover/whileTap pattern already used app-wide,
 * so it's a drop-in replacement rather than a new interaction model.
 */
function Button({ to, onClick, type = 'button', variant = 'primary', className = '', children }) {
  const classes = `inline-block rounded-full px-8 py-4 text-center font-semibold ${VARIANTS[variant]} ${className}`;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="inline-block"
    >
      {to ? (
        <Link to={to} className={classes}>
          {children}
        </Link>
      ) : (
        <button type={type} onClick={onClick} className={classes}>
          {children}
        </button>
      )}
    </motion.div>
  );
}

export default Button;
