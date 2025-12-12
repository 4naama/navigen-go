// scripts/logo-refresh.js
// Single source of truth for logo refresh (App + Dash + PWA).
// - mode: 'nudge' (quarter-turn) or 'ring' (no logo motion)
// - deterministic timing (no :active reliance)
// - guarded against double-trigger on mobile

export function wireLogoRefresh({
  selector = '#logo-icon',
  mode = 'nudge',        // 'nudge' | 'ring'
  reloadMs = 220         // should match CSS animation duration closely
} = {}) {
  const el = document.querySelector(selector);
  if (!el) return;

  let busy = false;

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clsNudge = 'logo-refreshing-nudge';
  const clsRing  = 'logo-refreshing-ring';

  const run = (ev) => {
    ev?.preventDefault?.();

    // Guard: prevent double-trigger (touch + click, etc.)
    if (busy) return;
    busy = true;

    // Clear both modes first (safe reset)
    el.classList.remove(clsNudge, clsRing);
    void el.offsetWidth; // reflow ensures animation restarts

    if (!prefersReduced) {
      // Ring mode needs a real child element (pseudo-elements may not render on <img>)
      if (mode === 'ring') {
        if (!el.querySelector('.logo-refresh-ring')) {
          const ring = document.createElement('span');
          ring.className = 'logo-refresh-ring';
          el.appendChild(ring);
        }
        el.classList.add(clsRing);
      } else {
        el.classList.add(clsNudge);
      }
    }

    // Reload after a short delay so the effect is seen
    window.setTimeout(() => {
      window.location.reload();
    }, prefersReduced ? 0 : reloadMs);
  };

  // Use click only (most reliable across Android/iOS/PWA)
  el.addEventListener('click', run, { passive: false });
}
