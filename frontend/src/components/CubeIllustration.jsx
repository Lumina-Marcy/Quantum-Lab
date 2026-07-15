import { motion } from 'framer-motion';

/** Small rotating isometric cube — stand-in artwork for the Sandbox preview. */
function CubeIllustration({ className = 'h-48 w-48' }) {
  return (
    <svg viewBox="0 0 160 160" className={className}>
      <defs>
        <linearGradient id="cubeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      <motion.circle
        cx="80"
        cy="80"
        r="60"
        fill="url(#cubeGlow)"
        opacity="0.12"
        animate={{ scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />

      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        style={{ transformBox: 'view-box', transformOrigin: '80px 80px' }}
      >
        <polygon points="80,30 125,55 125,105 80,130 35,105 35,55" fill="none" stroke="url(#cubeGlow)" strokeWidth="2" />
        <polygon points="80,30 125,55 80,80 35,55" fill="#22d3ee" fillOpacity="0.08" stroke="url(#cubeGlow)" strokeWidth="1.5" />
        <polygon points="80,80 125,55 125,105 80,130" fill="#a855f7" fillOpacity="0.12" stroke="url(#cubeGlow)" strokeWidth="1.5" />
        <polygon points="80,80 35,55 35,105 80,130" fill="#22d3ee" fillOpacity="0.05" stroke="url(#cubeGlow)" strokeWidth="1.5" />
        <line x1="80" y1="30" x2="80" y2="80" stroke="url(#cubeGlow)" strokeWidth="1" opacity="0.6" />
      </motion.g>

      <motion.circle
        cx="80"
        cy="80"
        r="4"
        fill="#e0f2fe"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
}

export default CubeIllustration;
