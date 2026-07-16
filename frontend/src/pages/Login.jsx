import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import QuantumCore from '../components/QuantumCore';
import { markOnboardingComplete } from '../utils/onboardingState';

const API = '/api/auth';
const FIELDS = ['email', 'password'];
import { API_BASE_URL } from '../apiBase';
import { consumeSessionExpiredMessage } from '../authFetch';

const API = `${API_BASE_URL}/api/auth`;

// Same escalation as the homepage's AuthenticationScene.jsx — 1st wrong attempt is a brief
// flicker, 2nd holds longer, 3rd+ stays visibly unstable until it either succeeds or resets.
const INSTABILITY_HOLD_MS = { 1: 1300, 2: 2400 };
// How long the "noticed a field" flicker holds before settling back to `alive` — long enough for
// the loading stage's contract-then-expand keyframe (QuantumCore.jsx, ~1.3s) to actually play out.
const FIELD_REACTION_MS = 1400;

/**
 * The standalone `/login` page — previously had no Core at all, which read as inconsistent with
 * the homepage's "Continue Your Journey" scene (the same login, just reached a different way).
 * Reuses that scene's exact stage language and resting appearance (`alive`, fully formed — same
 * as the reference) rather than starting dim and building up: an earlier version tied the Core's
 * brightness continuously to how many fields were filled, which meant it looked sparse/undetailed
 * whenever the form was empty — nothing like the reference. "Reacts as you input data" is now a
 * distinct, one-shot event instead: completing a field (going from empty to non-empty) briefly
 * flickers the Core through `loading`'s contract-then-expand before settling back to `alive`,
 * layered on top of an already fully-formed Core rather than replacing it.
 */
function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [coreStage, setCoreStage] = useState('alive');
  const filledCountRef = useRef(0);

  useEffect(() => {
    if (failedAttempts === 0) return undefined;
    setCoreStage('unstable');
    const hold = INSTABILITY_HOLD_MS[failedAttempts] ?? null; // 3rd+ stays unstable indefinitely
    if (hold == null) return undefined;
    const t = setTimeout(() => setCoreStage((current) => (current === 'unstable' ? 'alive' : current)), hold);
    return () => clearTimeout(t);
  }, [failedAttempts]);

  // Fires only when a field newly gains content (0 -> non-empty), not on every keystroke — a
  // continuous per-character reaction would be twitchy rather than purposeful.
  useEffect(() => {
    const filledCount = FIELDS.filter((key) => form[key].trim()).length;
    if (filledCount > filledCountRef.current) {
      setCoreStage('loading');
      const t = setTimeout(() => setCoreStage((current) => (current === 'loading' ? 'alive' : current)), FIELD_REACTION_MS);
      filledCountRef.current = filledCount;
      return () => clearTimeout(t);
    }
    filledCountRef.current = filledCount;
    return undefined;
  }, [form]);

  useEffect(() => {
    const message = consumeSessionExpiredMessage();
    if (message) setError(message);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setCoreStage('loading');
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
      markOnboardingComplete();
      setTimeout(() => navigate('/'), 1300);
    } catch {
      setError('Could not reach the server. Is it running?');
      setFailedAttempts((n) => n + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <QuantumCore stage={coreStage} className="h-48 w-48 sm:h-56 sm:w-56" particleCount={10} />

      {/* No card here on purpose — matches "Continue Your Journey" (AuthenticationScene.jsx)
          exactly: the form sits directly on the shared space background, not inside a bordered
          panel. Only the inputs themselves carry a subtle background/border, same as there. */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mt-10 w-full max-w-sm"
      >
        <h1 className="font-display text-2xl font-bold text-white">Welcome back</h1>
        <p className="mt-2 text-slate-400">Sign in to your Quantum Lab account</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
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
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link to="/register" className="text-quantum-cyan hover:text-cyan-300">
            Create one
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

export default Login;
