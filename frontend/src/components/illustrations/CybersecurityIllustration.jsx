import { motion } from 'framer-motion';

const SHIELD_PATH = 'M140 30 L210 55 V130 C210 190 180 225 140 245 C100 225 70 190 70 130 V55 Z';

// Small key glyphs that collapse toward the shield — "keys collapse."
const KEYS = [
  { x: 40, y: 60, rotate: -25 },
  { x: 235, y: 200, rotate: 20 },
];

function KeyGlyph({ x, y, rotate }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <circle cx={0} cy={0} r={7} fill="none" stroke="#c4b5fd" strokeWidth={2} />
      <line x1={6} y1={0} x2={22} y2={0} stroke="#c4b5fd" strokeWidth={2} />
      <line x1={18} y1={0} x2={18} y2={6} stroke="#c4b5fd" strokeWidth={2} />
      <line x1={22} y1={0} x2={22} y2={5} stroke="#c4b5fd" strokeWidth={2} />
    </g>
  );
}

/** A shield forming from collapsing keys, encryption filling it — Cybersecurity's hover story. */
function CybersecurityIllustration({ active = false }) {
  return (
    <svg viewBox="0 0 280 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <defs>
        <clipPath id="shieldClipBig">
          <path d={SHIELD_PATH} />
        </clipPath>
      </defs>
      <motion.g
        animate={{ opacity: active ? 1 : 0.16, scale: active ? 1 : 0.92 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        {KEYS.map((k, i) => (
          <motion.g
            key={i}
            animate={
              active
                ? {
                    x: [0, (140 - k.x) / 2, 140 - k.x],
                    y: [0, (130 - k.y) / 2, 130 - k.y],
                    opacity: [0.9, 0.9, 0],
                  }
                : { x: 0, y: 0, opacity: 0.9 }
            }
            transition={
              active
                ? { duration: 3.4, delay: i * 0.6, repeat: Infinity, repeatDelay: 1.5, ease: 'easeIn' }
                : { duration: 0.3 }
            }
          >
            <KeyGlyph x={k.x} y={k.y} rotate={k.rotate} />
          </motion.g>
        ))}

        <path d={SHIELD_PATH} fill="none" stroke="#8b5cf6" strokeWidth={1.6} strokeOpacity={0.55} />
        <g clipPath="url(#shieldClipBig)">
          <motion.rect
            x="60"
            width="160"
            height="240"
            fill="#8b5cf6"
            fillOpacity={0.45}
            animate={active ? { y: [250, -20, 250] } : { y: 250 }}
            transition={active ? { duration: 4, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          />
        </g>
        <motion.path
          d={SHIELD_PATH}
          fill="none"
          stroke="#c4b5fd"
          strokeWidth={1.6}
          animate={active ? { opacity: [0.4, 0.9, 0.4] } : { opacity: 0.4 }}
          transition={active ? { duration: 3.6, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        />
      </motion.g>
    </svg>
  );
}

export default CybersecurityIllustration;
