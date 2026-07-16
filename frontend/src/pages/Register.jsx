import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import QuantumCore from '../components/QuantumCore';
import { markOnboardingComplete } from '../utils/onboardingState';

const API = '/api/auth';
const REQUIRED_FIELDS = ['first_name', 'last_name', 'email', 'password'];
// Same escalation the login flows use — a wrong/invalid submission reads as visible instability
// that eases off, rather than a flat error state.
const INSTABILITY_HOLD_MS = { 1: 1300, 2: 2400 };
// How long the "noticed a field" flicker holds before settling back to `alive` — long enough for
// the loading stage's contract-then-expand keyframe (QuantumCore.jsx, ~1.3s) to actually play out.
const FIELD_REACTION_MS = 1400;
import { API_BASE_URL } from '../apiBase';

const API = `${API_BASE_URL}/api/auth`;

/**
 * The standalone `/register` page — same Core-as-feedback language as Login.jsx and the
 * homepage's AuthenticationScene: resting at `alive` (fully formed, matching the reference)
 * rather than starting dim and brightening with form completion — an earlier version tied
 * brightness continuously to fields filled, which left the Core looking sparse whenever the form
 * was empty. "Reacts as you input data" is a distinct, one-shot flicker instead: completing a
 * field (0 -> non-empty) briefly plays the `loading` stage's contract-then-expand before settling
 * back to `alive`, layered on top of an already-alive Core. Turns green and pulses
 * (`stabilizing`) the moment the account is genuinely created — not the instant the button is
 * clicked, since a duplicate email or a too-short password can still fail after that click.
 */
function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [coreStage, setCoreStage] = useState('alive');
  const filledCountRef = useRef(0);

  useEffect(() => {
    const filledCount = REQUIRED_FIELDS.filter((key) => form[key].trim()).length;
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
    if (failedAttempts === 0) return undefined;
    setCoreStage('unstable');
    const hold = INSTABILITY_HOLD_MS[failedAttempts] ?? null;
    if (hold == null) return undefined;
    const t = setTimeout(() => setCoreStage((current) => (current === 'unstable' ? 'alive' : current)), hold);
    return () => clearTimeout(t);
  }, [failedAttempts]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setCoreStage('loading');
    try {
      const body = { ...form };
      if (!body.username.trim()) delete body.username;

      const res = await fetch(`${API}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const detail = data.detail;
        const message = Array.isArray(detail) ? detail.map((d) => d.msg).join(', ') : detail;
        setError(message || 'Registration failed');
        setFailedAttempts((n) => n + 1);
        return;
      }
      const loginRes = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const loginData = await loginRes.json();
      login({ user_id: loginData.user_id, first_name: loginData.first_name, last_name: loginData.last_name, username: loginData.username, email: loginData.email }, loginData.token);
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
        <h1 className="font-display text-2xl font-bold text-white">Create account</h1>
        <p className="mt-2 text-slate-400">Join Quantum Lab and start exploring</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-left">
          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">First name</label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                placeholder="Jane"
                className="w-full rounded-xl border border-slate-700 bg-quantum-panel/80 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-quantum-cyan focus:ring-1 focus:ring-quantum-cyan"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm text-slate-300">Last name</label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                placeholder="Doe"
                className="w-full rounded-xl border border-slate-700 bg-quantum-panel/80 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-quantum-cyan focus:ring-1 focus:ring-quantum-cyan"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm text-slate-300">
              Username <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="leave blank to auto-generate"
              className="w-full rounded-xl border border-slate-700 bg-quantum-panel/80 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-quantum-cyan focus:ring-1 focus:ring-quantum-cyan"
            />
          </div>

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
              minLength={8}
              placeholder="at least 8 characters"
              className="w-full rounded-xl border border-slate-700 bg-quantum-panel/80 px-4 py-3 text-slate-100 placeholder-slate-500 outline-none focus:border-quantum-cyan focus:ring-1 focus:ring-quantum-cyan"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-quantum-gradient py-3 text-sm font-semibold text-slate-950 transition disabled:opacity-50"
          >
            {loading && <LoadingSpinner />}
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-quantum-cyan hover:text-cyan-300">
            Sign in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}

export default Register;
