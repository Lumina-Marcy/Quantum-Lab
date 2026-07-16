import { motion } from 'framer-motion';
import { jitter } from '../../utils/deterministicRandom';

// Candlesticks across the upper band — "live market graphs."
const CANDLE_COUNT = 9;
const CANDLES = Array.from({ length: CANDLE_COUNT }, (_, i) => {
  const x = 20 + i * 27;
  const open = 70 + jitter(i * 3.1 + 1) * 60;
  const close = 70 + jitter(i * 4.7 + 2) * 60;
  const high = Math.min(open, close) - 6 - jitter(i * 5.3) * 10;
  const low = Math.max(open, close) + 6 + jitter(i * 6.1) * 10;
  return { x, open, close, high, low, up: close < open };
});

// A trend line drawn across the candle highs — "data streams."
const LINE_POINTS = CANDLES.map((c) => `${c.x},${(c.open + c.close) / 2}`).join(' ');

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}
function pieSlicePath(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y} Z`;
}

const PIE = { cx: 215, cy: 235, r: 42 };
const PIE_COLORS = ['#8b5cf6', '#60a5fa', '#a78bfa', '#c4b5fd'];
const PIE_CONFIG_A = [0, 90, 160, 250, 360];
const PIE_CONFIG_B = [0, 60, 200, 300, 360];
const PIE_TIMES = [0, 0.42, 0.58, 1];

function pieWedges(boundaries) {
  return PIE_COLORS.map((color, i) => ({
    d: pieSlicePath(PIE.cx, PIE.cy, PIE.r, boundaries[i], boundaries[i + 1]),
    color,
  }));
}
const WEDGES_A = pieWedges(PIE_CONFIG_A);
const WEDGES_B = pieWedges(PIE_CONFIG_B);

/** Live candlesticks, a trend line, and a rebalancing portfolio — Finance's full-card hover story. */
function FinanceIllustration({ active = false }) {
  return (
    <svg viewBox="0 0 280 300" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <motion.g
        animate={{ opacity: active ? 1 : 0.16, scale: active ? 1 : 0.94 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        {/* Candlestick chart — each candle drifts its close price in a gentle loop, "live" rather than static. */}
        {CANDLES.map((c, i) => (
          <motion.g
            key={i}
            animate={active ? { y: [0, c.up ? -4 : 4, 0] } : { y: 0 }}
            transition={active ? { duration: 3 + (i % 3) * 0.6, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
          >
            <line x1={c.x} y1={c.high} x2={c.x} y2={c.low} stroke={c.up ? '#60a5fa' : '#8b5cf6'} strokeWidth={1} opacity={0.6} />
            <rect
              x={c.x - 5}
              y={Math.min(c.open, c.close)}
              width={10}
              height={Math.max(2, Math.abs(c.close - c.open))}
              fill={c.up ? '#60a5fa' : '#8b5cf6'}
              opacity={0.85}
            />
          </motion.g>
        ))}

        {/* Trend line — "data streams." */}
        <motion.polyline
          points={LINE_POINTS}
          fill="none"
          stroke="#eff6ff"
          strokeWidth={1}
          strokeDasharray="5 4"
          animate={active ? { strokeDashoffset: [0, -18] } : { strokeDashoffset: 0 }}
          transition={active ? { duration: 3, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
        />

        {/* Portfolio pie — rebalancing between two configurations, crossfaded (no arc-interpolation
            math needed) — same technique already used for Optimization's route crossfade. */}
        <motion.g
          animate={active ? { opacity: [0.85, 0.85, 0, 0] } : { opacity: 0.85 }}
          transition={active ? { duration: 5, repeat: Infinity, ease: 'easeInOut', times: PIE_TIMES } : { duration: 0.3 }}
        >
          {WEDGES_A.map((w, i) => (
            <path key={i} d={w.d} fill={w.color} opacity={0.8} />
          ))}
        </motion.g>
        <motion.g
          animate={active ? { opacity: [0, 0, 0.85, 0.85] } : { opacity: 0 }}
          transition={active ? { duration: 5, repeat: Infinity, ease: 'easeInOut', times: PIE_TIMES } : { duration: 0.3 }}
        >
          {WEDGES_B.map((w, i) => (
            <path key={i} d={w.d} fill={w.color} opacity={0.8} />
          ))}
        </motion.g>
      </motion.g>
    </svg>
  );
}

export default FinanceIllustration;
