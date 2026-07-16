import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Network, Microscope, Database, Shield, Clock, LockKeyhole } from 'lucide-react';
import Panel from './Panel';
import SequentialLines from './SequentialLines';
import { STATUS_LABELS } from '../data/missions';
import { systemReadySignal } from '../utils/systemReadySignal';

const MISSION_ICONS = { 1: Lock, 2: Network, 3: Microscope, 4: Database, 5: Shield };

// A small handful of particles escaping the icon badge on hover — the same fixed-array,
// transform-only idiom as QuantumCore.jsx's own `ESCAPEES` (3 DOM nodes for the component's
// whole lifetime, animating `x`/`y` transforms rather than raw attributes), just in plain DOM
// form here since MissionCard isn't SVG-based. Deliberately NOT a live QuantumCore mount per
// card — five extra Cores each rendering their own orbits/particles would be a real cost for a
// hover-only flourish, so this borrows the Core's visual language without its runtime weight.
const HOVER_SPARKS = [
  { angle: -0.7, distance: 42, delay: 0 },
  { angle: 0.3, distance: 48, delay: 0.12 },
  { angle: 1.5, distance: 40, delay: 0.24 },
];

/**
 * One mission's preview card — always routes to /mission/:id; status is a badge only, never
 * a block. Hovering reveals a tiny terminal overlay ("classified research file" readout), a
 * handful of particles escaping the icon badge, and a brighter pulse on the border glow (which
 * now renders for every card, not just available ones, so "coming soon" cards get the same
 * premium reaction — just from a dimmer resting state). The available card's glow stays muted
 * until `systemReadySignal` fires (the boot sequence's real completion) — by the time a user
 * scrolls this far down, the lab has almost always already "woken up", so the card arrives
 * already illuminated rather than needing its own separate cue.
 */
function MissionCard({ mission, index = 0 }) {
  const [hovered, setHovered] = useState(false);
  const [ignited, setIgnited] = useState(systemReadySignal.get() >= 1);
  const isAvailable = mission.status === 'available';
  const Icon = MISSION_ICONS[mission.id] ?? Shield;

  useEffect(() => systemReadySignal.on('change', (value) => value >= 1 && setIgnited(true)), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.25, ease: 'easeOut' } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="group relative"
    >
      {/* Border glow — always present now (not just for available cards), so every card gets
          the same premium hover reaction; only the resting state differs by availability/ignition. */}
      <motion.div
        aria-hidden="true"
        className="absolute -inset-px rounded-2xl bg-quantum-gradient blur-sm"
        animate={
          isAvailable && ignited
            ? { opacity: hovered ? [0.5, 0.75, 0.5] : [0.35, 0.6, 0.35] }
            : { opacity: hovered ? 0.35 : 0.08 }
        }
        transition={
          isAvailable && ignited
            ? { duration: hovered ? 1.8 : 3, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.4, ease: 'easeOut' }
        }
      />
      <Panel
        as={Link}
        to={`/mission/${mission.id}`}
        className={`relative flex h-full flex-col overflow-hidden p-6 transition-all duration-200 ${
          isAvailable ? 'border-quantum-cyan/50' : 'group-hover:border-quantum-cyan/60 group-hover:shadow-glow-cyan'
        }`}
      >
        <div className="flex items-start justify-between">
          <span className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-quantum-gradient/10 text-quantum-cyan">
            <Icon size={30} strokeWidth={1.5} />
            {HOVER_SPARKS.map((s, i) => {
              const dx = Math.cos(s.angle) * s.distance;
              const dy = Math.sin(s.angle) * s.distance;
              return (
                <motion.span
                  key={i}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-quantum-cyan"
                  animate={
                    hovered
                      ? { x: [0, dx], y: [0, dy], opacity: [0, 1, 0] }
                      : { x: 0, y: 0, opacity: 0 }
                  }
                  transition={
                    hovered
                      ? { duration: 1.1, delay: s.delay, repeat: Infinity, repeatDelay: 0.5, ease: 'easeOut' }
                      : { duration: 0.2 }
                  }
                />
              );
            })}
          </span>
          <span
            className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
              isAvailable ? 'bg-quantum-cyan/15 text-quantum-cyan' : 'bg-slate-700/50 text-slate-400'
            }`}
          >
            {!isAvailable && <LockKeyhole size={11} strokeWidth={2} />}
            {STATUS_LABELS[mission.status]}
          </span>
        </div>

        <h3 className="mt-5 text-xl font-semibold text-white">{mission.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-400">{mission.summary}</p>

        <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <Clock size={13} strokeWidth={1.75} />
            {mission.estimatedTime}
          </span>
          <span>{mission.difficulty}</span>
        </div>

        <span
          className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${
            isAvailable ? 'text-quantum-cyan' : 'text-slate-400 group-hover:text-quantum-cyan'
          }`}
        >
          {isAvailable ? 'Start Here →' : 'Explore →'}
        </span>

        {mission.terminalLines?.length > 0 && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-quantum-navy/95 p-6 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100"
          >
            <SequentialLines
              lines={mission.terminalLines}
              active={hovered}
              stagger={0.3}
              className="space-y-2 text-center"
              lineClassName="font-mono text-xs text-quantum-cyan sm:text-sm"
            />
          </div>
        )}
      </Panel>
    </motion.div>
  );
}

export default MissionCard;
