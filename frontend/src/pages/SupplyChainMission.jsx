import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import QuantumCore from '../components/QuantumCore';

// Flavor-only figure for the intro narration and outcome text — not tied to any real combinatorial
// system (the old S/W/D/C route-scoring math was cut; it was disconnected from the actual warehouse
// gameplay and added complexity nothing else needed).
const POSSIBLE_SCHEDULES = 6_250_000;

const INTRO_LINES = [
  { id: 1, delay: 400, text: '> Distribution network failure detected — every active shipping route has collapsed under demand...', cls: 'text-orange-400' },
  { id: 2, delay: 1500, text: '> Cross-referencing supplier, warehouse, hub, and carrier database...', cls: 'text-green-400' },
  {
    id: 3,
    delay: 2700,
    text: `> ${POSSIBLE_SCHEDULES.toLocaleString()} possible worker/dock/truck schedules identified`,
    cls: 'text-yellow-300',
  },
  { id: 4, delay: 3900, text: '> Classical scheduling rate: roughly one plan tested every few seconds...', cls: 'text-green-400' },
  { id: 5, delay: 5100, text: '> Estimated time to test every schedule by hand: centuries', cls: 'text-orange-400' },
  { id: 6, delay: 6300, text: '█████████ LOGISTICS TEAM ASSEMBLED — ROUTING ENGINE ONLINE █████████', cls: 'text-emerald-400 font-bold tracking-wider' },
];

// --- Warehouse Chaos: a 60-second manual scheduling scramble. Bigger than the first pass — more
// docks and a larger worker pool — and orders now cost more than one worker once their quantity
// climbs, so a few big orders can tie up most of the floor at once. ---

const CHAOS_DURATION_S = 60;
const DOCK_COUNT = 6;
const WORKER_POOL = 10;
const ROBOT_POOL = 4;
const ROBOT_RECHARGE_S = 8;
const RAIN_DURATION_S = 10;
const JAM_REPAIR_S = 6;
const TRAFFIC_FREEZE_S = 4;

const PRIORITY_META = {
  Express: { handlingS: 5, deadlineS: 15, cls: 'border-rose-400/50 text-rose-200 bg-rose-500/10' },
  High: { handlingS: 7, deadlineS: 22, cls: 'border-amber-400/50 text-amber-200 bg-amber-500/10' },
  Standard: { handlingS: 10, deadlineS: 30, cls: 'border-slate-500/50 text-slate-300 bg-slate-600/10' },
};
const PRIORITIES = ['Express', 'High', 'Standard'];
const CUSTOMERS = ['Customer #214', 'Retail Store', 'Restaurant Group', 'Tech Outlet', 'Home Goods Co.', 'Corner Market'];
const ITEMS = ['Gaming Console', 'Office Chairs', 'Frozen Food', 'Laptops', 'Winter Coats', 'Bottled Water', 'Desk Lamps', 'Running Shoes'];

const EVENT_TYPES = [
  { id: 'forklift', label: '⚠ Forklift unavailable' },
  { id: 'jam', label: '⚠ Conveyor belt jam — a worker is pulled off the floor to fix it' },
  { id: 'traffic', label: '⚠ Truck delayed in traffic — all docks stall' },
  { id: 'mismatch', label: '⚠ Inventory mismatch' },
  { id: 'flashsale', label: '⚠ Flash sale! Orders surge' },
  { id: 'rain', label: '⚠ Heavy rain — deliveries delayed' },
];

// Bigger orders need more hands on deck — up to a 3-worker cap — so a handful of large orders can
// tie up most of the floor's worker pool at once, on top of the deadline pressure.
function workersRequired(qty) {
  if (qty <= 15) return 1;
  if (qty <= 35) return 2;
  return 3;
}

function randomOrder(id) {
  const priority = PRIORITIES[Math.floor(Math.random() * PRIORITIES.length)];
  const meta = PRIORITY_META[priority];
  return {
    id,
    customer: CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)],
    item: ITEMS[Math.floor(Math.random() * ITEMS.length)],
    qty: 2 + Math.floor(Math.random() * 58),
    priority,
    deadlineS: meta.deadlineS,
    status: 'pending',
  };
}

function makeInitialGame() {
  return {
    orders: [],
    docks: Array.from({ length: DOCK_COUNT }, (_, i) => ({ id: i, status: 'empty', orderId: null, remainingS: 0, totalS: 0, disabledUntil: 0, workersUsed: 0 })),
    workersFree: WORKER_POOL,
    robotsFree: ROBOT_POOL,
    robotRechargeAt: [],
    workerRepairAt: [],
    secondsLeft: CHAOS_DURATION_S,
    elapsed: 0,
    delivered: 0,
    late: 0,
    idleTicks: 0,
    totalSpawned: 0,
    activeEvent: null,
    rainUntil: 0,
    freezeUntil: 0,
    nextSpawnAt: 2,
    nextEventAt: 12,
    _nextOrderId: 1,
  };
}

// Pure per-second simulation step — never calls a parent callback, so it's safe to run from a
// plain setInterval `setGame(tick)` even under React 18 StrictMode's dev-only double-invoke.
function tick(game) {
  let orders = game.orders.map((o) => ({ ...o }));
  let docks = game.docks.map((d) => ({ ...d }));
  let { workersFree, robotsFree, robotRechargeAt, workerRepairAt, delivered, late, idleTicks, totalSpawned, rainUntil, freezeUntil, nextSpawnAt, nextEventAt, _nextOrderId } = game;
  const elapsed = game.elapsed + 1;
  const secondsLeft = Math.max(0, game.secondsLeft - 1);
  let activeEvent = null;
  const trafficFrozen = elapsed <= freezeUntil;

  docks = docks.map((dock) => {
    if (dock.status === 'disabled' && elapsed >= dock.disabledUntil) return { ...dock, status: 'empty' };
    if (dock.status !== 'active') return dock;
    if (trafficFrozen) return dock; // trucks are stuck — no dock makes progress, but deadlines below still tick
    const remaining = dock.remainingS - 1;
    if (remaining <= 0) {
      orders = orders.map((o) => (o.id === dock.orderId ? { ...o, status: 'done' } : o));
      delivered += 1;
      workersFree += dock.workersUsed;
      return { ...dock, status: 'empty', orderId: null, remainingS: 0, totalS: 0, workersUsed: 0 };
    }
    return { ...dock, remainingS: remaining };
  });

  const stillCharging = [];
  for (const t of robotRechargeAt) {
    if (elapsed >= t) robotsFree += 1;
    else stillCharging.push(t);
  }
  robotRechargeAt = stillCharging;

  const stillRepairing = [];
  for (const t of workerRepairAt) {
    if (elapsed >= t) workersFree += 1;
    else stillRepairing.push(t);
  }
  workerRepairAt = stillRepairing;

  orders = orders.map((o) => {
    if (o.status !== 'pending' && o.status !== 'active') return o;
    const deadlineS = o.deadlineS - 1;
    if (deadlineS <= 0) {
      if (o.status === 'active') {
        const heldDock = docks.find((d) => d.orderId === o.id);
        if (heldDock) workersFree += heldDock.workersUsed;
        docks = docks.map((d) => (d.orderId === o.id ? { ...d, status: 'empty', orderId: null, remainingS: 0, totalS: 0, workersUsed: 0 } : d));
      }
      late += 1;
      return { ...o, deadlineS: 0, status: 'late' };
    }
    return { ...o, deadlineS };
  });

  orders = orders.filter((o) => o.status === 'pending' || o.status === 'active');

  const allDocksEmpty = docks.every((d) => d.status === 'empty');
  idleTicks += allDocksEmpty ? 1 : 0;

  if (elapsed >= nextSpawnAt && secondsLeft > 0) {
    orders.push(randomOrder(_nextOrderId));
    _nextOrderId += 1;
    totalSpawned += 1;
    nextSpawnAt = elapsed + 2 + Math.floor(Math.random() * 3);
  }

  if (elapsed >= nextEventAt && secondsLeft > 0) {
    const kind = EVENT_TYPES[Math.floor(Math.random() * EVENT_TYPES.length)];
    activeEvent = { id: kind.id, label: kind.label };
    if (kind.id === 'forklift') {
      const empty = docks.filter((d) => d.status === 'empty');
      if (empty.length) {
        const target = empty[Math.floor(Math.random() * empty.length)];
        docks = docks.map((d) => (d.id === target.id ? { ...d, status: 'disabled', disabledUntil: elapsed + 6 } : d));
      }
    } else if (kind.id === 'jam') {
      const active = docks.filter((d) => d.status === 'active');
      if (active.length) {
        const target = active[Math.floor(Math.random() * active.length)];
        docks = docks.map((d) => (d.id === target.id ? { ...d, remainingS: d.remainingS + 5, totalS: d.totalS + 5 } : d));
      }
      // A worker gets pulled off the floor to fix the belt, coming back after JAM_REPAIR_S.
      if (workersFree > 0) {
        workersFree -= 1;
        workerRepairAt = [...workerRepairAt, elapsed + JAM_REPAIR_S];
      }
    } else if (kind.id === 'traffic') {
      // Trucks are stuck, so every dock's progress freezes for a few seconds — deadlines keep
      // ticking down the whole time, so this is a real setback, not just a pause.
      freezeUntil = elapsed + TRAFFIC_FREEZE_S;
    } else if (kind.id === 'mismatch') {
      const active = docks.filter((d) => d.status === 'active');
      if (active.length) {
        const target = active[Math.floor(Math.random() * active.length)];
        orders = orders.map((o) => (o.id === target.orderId ? { ...o, status: 'pending' } : o));
        docks = docks.map((d) => (d.id === target.id ? { ...d, status: 'empty', orderId: null, remainingS: 0, totalS: 0, workersUsed: 0 } : d));
        workersFree += target.workersUsed;
      }
    } else if (kind.id === 'flashsale') {
      for (let i = 0; i < 4; i++) {
        orders.push(randomOrder(_nextOrderId));
        _nextOrderId += 1;
        totalSpawned += 1;
      }
    } else if (kind.id === 'rain') {
      rainUntil = elapsed + RAIN_DURATION_S;
    }
    nextEventAt = elapsed + 10 + Math.floor(Math.random() * 7);
  }

  return {
    orders,
    docks,
    workersFree,
    robotsFree,
    robotRechargeAt,
    workerRepairAt,
    secondsLeft,
    elapsed,
    delivered,
    late,
    idleTicks,
    totalSpawned,
    activeEvent,
    rainUntil,
    freezeUntil,
    nextSpawnAt,
    nextEventAt,
    _nextOrderId,
  };
}

function summarizeChaos(g) {
  const truckIdlePct = Math.round((g.idleTicks / CHAOS_DURATION_S) * 100);
  const satisfaction = Math.max(5, Math.min(97, Math.round(100 - g.late * 3 - truckIdlePct * 0.3)));
  return { totalOrders: g.totalSpawned, delivered: g.delivered, late: g.late, truckIdlePct, satisfaction };
}

function computeOptimizedMetrics(before) {
  const late = Math.round(before.late * 0.15);
  const delivered = Math.max(before.delivered, before.totalOrders - late);
  const truckIdlePct = Math.round(before.truckIdlePct * 0.3);
  const satisfaction = Math.max(85, Math.min(99, Math.round(100 - late * 2 - truckIdlePct * 0.2)));
  return { totalOrders: before.totalOrders, delivered, late, truckIdlePct, satisfaction };
}

// A one-time walkthrough shown before the chaos timer ever starts — the round's clock lives entirely
// inside ChaosPhase (mounted fresh only once this phase hands off), so nothing here needs to gate or
// delay any timer; it's just a plain step-through screen with a "Start" button at the end.
const TUTORIAL_STEPS = [
  {
    icon: '📦',
    title: 'Orders Keep Coming',
    body: 'Orders spawn continuously into the Pending Orders queue. Drag one onto an open dock to start processing it before its deadline runs out.',
  },
  {
    icon: '👷',
    title: 'Bigger Orders Need More Hands',
    body: 'Small orders need just 1 worker. Bigger ones need 2, and the biggest need all 3 — so a few large orders can tie up most of your crew at once.',
  },
  {
    icon: '🤖',
    title: 'Robots Can Rush a Dock',
    body: 'Click 🤖 Rush on an active dock to cut its remaining time in half. Robots need to recharge afterward, so use them wisely.',
  },
  {
    icon: '⚠',
    title: 'Things Will Go Wrong',
    body: 'Forklifts break down, trucks get stuck in traffic, inventory mismatches bounce orders back to pending, and flash sales flood you with new ones. A conveyor jam even pulls a worker off the floor to fix it, so you have one less pair of hands until it\'s done.',
  },
  {
    icon: '⏱',
    title: 'Sixty Seconds on the Clock',
    body: "You've got 60 seconds to deliver as many orders as you can by hand. After that, see what a quantum-optimized schedule could have done instead.",
  },
];

function TutorialPhase({ onStart }) {
  const [step, setStep] = useState(0);
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const current = TUTORIAL_STEPS[step];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col items-center justify-center gap-5 px-6 py-16 text-center"
    >
      <p className="text-xs uppercase tracking-widest text-violet-300">
        How to Play · {step + 1} of {TUTORIAL_STEPS.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-4xl">{current.icon}</p>
          <h2 className="mt-3 text-2xl font-bold text-white">{current.title}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">{current.body}</p>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center gap-2">
        {TUTORIAL_STEPS.map((_, i) => (
          <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === step ? 'bg-cyan-400' : 'bg-slate-700'}`} />
        ))}
      </div>

      <button
        onClick={() => (isLast ? onStart() : setStep((s) => s + 1))}
        className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
      >
        {isLast ? 'Start Warehouse Shift' : 'Next'}
      </button>
    </motion.div>
  );
}

function ChaosPhase({ onFinish }) {
  const [game, setGame] = useState(makeInitialGame);
  const [draggingId, setDraggingId] = useState(null);
  const [banner, setBanner] = useState(null);
  const gameRef = useRef(game);
  const finishedRef = useRef(false);

  useEffect(() => {
    gameRef.current = game;
  }, [game]);

  // Purely a simulation/display driver — never calls `onFinish`, so it's safe under StrictMode's
  // dev-only double-invoke of setState updaters.
  useEffect(() => {
    const id = setInterval(() => {
      setGame((prev) => (prev.secondsLeft <= 0 ? prev : tick(prev)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // The SOLE authority on ending the round: a single setTimeout firing once, reading the latest
  // simulation state via a ref, calling `onFinish` directly from a plain timer callback — never
  // from inside a setState updater. This is the pattern that avoids the "Cannot update a component
  // while rendering a different component" class of bug from the original Warehouse Chaos attempt.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      onFinish(summarizeChaos(gameRef.current));
    }, CHAOS_DURATION_S * 1000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  useEffect(() => {
    if (!game.activeEvent) return;
    setBanner(game.activeEvent);
    const t = setTimeout(() => setBanner(null), 3000);
    return () => clearTimeout(t);
  }, [game.activeEvent]);

  function handleDropOnDock(dockIndex) {
    const orderId = draggingId;
    setDraggingId(null);
    if (orderId == null) return;
    setGame((prev) => {
      const dock = prev.docks[dockIndex];
      if (dock.status !== 'empty') return prev;
      const order = prev.orders.find((o) => o.id === orderId && o.status === 'pending');
      if (!order) return prev;
      const needed = workersRequired(order.qty);
      if (prev.workersFree < needed) return prev;
      const meta = PRIORITY_META[order.priority];
      const raining = prev.elapsed < prev.rainUntil;
      const handlingS = raining ? Math.round(meta.handlingS * 1.5) : meta.handlingS;
      return {
        ...prev,
        docks: prev.docks.map((d, i) => (i === dockIndex ? { ...d, status: 'active', orderId: order.id, remainingS: handlingS, totalS: handlingS, workersUsed: needed } : d)),
        orders: prev.orders.map((o) => (o.id === order.id ? { ...o, status: 'active' } : o)),
        workersFree: prev.workersFree - needed,
      };
    });
  }

  function handleRush(dockIndex) {
    setGame((prev) => {
      if (prev.robotsFree <= 0) return prev;
      const dock = prev.docks[dockIndex];
      if (dock.status !== 'active') return prev;
      return {
        ...prev,
        docks: prev.docks.map((d, i) => (i === dockIndex ? { ...d, remainingS: Math.max(1, Math.floor(d.remainingS / 2)) } : d)),
        robotsFree: prev.robotsFree - 1,
        robotRechargeAt: [...prev.robotRechargeAt, prev.elapsed + ROBOT_RECHARGE_S],
      };
    });
  }

  const pendingOrders = game.orders.filter((o) => o.status === 'pending');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-5xl flex-col justify-center gap-3 px-6 py-4"
    >
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">Warehouse Floor</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Keep the Orders Moving</h2>
        <p className="mx-auto mt-1.5 max-w-2xl text-xs text-slate-400 sm:text-sm">
          Drag orders onto an open dock before their deadline hits zero. Bigger orders tie up more
          workers — up to 3 at once. You've got {CHAOS_DURATION_S} seconds before the Quantum
          Optimizer unlocks — do what you can by hand first.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300 sm:text-sm">
        <span>⏱ <span className="font-mono text-white">{game.secondsLeft}s</span></span>
        <span>✅ Delivered <span className="font-semibold text-emerald-300">{game.delivered}</span></span>
        <span>⏰ Late <span className="font-semibold text-rose-300">{game.late}</span></span>
        <span>👷 Workers <span className="font-mono text-white">{game.workersFree}/{WORKER_POOL}</span></span>
        {game.workerRepairAt.length > 0 && (
          <span className="text-amber-300">🔧 Repairing <span className="font-mono">{game.workerRepairAt.length}</span></span>
        )}
        <span>🤖 Robots <span className="font-mono text-white">{game.robotsFree}/{ROBOT_POOL}</span></span>
        {game.elapsed < game.freezeUntil && (
          <span className="text-rose-300">
            🚦 All docks stalled <span className="font-mono">{game.freezeUntil - game.elapsed}s</span>
          </span>
        )}
      </div>

      <div className="flex min-h-[1.5rem] items-center justify-center">
        <AnimatePresence>
          {banner && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-1.5 text-center text-xs text-amber-200"
            >
              {banner.label}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,240px)_1fr]">
        <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-3">
          <p className="mb-2 text-center text-[10px] uppercase tracking-widest text-slate-500">Pending Orders</p>
          <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
            {pendingOrders.map((order) => {
              const meta = PRIORITY_META[order.priority];
              return (
                <div
                  key={order.id}
                  draggable
                  onDragStart={() => setDraggingId(order.id)}
                  onDragEnd={() => setDraggingId(null)}
                  className={`cursor-grab rounded-xl border px-3 py-2 text-xs active:cursor-grabbing ${meta.cls}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold">{order.item}</span>
                    <span className="rounded-full bg-black/30 px-2 py-0.5 text-[9px] uppercase">{order.priority}</span>
                  </div>
                  <p className="mt-0.5 text-slate-400">{order.customer} · Qty {order.qty}</p>
                  <p className="mt-0.5 text-slate-500">
                    ⏱ {order.deadlineS}s · 👷 needs {workersRequired(order.qty)}
                  </p>
                </div>
              );
            })}
            {pendingOrders.length === 0 && (
              <p className="py-6 text-center text-xs text-slate-600">No pending orders right now.</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {game.docks.map((dock, i) => {
            const order = dock.orderId != null ? game.orders.find((o) => o.id === dock.orderId) : null;
            return (
              <div
                key={dock.id}
                onDragOver={(e) => dock.status === 'empty' && e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDropOnDock(i);
                }}
                className={`rounded-2xl border p-3 text-xs ${
                  dock.status === 'disabled'
                    ? 'border-red-500/40 bg-red-950/20'
                    : dock.status === 'active'
                    ? 'border-cyan-500/40 bg-cyan-950/10'
                    : 'border-dashed border-slate-700 bg-slate-900/40'
                }`}
              >
                <p className="uppercase tracking-widest text-slate-500">Dock {i + 1}</p>
                {dock.status === 'disabled' && <p className="mt-2 text-red-300">🚧 Forklift down</p>}
                {dock.status === 'empty' && <p className="mt-2 text-slate-500">Drop an order here</p>}
                {dock.status === 'active' && order && (
                  <div className="mt-1 space-y-1">
                    <p className="font-semibold text-white">{order.item}</p>
                    <p className="text-slate-400">
                      {order.customer} · Qty {order.qty} · 👷×{dock.workersUsed}
                    </p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full bg-cyan-400"
                        style={{ width: `${Math.round(((dock.totalS - dock.remainingS) / dock.totalS) * 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{dock.remainingS}s left</span>
                      {game.robotsFree > 0 && (
                        <button
                          onClick={() => handleRush(i)}
                          className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] text-violet-300 hover:bg-violet-500/30"
                        >
                          🤖 Rush
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

function UnlockPhase({ onRun }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-xl flex-col items-center justify-center gap-4 px-6 py-16 text-center"
    >
      <QuantumCore stage="alive" className="h-10 w-10" particleCount={6} detail="minimal" />
      <p className="text-xs uppercase tracking-widest text-violet-300">Notification</p>
      <h2 className="text-2xl font-bold text-white">Quantum Optimizer Available</h2>
      <p className="text-sm text-slate-400">
        Manual scheduling clearly isn't keeping up. A quantum optimization pass can search the full
        space of worker, robot, and truck assignments at once.
      </p>
      <button
        onClick={onRun}
        className="rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-purple-500/30 transition hover:brightness-110"
      >
        ⚛ Run the Quantum Optimizer
      </button>
    </motion.div>
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Same Grover's-algorithm optimal-round formula used elsewhere in this app (Molecule Mission,
// the Grover's lesson interactive) — kept here specifically so the simulation's round count is the
// real number, not a decorative one.
function optimalIterations(n) {
  return Math.max(1, Math.round((Math.PI / 4) * Math.sqrt(n) - 0.5));
}

function formatDuration(totalSeconds) {
  if (totalSeconds < 60) return `${Math.round(totalSeconds)} sec`;
  if (totalSeconds < 3600) return `${(totalSeconds / 60).toFixed(1)} min`;
  if (totalSeconds < 86400) return `${(totalSeconds / 3600).toFixed(1)} hrs`;
  return `${(totalSeconds / 86400).toFixed(1)} days`;
}

// Same assumption used in the "Quantum vs Classical Scheduling Search" comparison sheet: 2 seconds
// per operation for both, so the only difference is the number of operations each approach needs —
// classical checks on average half the search space (N/2), quantum needs only
// optimalIterations(N) amplitude-amplification rounds.
const SIM_RATE_SEC = 2;
const QUANTUM_ROUNDS = optimalIterations(POSSIBLE_SCHEDULES);
const CLASSICAL_CHECKS = Math.round(POSSIBLE_SCHEDULES / 2);
const CLASSICAL_TIME_LABEL = formatDuration(CLASSICAL_CHECKS * SIM_RATE_SEC);
const QUANTUM_TIME_LABEL = formatDuration(QUANTUM_ROUNDS * SIM_RATE_SEC);

// A handful of sample points instead of every possible N — same formulas as the full comparison,
// just enough rows to show the speedup growing with scale without turning this into a data dump.
const SCALING_SAMPLE_NS = [100, 10_000, 1_000_000, POSSIBLE_SCHEDULES];
const SCALING_ROWS = SCALING_SAMPLE_NS.map((n) => {
  const classicalChecks = Math.round(n / 2);
  const quantumRounds = optimalIterations(n);
  const classicalTime = classicalChecks * SIM_RATE_SEC;
  const quantumTime = quantumRounds * SIM_RATE_SEC;
  return {
    n,
    classicalTimeLabel: formatDuration(classicalTime),
    quantumTimeLabel: formatDuration(quantumTime),
    speedupLabel: `${(classicalTime / quantumTime).toFixed(1)}x`,
  };
});

// The conceptual steps behind the amplitude-amplification loop actually running above — spelled out
// since the round counter alone doesn't explain *why* fewer rounds are needed.
const RUN_THROUGH_STEPS = [
  {
    title: 'Superposition',
    body: `Represent all ${POSSIBLE_SCHEDULES.toLocaleString()} possible schedules at once, instead of picking one to test at a time.`,
  },
  {
    title: 'Oracle',
    body: 'Mark the true optimal schedule within that superposition, without ever checking candidates individually.',
  },
  {
    title: 'Diffusion',
    body: "Amplify the marked schedule's probability relative to every other one.",
  },
  {
    title: 'Repeat',
    body: `Run the oracle-and-diffusion cycle ${QUANTUM_ROUNDS.toLocaleString()} times — each round bends the odds further toward the real answer.`,
  },
  {
    title: 'Measure',
    body: 'Collapse the superposition down to a single outcome: the winning schedule.',
  },
];

const SIM_STEPS = 24;
const SIM_STEP_MS = 120;

// A short, scripted "the quantum computer is actually working" visualization between the player's
// manual attempt and the outcome reveal — not an interactive round, so it drives itself with a
// single async function inside a useEffect([]) that awaits each step. That's the same proven-safe
// pattern Molecule Mission's SearchingPhase uses (never firing a parent callback from inside a
// setState updater) — and unlike the old version, `onComplete` is now only ever called from the
// "Continue" button's onClick, not automatically after a sleep, so the player can read the run-
// through and scaling comparison at their own pace once the animation finishes.
function SimulationPhase({ onComplete }) {
  const [step, setStep] = useState(0);
  const [round, setRound] = useState(0);
  const [satisfaction, setSatisfaction] = useState(4);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      for (let i = 1; i <= SIM_STEPS; i++) {
        if (cancelled) return;
        await sleep(SIM_STEP_MS);
        if (cancelled) return;
        const t = i / SIM_STEPS;
        const eased = 1 - (1 - t) ** 2; // fast at first, settling near the end
        setRound(Math.round(eased * QUANTUM_ROUNDS));
        setSatisfaction(Math.round(4 + eased * (97 - 4)));
        setStep(i);
      }
      if (cancelled) return;
      setDone(true);
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto flex min-h-[calc(100vh-7rem)] max-w-2xl flex-col items-center justify-center gap-5 px-6 py-10 text-center"
    >
      <QuantumCore stage="alive" className="h-10 w-10" particleCount={6} detail="minimal" />
      <p className="text-xs uppercase tracking-widest text-cyan-300/80">Quantum AI Optimizer</p>
      <h2 className="text-2xl font-bold text-white">{done ? 'Optimal Schedule Found' : 'Amplifying the Best Schedule'}</h2>
      <p className="-mt-2 text-xs text-slate-500">
        Considering all {POSSIBLE_SCHEDULES.toLocaleString()} possible schedules at once, instead of one at a time
      </p>

      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950/70 p-5 font-mono">
        <div className="flex items-baseline justify-between text-xs text-slate-500">
          <span>Amplification round</span>
        </div>
        <p className="mt-1 text-2xl font-bold text-cyan-300">
          {round.toLocaleString()} <span className="text-sm font-normal text-slate-500">/ {QUANTUM_ROUNDS.toLocaleString()}</span>
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-cyan-400 transition-[width] duration-150 ease-linear"
            style={{ width: `${(step / SIM_STEPS) * 100}%` }}
          />
        </div>

        <div className="mt-4 flex items-baseline justify-between text-xs text-slate-500">
          <span>Best schedule found so far</span>
        </div>
        <p className={`mt-1 text-2xl font-bold ${done ? 'text-emerald-400' : 'text-white'}`}>{satisfaction}% satisfaction</p>
      </div>

      {!done ? (
        <p className="text-xs text-slate-500">
          Every round bends the odds further toward the real optimal schedule — {QUANTUM_ROUNDS.toLocaleString()}{' '}
          rounds total, versus roughly {CLASSICAL_CHECKS.toLocaleString()} checks needed classically.
        </p>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            Found in the equivalent of <span className="text-cyan-300">{QUANTUM_TIME_LABEL}</span> of quantum compute
            time — a classical computer checking one schedule at a time would need about{' '}
            <span className="text-slate-300">{CLASSICAL_TIME_LABEL}</span> for a search space this size.
          </p>

          <div className="w-full rounded-2xl border border-slate-700 bg-slate-900/60 p-5 text-left">
            <p className="text-sm font-semibold text-cyan-300">How the optimizer got there</p>
            <ol className="mt-3 space-y-2.5">
              {RUN_THROUGH_STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-3 text-sm">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[11px] font-semibold text-cyan-300">
                    {i + 1}
                  </span>
                  <span className="text-slate-300">
                    <span className="font-semibold text-white">{s.title}.</span> {s.body}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="w-full overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/60">
            <p className="px-5 pt-4 text-left text-sm font-semibold text-cyan-300">How this scales</p>
            <table className="mt-2 w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-4 py-2">Possible Schedules</th>
                  <th className="px-4 py-2 text-center">Classical</th>
                  <th className="px-4 py-2 text-center">Quantum</th>
                  <th className="px-4 py-2 text-center">Speedup</th>
                </tr>
              </thead>
              <tbody>
                {SCALING_ROWS.map((row) => (
                  <tr key={row.n} className="border-b border-slate-800 font-mono text-xs last:border-0 sm:text-sm">
                    <td className="px-4 py-2.5 text-slate-300">{row.n.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-center text-slate-400">{row.classicalTimeLabel}</td>
                    <td className="px-4 py-2.5 text-center text-cyan-300">{row.quantumTimeLabel}</td>
                    <td className="px-4 py-2.5 text-center font-semibold text-emerald-300">{row.speedupLabel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="px-5 py-3 text-[11px] text-slate-500">
              Same 2-seconds-per-operation assumption for both — the growing gap comes entirely from
              quantum needing far fewer operations, not faster hardware.
            </p>
          </div>

          <button
            onClick={onComplete}
            className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Continue to Results →
          </button>
        </>
      )}
    </motion.div>
  );
}

function OutcomePhase({ chaosResult, optimizedResult, onReplay }) {
  const rows = [
    { label: 'Late Orders', before: chaosResult.late, after: optimizedResult.late, lowerIsBetter: true },
    { label: 'Truck Idle Time', before: chaosResult.truckIdlePct, after: optimizedResult.truckIdlePct, suffix: '%', lowerIsBetter: true },
    { label: 'Orders Delivered', before: chaosResult.delivered, after: optimizedResult.delivered },
    { label: 'Customer Satisfaction', before: chaosResult.satisfaction, after: optimizedResult.satisfaction, suffix: '%' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mx-auto max-w-3xl px-6 py-14"
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-2">
          <QuantumCore stage="stabilizing" className="h-9 w-9" particleCount={6} detail="minimal" />
          <p className="text-xs uppercase tracking-widest text-emerald-400">Optimized Schedule Deployed</p>
        </div>
        <h1 className="mt-3 text-3xl font-bold text-white">The Warehouse, Reorganized</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
          Orders reordered by priority. Workers reassigned to the busiest stations. Robots took over
          long-distance pallet moves. Trucks loaded in a smarter sequence.
        </p>
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-3">Metric</th>
              <th className="px-4 py-3 text-center">Before</th>
              <th className="px-4 py-3 text-center">After</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const improved = row.lowerIsBetter ? row.after < row.before : row.after > row.before;
              return (
                <tr key={row.label} className="border-b border-slate-800 last:border-0">
                  <td className="px-4 py-3 text-slate-300">{row.label}</td>
                  <td className="px-4 py-3 text-center font-mono text-slate-400">
                    {row.before}
                    {row.suffix ?? ''}
                  </td>
                  <td className={`px-4 py-3 text-center font-mono font-semibold ${improved ? 'text-emerald-300' : 'text-slate-300'}`}>
                    {row.after}
                    {row.suffix ?? ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-8 rounded-2xl border border-slate-700 bg-slate-900/60 p-6 text-left">
        <p className="text-sm font-semibold text-cyan-300">The lesson</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Every new order adds more possible ways to assign workers, robots, and trucks to it. As the
          warehouse grows, finding the best schedule becomes an optimization problem with an enormous
          number of possible solutions, far too many to check by hand or even by brute-force
          computing in any reasonable time. Researchers are exploring quantum optimization algorithms
          that could help solve certain logistics and scheduling problems more efficiently than
          classical methods, making large distribution networks faster and more resilient.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button onClick={onReplay} className="rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700">
          Run It Back
        </button>
        <Link
          to="/missions"
          className="rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
        >
          Finish Mission
        </Link>
      </div>
    </motion.div>
  );
}

function SupplyChainMission() {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'tutorial' | 'chaos' | 'unlocked' | 'simulating' | 'outcome'
  const [visibleLines, setVisibleLines] = useState([]);
  const [chaosResult, setChaosResult] = useState(null);

  useEffect(() => {
    const timers = INTRO_LINES.map((line) =>
      setTimeout(() => setVisibleLines((prev) => [...prev, line]), line.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  const introDone = visibleLines.length === INTRO_LINES.length;
  const optimizedResult = useMemo(() => (chaosResult ? computeOptimizedMetrics(chaosResult) : null), [chaosResult]);

  function handleChaosFinish(result) {
    setChaosResult(result);
    setPhase('unlocked');
  }

  function handleRunOptimizer() {
    setPhase('simulating');
  }

  function handleSimulationComplete() {
    setPhase('outcome');
  }

  function handleReplay() {
    setChaosResult(null);
    setPhase('chaos');
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <div className="flex items-center justify-center gap-2 border-b border-slate-800/60 py-3">
        <QuantumCore stage="alive" className="h-5 w-5" particleCount={5} detail="minimal" />
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Global Logistics Command</span>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'intro' ? (
          <motion.div
            key="intro"
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6 }}
            className="flex min-h-screen flex-col items-center justify-center px-6 py-10"
          >
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl">
              <div className="mb-6 text-center">
                <p className="text-sm uppercase tracking-[0.35em] text-orange-400/80">Mission 4 — The Supply Chain Crisis</p>
                <h1 className="mt-2 text-3xl font-bold text-white">The Optimal Schedule Is Buried in the Search Space</h1>
              </div>

              <div className="rounded-2xl border border-slate-700 bg-black/80 p-6 shadow-2xl shadow-black/60">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  <span className="ml-2 font-mono text-xs text-slate-500">route_search.exe</span>
                </div>
                <div className="min-h-40 space-y-1 font-mono">
                  {visibleLines.map((line) => (
                    <motion.p
                      key={line.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`text-sm leading-7 ${line.cls}`}
                    >
                      {line.text}
                    </motion.p>
                  ))}
                  {!introDone && visibleLines.length > 0 && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.7 }}
                      className="inline-block h-4 w-2 bg-green-400"
                    />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {introDone && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="mt-6 flex justify-center"
                  >
                    <button
                      onClick={() => setPhase('tutorial')}
                      className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
                    >
                      Begin Rerouting
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        ) : phase === 'tutorial' ? (
          <TutorialPhase key="tutorial" onStart={() => setPhase('chaos')} />
        ) : phase === 'chaos' ? (
          <ChaosPhase key="chaos" onFinish={handleChaosFinish} />
        ) : phase === 'unlocked' ? (
          <UnlockPhase key="unlocked" onRun={handleRunOptimizer} />
        ) : phase === 'simulating' ? (
          <SimulationPhase key="simulating" onComplete={handleSimulationComplete} />
        ) : (
          <OutcomePhase key="outcome" chaosResult={chaosResult} optimizedResult={optimizedResult} onReplay={handleReplay} />
        )}
      </AnimatePresence>
    </main>
  );
}

export default SupplyChainMission;
