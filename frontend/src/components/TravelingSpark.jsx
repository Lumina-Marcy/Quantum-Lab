import { motion } from 'framer-motion';

/** A small dot that loops from one point to another — used to suggest energy/data flow along an edge. */
function TravelingSpark({ x1, y1, x2, y2, duration = 2, delay = 0, color = '#67e8f9', radius = 0.6 }) {
  return (
    <motion.circle
      r={radius}
      fill={color}
      animate={{ cx: [x1, x2], cy: [y1, y2], opacity: [0, 1, 1, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export default TravelingSpark;
