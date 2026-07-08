import { motion } from 'framer-motion';

/** Simple animated shield/lock illustration — stand-in for real vault artwork. */
function VaultIcon({ className = 'h-40 w-40' }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      <defs>
        <radialGradient id="vaultGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vaultShieldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>

      <motion.circle
        cx="50"
        cy="48"
        r="40"
        fill="url(#vaultGlow)"
        animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      />

      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{ transformBox: 'view-box', transformOrigin: '50px 48px' }}
      >
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          return (
            <circle
              key={i}
              cx={50 + Math.cos(angle) * 44}
              cy={48 + Math.sin(angle) * 44}
              r={1.4}
              fill="#67e8f9"
              opacity={0.6}
            />
          );
        })}
      </motion.g>

      <path
        d="M50 8 L88 22 L88 50 C88 74 70 90 50 96 C30 90 12 74 12 50 L12 22 Z"
        fill="rgba(15,23,42,0.85)"
        stroke="url(#vaultShieldStroke)"
        strokeWidth="2.5"
      />

      <path
        d="M40 46 v-6 a10 10 0 0 1 20 0 v6"
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <rect x="36" y="46" width="28" height="22" rx="4" fill="#0f172a" stroke="#67e8f9" strokeWidth="1.5" />
      <circle cx="50" cy="55" r="2.6" fill="#67e8f9" />
      <rect x="48.7" y="56" width="2.6" height="6" fill="#67e8f9" />
    </svg>
  );
}

export default VaultIcon;
