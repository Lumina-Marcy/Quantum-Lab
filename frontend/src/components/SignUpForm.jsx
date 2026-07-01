import { useState } from 'react';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:8000';

const initialForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
};

function SignUpForm() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus('submitting');
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.detail)
          ? data.detail.map((item) => item.msg).join(', ')
          : data.detail || 'Something went wrong. Please try again.';
        throw new Error(message);
      }

      setStatus('success');
      setForm(initialForm);
    } catch (err) {
      setStatus('error');
      setError(err.message);
    }
  };

  return (
    <section className="mt-14 rounded-3xl border border-slate-700 bg-slate-900/80 p-8">
      <div className="mx-auto max-w-xl text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Get Started</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Create your account</h2>
        <p className="mt-3 text-slate-300">Sign up to save your mission progress and sandbox runs.</p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="mx-auto mt-8 grid max-w-xl gap-4 sm:grid-cols-2"
      >
        <div className="sm:col-span-1">
          <label htmlFor="firstName" className="mb-1 block text-sm text-slate-300">
            First name
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            value={form.firstName}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none focus:border-cyan-400"
          />
        </div>

        <div className="sm:col-span-1">
          <label htmlFor="lastName" className="mb-1 block text-sm text-slate-300">
            Last name
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            value={form.lastName}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none focus:border-cyan-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="email" className="mb-1 block text-sm text-slate-300">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none focus:border-cyan-400"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="password" className="mb-1 block text-sm text-slate-300">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none focus:border-cyan-400"
          />
          <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'submitting' ? 'Creating account…' : 'Create account'}
          </button>
        </div>

        {status === 'success' && (
          <p className="sm:col-span-2 text-center text-sm text-emerald-400">
            Account created! You can now log in.
          </p>
        )}
        {status === 'error' && (
          <p className="sm:col-span-2 text-center text-sm text-red-400">{error}</p>
        )}
      </motion.form>
    </section>
  );
}

export default SignUpForm;
