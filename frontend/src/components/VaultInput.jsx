import { motion } from 'framer-motion';

/** Labeled input with an icon, real label/id association, and a focus glow. */
function VaultInput({
  id,
  name,
  label,
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  helperText,
  inputMode,
  autoComplete,
}) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <label htmlFor={id} className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
        <span aria-hidden="true">{icon}</span>
        {label}
        {required && <span className="text-cyan-400">*</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-white placeholder-slate-600 outline-none transition-all duration-200 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] focus:ring-2 focus:ring-cyan-400/40"
      />
      {helperText && <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{helperText}</p>}
    </motion.div>
  );
}

export default VaultInput;
