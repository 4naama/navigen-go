// scripts/logo-refresh.js
// Single source of truth for logo refresh (App + Dash + PWA).
// - nudge-only (quarter-turn): keeps brand motion minimal
// - deterministic timing (no :active reliance)
// - guarded against double-trigger on mobile

export function wireLogoRefresh({
  selector = '#logo-icon',
  reloadMs = 220,        // should match CSS animation duration closely
  onRefresh              // optional override: e.g. Dash soft-refresh handler
} = {}) {

  const el = document.querySelector(selector);
  if (!el) return;

  let busy = false;
  let lastPointerAt = 0; // guards synthetic follow-up click after pointer events

  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const clsNudge = 'logo-refreshing-nudge';

  const doRefresh = () => {
    // Allow host to supply a soft-refresh (recommended for Dash data reloads)
    if (typeof onRefresh === 'function') {
      onRefresh();
      return;
    }
    window.location.reload();
  };

  const run = (ev) => {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();

    // Guard: prevent double-trigger (pointer + synthetic click, etc.)
    if (busy) return;
    busy = true;

    // Clear nudge mode first (safe reset)
    el.classList.remove(clsNudge);
    void el.offsetWidth; // reflow ensures animation restarts

    if (!prefersReduced) {
      // Nudge is the single supported mode
      el.classList.add(clsNudge);
    }

    // Refresh after a short delay so the effect is seen
    window.setTimeout(() => {
      doRefresh();
    }, prefersReduced ? 0 : reloadMs);
  };

  const onPointerUp = (ev) => {
    // Pointer events unify mouse + touch and reduce mobile double-firing
    lastPointerAt = Date.now();
    run(ev);
  };

  const onClick = (ev) => {
    // Ignore click if it is a synthetic follow-up to a pointer gesture
    if (Date.now() - lastPointerAt < 650) {
      ev?.preventDefault?.();
      ev?.stopPropagation?.();
      return;
    }
    run(ev);
  };

  const onKeyDown = (ev) => {
    // Keyboard accessibility: Enter / Space activates refresh
    if (ev?.key === 'Enter' || ev?.key === ' ') run(ev);
  };

  // Prefer pointerup; keep click as a fallback for older browsers
  el.addEventListener('pointerup', onPointerUp, { passive: false });
  el.addEventListener('click', onClick, { passive: false });
  el.addEventListener('keydown', onKeyDown, { passive: false });

  // If the page is restored from bfcache, release the guard safely
  window.addEventListener('pageshow', () => {
    busy = false;
  });
}

