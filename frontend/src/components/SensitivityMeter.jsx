import { motion } from 'framer-motion';

const FIELDS = [
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'password', label: 'Password' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'address', label: 'Home Address' },
  { key: 'bankName', label: 'Bank Name' },
  { key: 'accountNumber', label: 'Account Number' },
];

/** Live "how much have you exposed" meter — ties the onboarding form to the later breach reveal. */
function SensitivityMeter({ form }) {
  const filledCount = FIELDS.filter((f) => form[f.key]?.trim()).length;
  const percent = Math.round((filledCount / FIELDS.length) * 100);

  return (
    <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-slate-900/80 p-6 shadow-lg shadow-purple-500/10">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-purple-300">🔐 Digital Identity</p>

      <ul className="mt-4 space-y-2 text-sm">
        {FIELDS.map((f) => {
          const isFilled = Boolean(form[f.key]?.trim());
          return (
            <li key={f.key} className={`flex items-center gap-2 ${isFilled ? 'text-cyan-200' : 'text-slate-600'}`}>
              <span aria-hidden="true">{isFilled ? '✓' : '○'}</span>
              {f.label}
            </li>
          );
        })}
      </ul>

      <div className="mt-5 border-t border-slate-700/60 pt-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Exposure Risk</p>
        <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-red-500"
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        <p className="mt-1 text-right text-xs font-mono text-slate-400">{percent}%</p>
      </div>

      <p className="mt-4 text-xs italic leading-relaxed text-slate-500">
        The more information stored online, the greater the impact if encryption fails.
      </p>
    </div>
  );
}

export default SensitivityMeter;
