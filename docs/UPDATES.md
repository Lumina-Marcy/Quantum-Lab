# Updates

## 2026-07-17 — Browser tab favicon

| Area                        | What changed                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------- |
| `frontend/public/favicon.svg` | New favicon — a static rendition of the `QuantumCore` glowing-nucleus-with-orbital-rings symbol |
| `frontend/index.html`         | Added `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`                          |

Previously the browser tab showed the default document icon (no favicon was set). The new icon reuses
the same brand colors and gradient as [`QuantumCore.jsx`](../frontend/src/components/QuantumCore.jsx) —
blue (`#3b82f6`) and violet (`#a78bfa`) orbit rings around a white-to-purple radial nucleus gradient,
on the app's midnight-navy background — so the tab icon matches the app's "living symbol" used
throughout the site (homepage hero, login/register, sandbox, loading spinner).

## 2026-07-17 — Nav bar cleanup

| Area                             | What changed                                                                  |
| --------------------------------- | ------------------------------------------------------------------------------ |
| `frontend/src/components/Nav.jsx` | Removed the duplicate greyed-out "Resources" placeholder (the `SOON_LINKS` "coming soon" stub) |
| `frontend/src/components/Nav.jsx` | Renamed the working `/resources` nav link label from "Resources" to "Learn"   |

The nav previously showed two "Resources" entries — one working link and one disabled `SOON_LINKS`
placeholder left over from before the Resources page existed. The placeholder is now removed, and
the real link is relabeled "Learn".

## 2026-07-17 — Password Mission: selective port from `tylek-password`

| Area                                        | What changed                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------------- |
| `frontend/src/pages/PasswordMission.jsx`     | Replaced the breach → 3-card-defense → outcome flow with `tylek-password`'s breach → multi-account triage/vault/minigame → aftermath flow |
| `frontend/src/utils/triageData.js`           | New — account/defense data for the triage gameplay (added as-is from `tylek-password`) |
| `frontend/src/utils/passwordStrength.js`     | New — password entropy/strength scoring used by the breach narration (added as-is from `tylek-password`) |

`tylek-password` branched off an old point in history and diverged heavily from `main` (it's missing
entire features `main` has since added — Resources page, Sandbox, illustrations, docs, etc.), so a full
branch merge was not viable. Instead, only the Password Mission's post-"Start Mission" gameplay was
ported in: everything from the breach terminal through the new damage-control triage loop (defend
individual accounts, assemble a password-manager vault, survive 2FA/biometric minigames) to the
aftermath/readiness-score screen.

Main's mission-page chrome was kept — the persistent "Password Vault" `QuantumCore` header bar stays,
and the aftermath screen now ends with a "Learn Why →" button (styled to match main's existing purple
CTA) leading into main's existing classic-vs-quantum comparison page (`/mission/1/learn-why`,
`LearnWhy.jsx`) instead of `tylek-password`'s own ending. That comparison page itself was left
untouched — main's version is authoritative.
