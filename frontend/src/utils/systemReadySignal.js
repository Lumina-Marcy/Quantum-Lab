import { motionValue } from 'framer-motion';

/**
 * A shared, module-level signal — not React state — so BootSequence.jsx (which fires it) and
 * AnimatedBackground.jsx / MissionCard.jsx (which react to it) can all key off the exact moment
 * system initialization completes, without prop-drilling through Landing.jsx or paying for extra
 * re-renders on every subscriber. 0 = not yet ignited, 1 = ignited — this never resets once set;
 * "the lab woke up" is a one-time event for the session, not something that un-happens on scroll.
 *
 * This is deliberately narrow: it means "the New User boot sequence finished," and is the one
 * and only trigger for the homepage's arc-reactor pulse (AnimatedBackground.jsx) and the mission
 * cards' ignition glow (MissionCard.jsx). It intentionally does NOT fire for the "Continue Your
 * Journey" flow — that path never boots, so there's nothing to ignite off of.
 */
export const systemReadySignal = motionValue(0);

/**
 * "Has the entry gate resolved, regardless of which path resolved it?" — the one thing Nav.jsx
 * actually needs to know. Kept separate from `systemReadySignal` on purpose: Nav visibility and
 * the arc-reactor pulse used to be conflated (both driven by `systemReadySignal`), which meant a
 * returning user stuck on an unsubmitted/failing login form had no Nav and no way back, since
 * only the boot-sequence path ever set that signal. BootSequence.jsx sets both (finishing boot
 * both unlocks Nav and ignites the pulse); AuthenticationScene.jsx sets only this one, the moment
 * its login form actually appears — fixing the stuck-nav bug without making returning users
 * trigger the New User's ignition pulse.
 */
export const navReadySignal = motionValue(0);
