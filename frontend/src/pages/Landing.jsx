import { Shield, Sparkles, Atom, FlaskConical, Lock, Cpu, Brain } from 'lucide-react';
import AnimatedBackground from '../components/AnimatedBackground';
import HeroSection from '../components/HeroSection';
import FeatureRow from '../components/FeatureRow';
import EditorialColumn from '../components/EditorialColumn';
import NarrativeDivider from '../components/NarrativeDivider';
import SystemReadyBanner from '../components/SystemReadyBanner';
import MissionGrid from '../components/MissionGrid';
import SandboxPreview from '../components/SandboxPreview';
import QuoteSection from '../components/QuoteSection';
import Footer from '../components/Footer';

const WHY_QUANTUM_LAB = [
  { icon: Shield, title: 'Interactive Missions', description: 'Real-world cybersecurity scenarios.' },
  { icon: Sparkles, title: 'Learn by Doing', description: 'Make decisions and see consequences.' },
  { icon: Atom, title: 'Quantum Simulations', description: 'Visualize concepts instead of reading definitions.' },
  { icon: FlaskConical, title: 'Safe Sandbox', description: 'Experiment freely with no technical background required.' },
];

const WHY_QUANTUM_MATTERS = [
  {
    icon: Lock,
    title: 'Privacy',
    description:
      "Today's encryption protects everything from private messages to financial transactions — it's the invisible infrastructure modern life runs on.",
  },
  {
    icon: Cpu,
    title: 'Discovery',
    description:
      "Quantum computers don't just get faster. They solve certain problems in fundamentally different ways than any machine that came before them.",
  },
  {
    icon: Brain,
    title: 'Preparation',
    description:
      'Understanding these concepts today means being ready for a future where the rules of computing — and security — change.',
  },
];

// Screen 0 — the cinematic homepage: what Quantum Lab is, what you can do, why it matters.
function Landing() {
  return (
    <main className="relative">
      <AnimatedBackground />

      <HeroSection />

      <NarrativeDivider>What happens when today's encryption meets tomorrow's computers?</NarrativeDivider>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="max-w-xl">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Why Quantum Lab?</h2>
          <p className="mt-4 text-slate-400">
            A hands-on way to build intuition for a technology that's still mostly theory to most people.
          </p>
        </div>
        <div className="mt-10">
          {WHY_QUANTUM_LAB.map((f, i) => (
            <FeatureRow key={f.title} icon={f.icon} title={f.title} description={f.description} index={i} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">Why Quantum Matters</h2>
        <div className="mt-14 grid gap-12 sm:grid-cols-3">
          {WHY_QUANTUM_MATTERS.map((f, i) => (
            <EditorialColumn key={f.title} icon={f.icon} title={f.title} description={f.description} index={i} />
          ))}
        </div>
      </section>

      <NarrativeDivider>Choose your first mission.</NarrativeDivider>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <SystemReadyBanner />
        <div className="mt-14">
          <MissionGrid />
        </div>
      </section>

      <NarrativeDivider>See consequences unfold. Experiment safely.</NarrativeDivider>

      <SandboxPreview />
      <QuoteSection />
      <Footer />
    </main>
  );
}

export default Landing;
