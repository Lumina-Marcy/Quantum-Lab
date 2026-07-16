import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import AnimatedBackground from '../components/AnimatedBackground';
import HeroSection from '../components/HeroSection';
import BootSequence from '../components/BootSequence';
import AuthenticationScene from '../components/AuthenticationScene';
import PossibilityGallery from '../components/PossibilityGallery';
import WhyQuantumLab from '../components/WhyQuantumLab';
import QuantumExplainer from '../components/QuantumExplainer';
import NarrativeDivider from '../components/NarrativeDivider';
import Button from '../components/Button';
import QuoteSection from '../components/QuoteSection';
import Footer from '../components/Footer';
import { navReadySignal } from '../utils/systemReadySignal';
import { hasCompletedOnboarding, markOnboardingComplete } from '../utils/onboardingState';
import MedicineIllustration from '../components/illustrations/MedicineIllustration';
import AIIllustration from '../components/illustrations/AIIllustration';
import ScientificDiscoveryIllustration from '../components/illustrations/ScientificDiscoveryIllustration';
import ClimateIllustration from '../components/illustrations/ClimateIllustration';
import OptimizationIllustration from '../components/illustrations/OptimizationIllustration';
import FinanceIllustration from '../components/illustrations/FinanceIllustration';
import MaterialsIllustration from '../components/illustrations/MaterialsIllustration';
import CybersecurityIllustration from '../components/illustrations/CybersecurityIllustration';

// Stage 3 — Discovery: possibility, not missions yet. Default state shows only a name; hovering
// turns the entire card into a cinematic animation canvas, then reveals one revolutionary
// statement — visual intuition first, explanation second. 8 categories divide evenly into a 4x2 grid.
const POSSIBILITIES = [
  { illustration: MedicineIllustration, title: 'Medicine', statement: 'Redefine how humanity discovers life-saving treatments.' },
  { illustration: AIIllustration, title: 'Artificial Intelligence', statement: "Unlock reasoning beyond today's computational limits." },
  { illustration: ClimateIllustration, title: 'Climate Modeling', statement: 'Forecast decades of climate behavior with unprecedented precision.' },
  { illustration: CybersecurityIllustration, title: 'Cybersecurity', statement: "Protect tomorrow's world before quantum arrives." },
  { illustration: OptimizationIllustration, title: 'Optimization', statement: 'Reimagine how goods move across the world.' },
  { illustration: FinanceIllustration, title: 'Finance', statement: 'Optimize millions of financial possibilities simultaneously.' },
  { illustration: ScientificDiscoveryIllustration, title: 'Scientific Discovery', statement: 'Accelerate discoveries beyond today\'s computational limits.' },
  { illustration: MaterialsIllustration, title: 'Materials', statement: "Discover materials that don't exist yet, atom by atom." },
];

// The cinematic homepage journey: Arrival (a decision gate, not a scroll) → System Initialization
// → Awakening → Discovery → Mission Control. The homepage is no longer passive: on arrival,
// scrolling is disabled and the user must choose "New User" or "Continue Your Journey" before
// anything else happens. `entryPhase` tracks where they are in that gate; the rest of the page
// only exists once it resolves to 'unlocked'.
//
// `entryPhase` starts at `'unlocked'` directly — skipping the gate entirely — for anyone who has
// already completed onboarding this session (`hasCompletedOnboarding()`, sessionStorage-backed).
// This is the fix for the critical Home-revisit bug: previously every fresh mount always started
// at `'gate'` and relied on a persistent, one-shot module signal to unlock it again, which never
// re-fires once it's already at its target value — leaving a returning user stuck replaying a
// boot sequence that could never complete. A user who's already been through the gate this
// session simply never sees it again, so there's nothing to get stuck replaying.
function Landing() {
  const navigate = useNavigate();
  const [entryPhase, setEntryPhase] = useState(() => (hasCompletedOnboarding() ? 'unlocked' : 'gate'));

  // Scrolling stays disabled through the whole gate — there is nothing to preserve a scroll
  // position for yet, since the user hasn't been able to scroll at all before this resolves.
  useEffect(() => {
    document.documentElement.style.overflow = entryPhase === 'unlocked' ? '' : 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [entryPhase]);

  // The New User path's unlock now comes directly from `AnimatedBackground`'s `onPulseComplete`
  // callback below — fired the instant its pulse animation genuinely finishes, not a subscription
  // to a persistent module signal's *change* event (that was the fragile part: it only fires once
  // per page load, ever, so a second attempt in the same session would never re-trigger it). A
  // fresh callback is passed on every mount, so this is correct on a replay too, not just the
  // first time. `navReadySignal` and `markOnboardingComplete()` fire at this same moment, so Nav
  // and the rest of the app arrive together, only after the Core has actually finished its pulse —
  // never before, which is what makes the awakening feel earned rather than incidental.
  const handlePulseComplete = () => {
    navReadySignal.set(1);
    markOnboardingComplete();
    setEntryPhase('unlocked');
  };

  return (
    <main className="relative isolate">
      <AnimatedBackground onPulseComplete={handlePulseComplete} />

      <AnimatePresence mode="wait">
        {entryPhase === 'gate' && (
          <HeroSection
            key="gate"
            onNewUser={() => setEntryPhase('booting')}
            onContinue={() => setEntryPhase('authenticating')}
          />
        )}
        {entryPhase === 'booting' && <BootSequence key="booting" />}
        {entryPhase === 'authenticating' && (
          // Returning users skip the boot sequence entirely — the Core is already calm and
          // waiting, and a successful login goes straight to Mission Control rather than
          // continuing down the same onboarding journey a new user sees.
          <AuthenticationScene key="authenticating" onSuccess={() => navigate('/missions')} />
        )}
      </AnimatePresence>

      {entryPhase !== 'unlocked' ? null : (
        <>
      {/* Stage 1.5 — a single, short reframe right after the awakening: not what quantum
          computing is (that's QuantumExplainer, next), but why Quantum Lab exists at all. */}
      <WhyQuantumLab />

      {/* Stage 2 — the laboratory introduces itself: a short, minimal-copy explainer bridging
          the awakening and Discovery. The Core stays alive behind it via AnimatedBackground. */}
      <QuantumExplainer />

      <NarrativeDivider>What happens when today's encryption meets tomorrow's computers?</NarrativeDivider>

      {/* Stage 3 — Discovery: what could quantum computing change? Possibility, not missions. */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="text-center font-display text-3xl font-bold text-white sm:text-4xl">
          What Could Quantum Computing Change?
        </h2>
        <div className="mt-14">
          <PossibilityGallery items={POSSIBILITIES} />
        </div>
      </section>

      {/* Stage 4 — the homepage's closing beat: anticipation, not the missions themselves.
          Mission Control is its own destination now, reached deliberately, not scrolled past. */}
      <section className="mx-auto max-w-2xl px-6 py-24 text-center">
        <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">
          Ready to Experience Quantum Computing?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-slate-400">Every possibility becomes a mission.</p>
        <div className="mt-8">
          <Button to="/missions" variant="primary">
            Enter Mission Control
          </Button>
        </div>
      </section>

      <QuoteSection />
      <Footer />
        </>
      )}
    </main>
  );
}

export default Landing;
