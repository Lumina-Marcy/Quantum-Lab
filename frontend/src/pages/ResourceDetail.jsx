import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { fetchLessonById, fetchLessons, groupByCategory } from '../data/lessonsApi';
import { getInteractive } from '../components/interactives';
import QuantumCore from '../components/QuantumCore';
import ResearchPath from '../components/ResearchPath';

function moduleNumber(index) {
  return String(index + 1).padStart(2, '0');
}

function ResourceHeader({ coreStage, coreProgress, hovered, pulseScale, pulseOpacity, label }) {
  return (
    <div className="relative flex items-center justify-center gap-4 border-b border-white/[0.06] py-6">
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute h-20 w-20 rounded-full"
        style={{
          scale: pulseScale,
          opacity: pulseOpacity,
          background: 'radial-gradient(circle, rgba(191,219,254,0.65) 0%, rgba(59,130,246,0.3) 45%, transparent 72%)',
        }}
      />
      <motion.div
        animate={{ scale: hovered ? 1.08 : 1, filter: hovered ? 'brightness(1.25)' : 'brightness(1)' }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <QuantumCore stage={coreStage} progress={coreProgress} className="h-14 w-14" particleCount={10} />
      </motion.div>
      <span className="font-mono text-xs uppercase tracking-[0.3em] text-slate-500">{label}</span>
    </div>
  );
}

function ResourceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(undefined);
  const [error, setError] = useState(false);
  const [allGroups, setAllGroups] = useState(null);

  const [coreStage, setCoreStage] = useState('awakening');
  const [hovered, setHovered] = useState(false);
  const corePulse = useMotionValue(0);
  const pulseScale = useTransform(corePulse, [0, 1], [0.4, 2.2]);
  const pulseOpacity = useTransform(corePulse, [0, 0.15, 1], [0, 0.55, 0]);
  const coreProgress = useMotionValue(0.6);

  useEffect(() => {
    setLesson(undefined);
    setError(false);
    setCoreStage('awakening');
    fetchLessonById(id)
      .then(setLesson)
      .catch(() => setError(true));
  }, [id]);

  useEffect(() => {
    fetchLessons()
      .then((all) => setAllGroups(groupByCategory(all).sort((a, b) => a.category.localeCompare(b.category))))
      .catch(() => {});
  }, []);

  // Module-intro beat: the Core synchronizes a moment after content arrives, rather than
  // snapping straight to fully resolved — a brief "the room is coming online" cue.
  useEffect(() => {
    if (!lesson) return;
    const t = setTimeout(() => setCoreStage('alive'), 550);
    return () => clearTimeout(t);
  }, [lesson]);

  const Interactive = lesson && getInteractive(lesson.interactive);

  const categoryGroup = allGroups?.find((g) => g.category === lesson?.category);
  const siblings = categoryGroup?.lessons ?? [];
  const moduleIndex = allGroups?.findIndex((g) => g.category === lesson?.category) ?? -1;
  const currentIndex = siblings.findIndex((s) => s.id === lesson?.id);
  const nextLesson = currentIndex >= 0 && currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : null;

  function handleContinue() {
    setCoreStage('stabilizing');
    animate(corePulse, [0, 1], { duration: 1.1, ease: 'easeOut' });
    setTimeout(() => {
      navigate(nextLesson ? `/resources/${nextLesson.id}` : '/resources');
    }, 650);
  }

  if (error) {
    return (
      <main className="min-h-screen bg-transparent">
        <ResourceHeader coreStage="unstable" coreProgress={coreProgress} hovered={false} pulseScale={pulseScale} pulseOpacity={pulseOpacity} label="Research Wing" />
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="text-slate-300">Couldn't load this lesson. Is the backend running?</p>
          <Link to="/resources" className="mt-4 inline-flex text-cyan-300 hover:text-cyan-200">
            ← Back to the Research Wing
          </Link>
        </div>
      </main>
    );
  }

  if (lesson === undefined) {
    return (
      <main className="min-h-screen bg-transparent">
        <ResourceHeader coreStage="loading" coreProgress={coreProgress} hovered={false} pulseScale={pulseScale} pulseOpacity={pulseOpacity} label="Research Wing" />
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="text-slate-400">Loading…</p>
        </div>
      </main>
    );
  }

  if (lesson === null) {
    return (
      <main className="min-h-screen bg-transparent">
        <ResourceHeader coreStage="unstable" coreProgress={coreProgress} hovered={false} pulseScale={pulseScale} pulseOpacity={pulseOpacity} label="Research Wing" />
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <p className="text-slate-300">Lesson not found.</p>
          <Link to="/resources" className="mt-4 inline-flex text-cyan-300 hover:text-cyan-200">
            ← Back to the Research Wing
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-transparent">
      <ResourceHeader
        coreStage={coreStage}
        coreProgress={coreProgress}
        hovered={hovered}
        pulseScale={pulseScale}
        pulseOpacity={pulseOpacity}
        label={moduleIndex >= 0 ? `Research Module ${moduleNumber(moduleIndex)}` : 'Research Wing'}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-3xl px-6 py-14"
      >
        <div className="text-center">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/80">{lesson.category}</p>
          <h1 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">{lesson.title}</h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-400">{lesson.summary}</p>
        </div>

        {Interactive && (
          <div
            className="mt-14"
            onPointerEnter={() => setHovered(true)}
            onPointerLeave={() => setHovered(false)}
          >
            <p className="text-center font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Experiment</p>
            <div className="mt-6">
              <Interactive />
            </div>
          </div>
        )}

        <div className="mt-14">
          <p className="text-center font-mono text-xs uppercase tracking-[0.3em] text-slate-500">Real-World Connection</p>
          <div className="mt-6 aspect-video overflow-hidden rounded-2xl">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${lesson.videoId}`}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {lesson.links?.length > 0 && (
          <div className="mt-14 border-t border-white/[0.06] pt-8">
            <p className="text-sm font-semibold text-cyan-300">Further reading</p>
            <ul className="mt-3 space-y-2">
              {lesson.links.map((link) => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noreferrer" className="text-cyan-300 hover:text-cyan-200">
                    {link.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-16 flex flex-col items-center gap-8 border-t border-white/[0.06] pt-10">
          <ResearchPath siblings={siblings} activeId={lesson.id} />
          <button
            onClick={handleContinue}
            className="rounded-full bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400"
          >
            Continue →
          </button>
        </div>
      </motion.div>
    </main>
  );
}

export default ResourceDetail;
