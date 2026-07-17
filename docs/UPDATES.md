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
