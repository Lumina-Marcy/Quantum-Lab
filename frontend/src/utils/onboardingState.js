const STORAGE_KEY = 'qlab_onboarding_complete';

/**
 * "Has this user already been through the entry gate this session?" — sessionStorage-backed
 * (matching MissionContext.jsx's existing convention), not a single in-memory boolean. This is
 * what fixes the critical Home-revisit bug: without it, `Landing.jsx` always starts a fresh mount
 * at `entryPhase: 'gate'`, and the only thing that used to unlock it (a persistent, one-shot
 * module signal) never re-fires on a second pass because it's already at its target value from
 * the first time — leaving a returning user stuck replaying a boot sequence that can never
 * complete. Checking this flag lets a returning-within-session user skip the gate entirely
 * instead of relying on that fragile replay. Survives a hard refresh too (sessionStorage, not an
 * in-memory value), unlike the module signals.
 */
export function hasCompletedOnboarding() {
  return sessionStorage.getItem(STORAGE_KEY) === 'true';
}

export function markOnboardingComplete() {
  sessionStorage.setItem(STORAGE_KEY, 'true');
}
