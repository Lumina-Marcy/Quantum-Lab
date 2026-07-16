import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';
import QuantumCore from './QuantumCore';
import { navReadySignal } from '../utils/systemReadySignal';
import { markOnboardingComplete } from '../utils/onboardingState';

const API = '/api/auth';

// Escalating instability per the brief: 1st failed attempt is a brief flicker, 2nd holds longer
// (red energy, less stable), 3rd+ stays visibly distressed until it either succeeds or the user
// tries again — "not violent, not scary, just unstable." The Core itself is the feedback system;
// there's no separate error-state UI beyond the plain text message required for accessibility.
const INSTABILITY_HOLD_MS = { 1: 1300, 2: 2400 };

/**
 * The "Continue Your Journey" flow — this is not the standalone `/login` page reused, and not a
 * modal: it's the same homepage scene, the Core already calm and waiting (no boot sequence, no
 * assembly-from-nothing — "the laboratory remembers them"), briefly preparing before the login
 * form fades in beside it. Reuses the exact same `/api/auth/login` request Login.jsx makes —
 * `AuthContext.login()` itself has no concept of failure, so this owns the fetch/error state
 * exactly as Login.jsx does, it just expresses the outcome through the Core instead of a banner.
 */
function AuthenticationScene({ onSuccess }) {
  const { login } = useAuth();
  const [ready, setReady] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [welcomeName, setWelcomeName] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [coreStage, setCoreStage] = useState('loading');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // "The Quantum Core slowly prepares for authentication. Only then does the login interface appear."
  // This path never boots, so it never touches `systemReadySignal` (that stays scoped to the New
  // User arc-reactor pulse) — but the user is now genuinely interacting with the app, and needs a
  // way back, so `navReadySignal` fires here instead. Without this, a user who never submits (or
  // fails repeatedly) was stuck on `/` with no Nav and no way back — this is the fix for that.
  useEffect(() => {
    const t = setTimeout(() => {
      setReady(true);
      setCoreStage('alive');
      navReadySignal.set(1);
    }, 1300);
    return () => clearTimeout(t);
  }, []);

  // Escalating instability — re-fires on every new failure, holding proportionally longer before
  // easing back to calm, rather than a single fixed reaction regardless of how many attempts.
  useEffect(() => {
    if (failedAttempts === 0) return undefined;
    setCoreStage('unstable');
    const hold = INSTABILITY_HOLD_MS[failedAttempts] ?? null; // 3rd+ stays unstable indefinitely
    if (hold == null) return undefined;
    const t = setTimeout(() => setCoreStage((current) => (current === 'unstable' ? 'alive' : current)), hold);
    return () => clearTimeout(t);
  }, [failedAttempts]);

  const handleChange = (event) => setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.detail || 'Login failed');
        setFailedAttempts((n) => n + 1);
        return;
      }
      login({ user_id: data.user_id, first_name: data.first_name, last_name: data.last_name, username: data.username, email: data.email }, data.token);
      setCoreStage('stabilizing');
      setWelcomeName(data.first_name || data.username);
      setSucceeded(true);
      // A successful login is just as much "onboarding complete" as the New User pulse — a
      // returning user who logs in and later comes back Home should skip the gate too.
      markOnboardingComplete();
      setTimeout(onSuccess, 1800);
    } catch {
      setError('Could not reach the server. Is it running?');
      setFailedAttempts((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeOut' } }}
      className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <QuantumCore stage={coreStage} className="h-48 w-48 sm:h-56 sm:w-56" particleCount={10} />

      <div className="mt-10 w-full max-w-sm">
        <AnimatePresence mode="wait">
          {succeeded ? (
            <motion.div key="welcome" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <h2 className="font-display text-2xl font-bold text-white">Welcome back{welcomeName ? `, ${welcomeName}` : ''}.</h2>
              <p className="mt-2 text-slate-400">The laboratory remembers you.</p>
            </motion.div>
          ) : !ready ? (
            <motion.p key="preparing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="font-mono text-xs uppercase tracking-[0.3em] text-quantum-cyan/60">
              Preparing authentication...
            </motion.p>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              onSubmit={handleSubmit}
              className="space-y-4 text-left"
            >
              <h2 className="text-center font-display text-2xl font-bold text-white">Continue Your Journey</h2>

              {error && (
                <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</div>
              )}

              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-slate-700 bg-quantum-panel/80 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-quantum-cyan focus:ring-1 focus:ring-quantum-cyan"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm text-slate-300">Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-quantum-panel/80 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-quantum-cyan focus:ring-1 focus:ring-quantum-cyan"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-quantum-gradient py-3 text-sm font-semibold text-slate-950 transition disabled:opacity-50"
              >
                {loading && <LoadingSpinner />}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
}

export default AuthenticationScene;
