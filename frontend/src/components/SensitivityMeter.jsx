import { motion } from 'framer-motion';
import { KeyRound, CircleCheck, Circle } from 'lucide-react';

const FIELDS = [
  { key: 'username', label: 'Username' },
  { key: 'email', label: 'Email' },
  { key: 'password', label: 'Password' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'phone', label: 'Phone Number' },
  { key: 'address', label: 'Home Address' },
  { key: 'bankName', label: 'Bank Name' },
  { key: 'accountNumber', label: 'Account Number' },
  { key: 'cardNickname', label: 'Credit Card' },
  { key: 'investmentAccount', label: 'Investment Account' },
  { key: 'doctorName', label: "Doctor's Name" },
  { key: 'primaryHospital', label: 'Primary Hospital' },
  { key: 'insuranceProvider', label: 'Insurance Provider' },
  { key: 'medicalPortal', label: 'Medical Portal' },
  { key: 'streaming', label: 'Streaming Services' },
  { key: 'social', label: 'Social Accounts' },
  { key: 'gaming', label: 'Gaming' },
  { key: 'work', label: 'Work Accounts' },
];

function isFilled(value) {
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(value?.trim());
}

/** Live "how much have you exposed" meter — ties the onboarding form to the later breach reveal. */
function SensitivityMeter({ form }) {
  const filledCount = FIELDS.filter((f) => isFilled(form[f.key])).length;
  const percent = Math.round((filledCount / FIELDS.length) * 100);

  return (
    <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-950/40 to-slate-900/80 p-6 shadow-lg shadow-purple-500/10">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-purple-300">
        <KeyRound className="h-3.5 w-3.5" /> Digital Identity
      </p>

      <ul className="mt-4 space-y-2 text-sm">
        {FIELDS.map((f) => {
          const filled = isFilled(form[f.key]);
          return (
            <li key={f.key} className={`flex items-center gap-2 ${filled ? 'text-cyan-200' : 'text-slate-600'}`}>
              {filled ? <CircleCheck className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
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
