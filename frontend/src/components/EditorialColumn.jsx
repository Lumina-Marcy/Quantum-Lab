import { motion } from 'framer-motion';

/** Minimal icon + title + paragraph column — no card chrome, Apple-product-page style. */
function EditorialColumn({ icon: Icon, title, description, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.55, delay: index * 0.1 }}
      className="text-center sm:text-left"
    >
      <Icon size={26} strokeWidth={1.5} className="mx-auto text-violet-300 sm:mx-0" />
      <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 leading-relaxed text-slate-400">{description}</p>
    </motion.div>
  );
}

export default EditorialColumn;
