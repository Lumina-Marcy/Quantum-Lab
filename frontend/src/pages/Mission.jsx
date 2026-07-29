import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, KeyRound, IdCard, Home, Building2, Hash, CircleCheck, Lock, Phone,
  CreditCard, TrendingUp, Stethoscope, Hospital, ShieldPlus, Globe, Fingerprint,
  ArrowLeft, ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useMission } from '../context/MissionContext';
import Panel from '../components/Panel';
import VaultIcon from '../components/VaultIcon';
import VaultInput from '../components/VaultInput';
import ChipToggle from '../components/ChipToggle';
import SensitivityMeter from '../components/SensitivityMeter';
import MissionPreviewCard from '../components/MissionPreviewCard';
import LoadingSpinner from '../components/LoadingSpinner';
import QuantumCore from '../components/QuantumCore';
import { fetchMissionById } from '../data/missionsApi';
import { generateFictionalSsn } from '../utils/ssn';

const EMPTY_FORM = {
  username: '', email: '', password: '',
  fullName: '', phone: '', address: '',
  bankName: '', accountNumber: '', cardNickname: '', investmentAccount: '',
  doctorName: '', primaryHospital: '', insuranceProvider: '', medicalPortal: '',
  streaming: [], social: [], gaming: [], work: [],
};

const STREAMING_OPTIONS = ['Netflix', 'Disney+', 'Spotify', 'Apple Music', 'Amazon Prime', 'Hulu', 'Max', 'YouTube Premium'];
const SOCIAL_OPTIONS = ['Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'X', 'Reddit', 'GitHub', 'Discord'];
const GAMING_OPTIONS = ['Steam', 'Xbox', 'PlayStation', 'Nintendo', 'Epic Games'];
const WORK_OPTIONS = ['Microsoft 365', 'Google Workspace', 'Slack', 'Dropbox', 'Zoom'];

const WIZARD_STEPS = ['Identity & Contact', 'Financial & Medical', 'Services You Use'];

function ChipGroup({ label, options, selected, onToggle }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((opt) => (
          <ChipToggle key={opt} label={opt} selected={selected.includes(opt)} onToggle={() => onToggle(opt)} />
        ))}
      </div>
    </div>
  );
}

function UserDataForm({ profile, setProfile }) {
  const { user } = useAuth();
  const { setVault, clearVault } = useMission();
  const [form, setForm] = useState(EMPTY_FORM);
  const [step, setStep] = useState(1);
  const [securing, setSecuring] = useState(false);
  const [ssn] = useState(() => generateFictionalSsn());

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

  function toggleChip(category, value) {
    setForm((prev) => {
      const list = prev[category];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { ...prev, [category]: next };
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSecuring(true);
    setTimeout(() => {
      const data = { ...form, ssn, passwordLength: form.password.length };
      setProfile(data);
      setVault({ ...form, ssn });
      setSecuring(false);
    }, 700);
  }

  function handleReset() {
    setProfile(null);
    clearVault();
    setForm(EMPTY_FORM);
    setStep(1);
  }

  const step1Valid = form.username && form.email && form.password;

  return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <VaultIcon className="h-20 w-20" />
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-quantum-cyan/70">Mission Setup · Step 1 of 5</p>
          <h1 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">What's At Stake?</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">
            Before entering the Password Vault mission, you'll create a fictional digital identity. Throughout the
            simulation you'll see exactly how personal information can be exposed when encryption fails.
          </p>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Panel className="p-8">
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">Your Data</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-white">Lock In Your Digital Identity</h2>
            <p className="mt-2 text-slate-400">
              Enter sample personal information below. This data will be used throughout the mission to make the
              cybersecurity risks feel real and personal.
            </p>

            {!user ? (
              <p className="mt-8 text-sm text-slate-400">
                Please{' '}
                <Link to="/login" className="text-cyan-400 hover:text-cyan-300">
                  log in
                </Link>{' '}
                to continue this mission.
              </p>
            ) : profile ? (
              <div className="mt-8 space-y-4">
                <div className="space-y-2.5 border-t border-slate-800 pt-5 text-sm">
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400"><User className="h-3.5 w-3.5" /> Username</span>
                    <span className="font-mono text-cyan-300">{profile.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400"><Mail className="h-3.5 w-3.5" /> Email</span>
                    <span className="font-mono text-cyan-300">{profile.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400"><KeyRound className="h-3.5 w-3.5" /> Password</span>
                    <span className="font-mono text-cyan-300">{'•'.repeat(profile.passwordLength)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400"><Fingerprint className="h-3.5 w-3.5" /> SSN</span>
                    <span className="font-mono text-cyan-300">{profile.ssn}</span>
                  </div>
                  {profile.fullName && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400"><IdCard className="h-3.5 w-3.5" /> Full Name</span>
                      <span className="font-mono text-cyan-300">{profile.fullName}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400"><Phone className="h-3.5 w-3.5" /> Phone</span>
                      <span className="font-mono text-cyan-300">{profile.phone}</span>
                    </div>
                  )}
                  {profile.address && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400"><Home className="h-3.5 w-3.5" /> Address</span>
                      <span className="font-mono text-cyan-300">{profile.address}</span>
                    </div>
                  )}
                  {profile.bankName && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400"><Building2 className="h-3.5 w-3.5" /> Bank</span>
                      <span className="font-mono text-cyan-300">{profile.bankName}</span>
                    </div>
                  )}
                  {profile.accountNumber && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400"><Hash className="h-3.5 w-3.5" /> Account</span>
                      <span className="font-mono text-cyan-300">
                        {'•'.repeat(Math.max(0, profile.accountNumber.length - 4))}
                        {profile.accountNumber.slice(-4)}
                      </span>
                    </div>
                  )}
                  {profile.primaryHospital && (
                    <div className="flex justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400"><Hospital className="h-3.5 w-3.5" /> Hospital</span>
                      <span className="font-mono text-cyan-300">{profile.primaryHospital}</span>
                    </div>
                  )}
                  {[
                    ['Streaming', profile.streaming],
                    ['Social', profile.social],
                    ['Gaming', profile.gaming],
                    ['Work', profile.work],
                  ].map(
                    ([label, list]) =>
                      list.length > 0 && (
                        <div key={label} className="flex justify-between gap-4">
                          <span className="flex shrink-0 items-center gap-1.5 text-slate-400"><Globe className="h-3.5 w-3.5" /> {label}</span>
                          <span className="text-right font-mono text-cyan-300">{list.join(', ')}</span>
                        </div>
                      )
                  )}
                </div>
                <p className="flex items-center gap-1.5 text-xs text-emerald-400/80">
                  <CircleCheck className="h-3.5 w-3.5" /> Vault secured. Ready to start the mission.
                </p>
                <button onClick={handleReset} className="text-xs text-slate-500 underline hover:text-slate-300">
                  Change data
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-6">
                <div className="mb-6 flex items-center justify-center gap-2">
                  {WIZARD_STEPS.map((label, i) => (
                    <div key={label} className="flex items-center gap-2">
                      {i > 0 && <span className="h-px w-6 bg-white/10" />}
                      <span
                        className={`text-xs font-medium uppercase tracking-wide transition-colors ${
                          step === i + 1 ? 'text-cyan-300' : step > i + 1 ? 'text-slate-500' : 'text-slate-700'
                        }`}
                      >
                        {i + 1}. {label}
                      </span>
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <VaultInput
                        id="field-username" name="username" label="Username" icon={User}
                        value={form.username} onChange={handleChange} placeholder="e.g. agent_42" required
                      />
                      <VaultInput
                        id="field-email" name="email" label="Email" icon={Mail} type="email"
                        value={form.email} onChange={handleChange} placeholder="e.g. you@example.com" required
                      />
                      <VaultInput
                        id="field-password" name="password" label="Password" icon={KeyRound} type="password"
                        value={form.password} onChange={handleChange} placeholder="Choose a sample password" required
                        helperText="This is the sample password used for this simulation — not your real account password."
                      />
                      <VaultInput
                        id="field-fullname" name="fullName" label="Full Name" icon={IdCard}
                        value={form.fullName} onChange={handleChange} placeholder="John Smith" autoComplete="name"
                      />
                      <VaultInput
                        id="field-phone" name="phone" label="Phone Number" icon={Phone} type="tel"
                        value={form.phone} onChange={handleChange} placeholder="(555) 123-4567" autoComplete="tel"
                      />
                      <VaultInput
                        id="field-address" name="address" label="Home Address" icon={Home}
                        value={form.address} onChange={handleChange} placeholder="123 Main Street, City, State" autoComplete="street-address"
                      />
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-8"
                    >
                      <div className="space-y-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">Financial</p>
                        <VaultInput
                          id="field-bank" name="bankName" label="Bank Name" icon={Building2}
                          value={form.bankName} onChange={handleChange} placeholder="e.g. Chase, Bank of America, Capital One"
                        />
                        <VaultInput
                          id="field-account" name="accountNumber" label="Account Number" icon={Hash} inputMode="numeric"
                          value={form.accountNumber} onChange={handleAccountNumberChange} placeholder="123456789"
                          helperText="For educational purposes only. Please do not use a real account number if you are uncomfortable. Any combination of numbers will work."
                        />
                        <VaultInput
                          id="field-card" name="cardNickname" label="Credit Card Nickname" icon={CreditCard}
                          value={form.cardNickname} onChange={handleChange} placeholder="e.g. Travel Rewards Card"
                        />
                        <VaultInput
                          id="field-investment" name="investmentAccount" label="Investment Account (optional)" icon={TrendingUp}
                          value={form.investmentAccount} onChange={handleChange} placeholder="e.g. Fidelity Brokerage"
                        />
                      </div>

                      <div className="space-y-4 border-t border-slate-800 pt-6">
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300/80">Medical Records</p>
                        <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3">
                          <p className="flex items-center gap-2 text-sm text-slate-300">
                            <Fingerprint className="h-4 w-4 text-quantum-cyan" /> Social Security Number
                          </p>
                          <p className="mt-1 font-mono text-lg text-cyan-300">{ssn}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            Auto-generated and fictional — you never have to enter your real SSN.
                          </p>
                        </div>
                        <VaultInput
                          id="field-doctor" name="doctorName" label="Doctor's Name" icon={Stethoscope}
                          value={form.doctorName} onChange={handleChange} placeholder="Dr. Sample"
                        />
                        <VaultInput
                          id="field-hospital" name="primaryHospital" label="Primary Hospital" icon={Hospital}
                          value={form.primaryHospital} onChange={handleChange} placeholder="e.g. St. Mary's Medical Center"
                        />
                        <VaultInput
                          id="field-insurance" name="insuranceProvider" label="Insurance Provider" icon={ShieldPlus}
                          value={form.insuranceProvider} onChange={handleChange} placeholder="e.g. Blue Cross"
                        />
                        <VaultInput
                          id="field-portal" name="medicalPortal" label="Medical Portal" icon={Globe}
                          value={form.medicalPortal} onChange={handleChange} placeholder="e.g. MyChart"
                        />
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-7"
                    >
                      <p className="text-sm text-slate-400">Click any services you actually use — this determines what shows up later in the simulation.</p>
                      <ChipGroup label="Streaming Services" options={STREAMING_OPTIONS} selected={form.streaming} onToggle={(v) => toggleChip('streaming', v)} />
                      <ChipGroup label="Social Accounts" options={SOCIAL_OPTIONS} selected={form.social} onToggle={(v) => toggleChip('social', v)} />
                      <ChipGroup label="Gaming" options={GAMING_OPTIONS} selected={form.gaming} onToggle={(v) => toggleChip('gaming', v)} />
                      <ChipGroup label="Work Accounts" options={WORK_OPTIONS} selected={form.work} onToggle={(v) => toggleChip('work', v)} />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-8 flex items-center justify-between gap-3">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s - 1)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:border-slate-500"
                    >
                      <ArrowLeft className="h-4 w-4" /> Back
                    </button>
                  ) : (
                    <span />
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => s + 1)}
                      disabled={step === 1 && !step1Valid}
                      className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-6 py-2.5 font-semibold text-slate-950 shadow-lg shadow-purple-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={securing}
                      className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-purple-500/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {securing ? (
                        <>
                          <LoadingSpinner />
                          Securing...
                        </>
                      ) : (
                        <><Lock className="h-4 w-4" /> Secure My Vault</>
                      )}
                    </motion.button>
                  )}
                </div>
              </form>
            )}
          </Panel>
        </motion.div>

        <SensitivityMeter form={form} />
      </div>
    </div>
  );
}

const WALKTHROUGH_SLIDES = [
  {
    kicker: 'Welcome',
    title: 'Welcome to Password Vault',
    body: "Today's mission simulates how a future quantum computer could compromise encrypted personal information. Your objective is to strengthen your digital vault before an attack occurs.",
  },
  {
    kicker: 'Step 1',
    title: 'Build Your Vault',
    body: 'You just protected the sensitive information a quantum computer will target — every detail you entered will show up later in the simulation.',
  },
  {
    kicker: 'Step 2',
    title: 'Watch the Attack',
    body: 'A quantum algorithm breaks your master password. This part is unavoidable — it sets up the real decision-making ahead.',
  },
  {
    kicker: 'Step 3',
    title: 'Protect Your Information',
    body: "Once the vault's front door is open, you'll respond to security events in real time — deciding which accounts to defend first.",
  },
  {
    kicker: 'Step 4',
    title: 'Learn Why Your Choices Matter',
    body: 'Afterward, compare how a classical computer and a quantum computer approach the same attack — and see exactly why the difference matters.',
  },
];

function MissionWalkthrough({ onBegin }) {
  const [slide, setSlide] = useState(0);
  const isLast = slide === WALKTHROUGH_SLIDES.length - 1;
  const current = WALKTHROUGH_SLIDES[slide];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-10"
    >
      <div className="flex items-center gap-3">
        <QuantumCore stage="alive" className="h-10 w-10" particleCount={8} />
        <span className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Mission Control</span>
      </div>

      <div className="mt-10 w-full max-w-lg text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">{current.kicker}</p>
            <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">{current.title}</h1>
            <p className="mx-auto mt-4 max-w-md text-slate-400">{current.body}</p>
          </motion.div>
        </AnimatePresence>

        <div className="mt-10 flex items-center justify-center gap-2">
          {WALKTHROUGH_SLIDES.map((_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === slide ? 'w-6 bg-cyan-400' : 'w-1.5 bg-slate-700'}`} />
          ))}
        </div>

        <div className="mt-8 flex items-center justify-center gap-3">
          {slide > 0 && (
            <button
              onClick={() => setSlide((s) => s - 1)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 px-5 py-2.5 text-sm text-slate-300 hover:border-slate-500"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}
          {isLast ? (
            <button
              onClick={onBegin}
              className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
            >
              Begin Mission
            </button>
          ) : (
            <button
              onClick={() => setSlide((s) => s + 1)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 px-6 py-2.5 font-semibold text-slate-950 shadow-lg shadow-purple-500/30 transition hover:brightness-110"
            >
              Next <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Missions with a working gameplay page — the map value is the route to launch into. Password
// Vault additionally needs UserDataForm above (it seeds the vault the breach narration reads
// from); other playable missions need no such setup step and can jump straight to a Start button.
const PLAYABLE_ROUTES = { 1: '/mission/1/play', 2: '/mission/2/play', 3: '/mission/3/play', 4: '/mission/4/play', 5: '/mission/5/play' };

function Mission() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isPasswordMission = id === '3';
  const playRoute = PLAYABLE_ROUTES[id];

  const [mission, setMission] = useState(null);
  const [missionError, setMissionError] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setMission(null);
    setMissionError(false);
    fetchMissionById(id)
      .then((data) => {
        if (cancelled) return;
        if (data) setMission(data);
        else setMissionError(true);
      })
      .catch(() => {
        if (!cancelled) setMissionError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleStart() {
    if (!playRoute) return;
    if (isPasswordMission) {
      setShowWalkthrough(true);
      return;
    }
    navigate(playRoute, { state: profile });
  }

  function handleBeginMission() {
    navigate(playRoute, { state: profile });
  }

  if (showWalkthrough) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <MissionWalkthrough onBegin={handleBeginMission} />
      </main>
    );
  }

  if (missionError) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16 text-center text-slate-400">
        Couldn't load this mission. Is the backend running?
      </main>
    );
  }

  if (!mission) {
    return <main className="mx-auto max-w-4xl px-6 py-16 text-center text-slate-400">Loading…</main>;
  }

  const isAvailable = mission.status === 'available';

  return (
    <main className="mx-auto max-w-4xl px-6 py-16 space-y-10">
      {isPasswordMission && <UserDataForm profile={profile} setProfile={setProfile} />}

      {playRoute ? (
        <MissionPreviewCard
          mission={mission}
          onStart={handleStart}
          canStart={isPasswordMission ? Boolean(profile) : true}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-quantum-cyan/70">Mission {id}</p>
          <h1 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">{mission.title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">{mission.summary}</p>

          <div className="mx-auto mt-10 max-w-md divide-y divide-slate-800 text-left">
            <div className="py-4">
              <h2 className="font-display text-lg font-semibold text-white">1-Minute Interactive Experience</h2>
              <p className="mt-1.5 text-sm text-slate-400">Play through a scenario and make decisions that shape the outcome.</p>
            </div>
            <div className="py-4">
              <h2 className="font-display text-lg font-semibold text-white">Decision Point</h2>
              <p className="mt-1.5 text-sm text-slate-400">Choose strategies, then see consequences unfold in real time.</p>
            </div>
            <div className="py-4">
              <h2 className="font-display text-lg font-semibold text-white">How Did The Computer Think?</h2>
              <p className="mt-1.5 text-sm text-slate-400">Compare classical and quantum explanations side by side.</p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link to="/" className="rounded-full bg-slate-800 px-5 py-3 text-slate-200 hover:bg-slate-700">
              Back to Home
            </Link>
            {isAvailable ? (
              <button
                onClick={handleStart}
                className="rounded-full bg-cyan-500 px-5 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
              >
                Start Mission
              </button>
            ) : (
              <button
                disabled
                className="cursor-not-allowed rounded-full bg-slate-800 px-5 py-3 font-semibold text-slate-500"
              >
                Coming Soon
              </button>
            )}
          </div>
        </motion.div>
      )}
    </main>
  );
}

export default Mission;
