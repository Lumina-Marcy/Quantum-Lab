import { motion } from 'framer-motion';

/** Animated portal — glowing core, rotating ring, orbiting particles, a figure standing before it. */
function PortalIllustration({ className = 'h-72 w-72' }) {
  return (
    <svg viewBox="0 0 200 200" className={className}>
      <defs>
        <radialGradient id="portalCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.9" />
          <stop offset="55%" stopColor="#a855f7" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="portalRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      <motion.circle
        cx="100"
        cy="100"
        r="85"
        fill="url(#portalCore)"
        animate={{ opacity: [0.6, 1, 0.6], scale: [0.96, 1.04, 0.96] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />

      <motion.circle
        cx="100"
        cy="100"
        r="70"
        fill="none"
        stroke="url(#portalRing)"
        strokeWidth="2.5"
        strokeDasharray="8 6"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: 'linear' }}
        style={{ transformBox: 'view-box', transformOrigin: '100px 100px' }}
      />
      <motion.circle
        cx="100"
        cy="100"
        r="78"
        fill="none"
        stroke="#c4b5fd"
        strokeOpacity="0.35"
        strokeWidth="1"
        strokeDasharray="2 10"
        animate={{ rotate: -360 }}
        transition={{ duration: 34, repeat: Infinity, ease: 'linear' }}
        style={{ transformBox: 'view-box', transformOrigin: '100px 100px' }}
      />
      <circle cx="100" cy="100" r="55" fill="none" stroke="#67e8f9" strokeOpacity="0.3" strokeWidth="1" />

      <motion.g
        animate={{ rotate: -360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{ transformBox: 'view-box', transformOrigin: '100px 100px' }}
      >
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={100 + Math.cos(angle) * 80}
              cy={100 + Math.sin(angle) * 80}
              r={1.8}
              fill="#e0f2fe"
              opacity={0.7}
            />
          );
        })}
      </motion.g>

      <g opacity="0.5">
        <ellipse cx="100" cy="150" rx="10" ry="4" fill="#020617" opacity="0.4" />
        <path
          d="M100 118 c-5 0 -8 4 -8 9 v14 c0 3 2 5 4 6 l-2 14 h4 l2 -12 h0 l2 12 h4 l-2 -14 c2 -1 4 -3 4 -6 v-14 c0 -5 -3 -9 -8 -9 Z"
          fill="#020617"
        />
        <circle cx="100" cy="112" r="6" fill="#020617" />
      </g>
    </svg>
  );
}

export default PortalIllustration;
