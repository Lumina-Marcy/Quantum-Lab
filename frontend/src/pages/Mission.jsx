import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useMission } from '../context/MissionContext';
import VaultIcon from '../components/VaultIcon';
import VaultInput from '../components/VaultInput';
import SensitivityMeter from '../components/SensitivityMeter';
import MissionPreviewCard from '../components/MissionPreviewCard';
import { MISSIONS } from '../data/missions';

const EMPTY_FORM = { username: '', email: '', password: '', fullName: '', address: '', bankName: '', accountNumber: '' };

function UserDataForm({ profile, setProfile }) {
  const { user } = useAuth();
  const { setVault, clearVault } = useMission();
  const [form, setForm] = useState(EMPTY_FORM);
  const [securing, setSecuring] = useState(false);

  // Prefill from the existing account once it's available, without stomping on anything the user already typed.
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      username: prev.username || user.username || '',
      email: prev.email || user.email || '',
      fullName: prev.fullName || [user.first_name, user.last_name].filter(Boolean).join(' '),
    }));
  }, [user]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleAccountNumberChange(e) {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setForm((prev) => ({ ...prev, accountNumber: digitsOnly }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSecuring(true);
    setTimeout(() => {
      const { username, email, password, fullName, address, bankName, accountNumber } = form;
      setProfile({ username, email, passwordLength: password.length, fullName, address, bankName, accountNumber });
      setVault({ username, email, password, fullName, address, bankName, accountNumber });
      setSecuring(false);
    }, 700);
  }

  function handleReset() {
    setProfile(null);
    clearVault();
    setForm(EMPTY_FORM);
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/40 p-8 shadow-2xl shadow-purple-500/10"
      >
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:justify-between">
          <div className="max-w-xl text-center sm:text-left">
            <span className="inline-block rounded-full border border-purple-400/40 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-300">
              Mission Setup · Step 1 of 5
            </span>
            <h1 className="mt-4 text-4xl font-bold text-white">What's At Stake?</h1>
            <p className="mt-3 text-slate-400">
              Before entering the Password Vault mission, you'll create a fictional digital identity. Throughout the
              simulation you'll see exactly how personal information can be exposed when encryption fails.
            </p>
          </div>
          <VaultIcon className="h-36 w-36 shrink-0 sm:h-44 sm:w-44" />
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-slate-700 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/20 backdrop-blur-xl"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Your Data</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Lock In Your Digital Identity</h2>
          <p className="mt-2 text-slate-400">
            Enter sample personal information below. This data will be used throughout the mission to make the
            cybersecurity risks feel real and personal.
          </p>

          {!user ? (
            <div className="mt-6 rounded-2xl bg-slate-950/70 p-5">
              <p className="text-sm text-slate-400">
                Please{' '}
                <Link to="/login" className="text-cyan-400 hover:text-cyan-300">
                  log in
                </Link>{' '}
                to continue this mission.
              </p>
            </div>
          ) : profile ? (
            <div className="mt-6 space-y-4">
              <div className="space-y-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">👤 Username</span>
                  <span className="font-mono text-cyan-300">{profile.username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">✉️ Email</span>
                  <span className="font-mono text-cyan-300">{profile.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">🔑 Password</span>
                  <span className="font-mono text-cyan-300">{'•'.repeat(profile.passwordLength)}</span>
                </div>
                {profile.fullName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">🪪 Full Name</span>
                    <span className="font-mono text-cyan-300">{profile.fullName}</span>
                  </div>
                )}
                {profile.address && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">🏠 Address</span>
                    <span className="font-mono text-cyan-300">{profile.address}</span>
                  </div>
                )}
                {profile.bankName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">🏦 Bank</span>
                    <span className="font-mono text-cyan-300">{profile.bankName}</span>
                  </div>
                )}
                {profile.accountNumber && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">🔢 Account</span>
                    <span className="font-mono text-cyan-300">
                      {'•'.repeat(Math.max(0, profile.accountNumber.length - 4))}
                      {profile.accountNumber.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-emerald-400/80">✓ Vault secured. Ready to start the mission.</p>
              <button onClick={handleReset} className="text-xs text-slate-500 underline hover:text-slate-300">
                Change data
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-8">
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">Your Identity</p>
                <VaultInput
                  id="field-username"
                  name="username"
                  label="Username"
                  icon="👤"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="e.g. agent_42"
                  required
                />
                <VaultInput
                  id="field-email"
                  name="email"
                  label="Email"
                  icon="✉️"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. you@example.com"
                  required
                />
                <VaultInput
                  id="field-password"
                  name="password"
                  label="Password"
                  icon="🔑"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Choose a sample password"
                  required
                  helperText="This is the sample password used for this simulation — not your real account password."
                />
              </div>

              <div className="space-y-4 border-t border-slate-800 pt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">
                  Additional Details
                </p>
                <VaultInput
                  id="field-fullname"
                  name="fullName"
                  label="Full Name"
                  icon="🪪"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="John Smith"
                  autoComplete="name"
                />
                <VaultInput
                  id="field-address"
                  name="address"
                  label="Home Address"
                  icon="🏠"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="123 Main Street, City, State"
                  autoComplete="street-address"
                />
                <VaultInput
                  id="field-bank"
                  name="bankName"
                  label="Bank Name"
                  icon="🏦"
                  value={form.bankName}
                  onChange={handleChange}
                  placeholder="e.g. Chase, Bank of America, Capital One"
                />
                <VaultInput
                  id="field-account"
                  name="accountNumber"
                  label="Account Number"
                  icon="🔢"
                  inputMode="numeric"
                  value={form.accountNumber}
                  onChange={handleAccountNumberChange}
                  placeholder="123456789"
                  helperText="For educational purposes only. Please do not use a real account number if you are uncomfortable. Any combination of numbers will work."
                />
              </div>

              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={!form.username || !form.email || !form.password || securing}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-6 py-3.5 font-semibold text-slate-950 shadow-lg shadow-purple-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {securing ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      className="inline-block h-4 w-4 rounded-full border-2 border-slate-950/40 border-t-slate-950"
                    />
                    Securing...
                  </>
                ) : (
                  <>🔒 Secure My Vault</>
                )}
              </motion.button>
            </form>
          )}
        </motion.div>

        <SensitivityMeter form={form} />
      </div>
    </div>
  );
}

function Mission() {
  const { id } = useParams();
  const navigate = useNavigate();
  const mission = MISSIONS.find((m) => m.id === id) || MISSIONS[0];
  const isPasswordMission = id === '1';

  const [profile, setProfile] = useState(null);

  function handleStart() {
    if (isPasswordMission) {
      navigate('/mission/1/play', { state: profile });
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 space-y-6">
      <UserDataForm profile={profile} setProfile={setProfile} />

      {isPasswordMission ? (
        <MissionPreviewCard mission={mission} onStart={handleStart} canStart={Boolean(profile)} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-2xl shadow-slate-950/20"
        >
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Mission {id}</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">{mission.title}</h1>
          <p className="mt-4 text-slate-300">{mission.summary}</p>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl bg-slate-950/70 p-6">
              <h2 className="text-xl font-semibold text-cyan-200">1-Minute Interactive Experience</h2>
              <p className="mt-2 text-slate-300">Play through a scenario and make decisions that shape the outcome.</p>
            </div>
            <div className="rounded-2xl bg-slate-950/70 p-6">
              <h2 className="text-xl font-semibold text-cyan-200">Decision Point</h2>
              <p className="mt-2 text-slate-300">Choose strategies, then see consequences unfold in real time.</p>
            </div>
            <div className="rounded-2xl bg-slate-950/70 p-6">
              <h2 className="text-xl font-semibold text-cyan-200">How Did The Computer Think?</h2>
              <p className="mt-2 text-slate-300">Compare classical and quantum explanations side by side.</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Link to="/" className="rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700">
              Back to Home
            </Link>
            <button className="rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400">
              Start Mission
            </button>
          </div>
        </motion.div>
      )}
    </main>
  );
}

export default Mission;
