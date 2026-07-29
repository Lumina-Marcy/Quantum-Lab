import { Link } from 'react-router-dom';

/** Quantum Learning Path — a dot-line sequence through a category's lessons, replacing generic Previous/Next. */
function ResearchPath({ siblings, activeId }) {
  if (siblings.length < 2) return null;

  return (
    <nav aria-label="Research module path" className="flex flex-wrap items-start justify-center gap-x-1 gap-y-4">
      {siblings.map((lesson, i) => {
        const active = lesson.id === activeId;
        return (
          <div key={lesson.id} className="flex items-start">
            {i > 0 && <span className="mt-[5px] h-px w-8 shrink-0 bg-white/10 sm:w-12" />}
            <Link to={`/resources/${lesson.id}`} className="group flex w-20 flex-col items-center gap-2 text-center sm:w-24">
              <span
                className={`h-2.5 w-2.5 rounded-full transition-colors ${
                  active ? 'bg-cyan-400 shadow-[0_0_8px_1px_rgba(34,211,238,0.5)]' : 'bg-slate-700 group-hover:bg-slate-500'
                }`}
              />
              <span className={`text-[11px] leading-tight transition-colors ${active ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-300'}`}>
                {lesson.title}
              </span>
            </Link>
          </div>
        );
      })}
    </nav>
  );
}

export default ResearchPath;
