// scripts/logo-refresh.js
// Single source of truth for logo refresh (App + Dash + PWA).
// - nudge-only (quarter-turn): keeps brand motion minimal
// - deterministic timing (no :active reliance)
// - guarded against double-trigger on mobile

export function wireLogoRefresh({
  selector = '#logo-icon',
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

  const run = (ev) => {
    ev?.preventDefault?.();

    // Guard: prevent double-trigger (touch + click, etc.)
    if (busy) return;
    busy = true;

    // Clear nudge mode first (safe reset)
    el.classList.remove(clsNudge);
    void el.offsetWidth; // reflow ensures animation restarts

    if (!prefersReduced) {
      // Nudge is the single supported mode
      el.classList.add(clsNudge);
    }

    // Reload after a short delay so the effect is seen
    window.setTimeout(() => {
      window.location.reload();
    }, prefersReduced ? 0 : reloadMs);
  };

  // Use click only (most reliable across Android/iOS/PWA)
  el.addEventListener('click', run, { passive: false });
}
