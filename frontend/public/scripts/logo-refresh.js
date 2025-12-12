// scripts/logo-refresh.js
// Reason: single source of truth for logo refresh (App + Dash + PWA).
export function wireLogoRefresh({ selector = '#logo-icon', spinMs = 220 } = {}) {
  const el = document.querySelector(selector);
  if (!el) return;

  let busy = false;

  const run = async (ev) => {
    ev?.preventDefault?.();

    // Guard: prevent double-trigger (mobile click + pointerup, etc.)
    if (busy) return;
    busy = true;

    // Start animation (class-based, not :active)
    el.classList.remove('logo-refreshing');
    // Force reflow so animation reliably restarts
    void el.offsetWidth;
    el.classList.add('logo-refreshing');

    // Give the browser at least one paint, then reload after the spin window
    await new Promise((r) => requestAnimationFrame(() => r()));
    setTimeout(() => {
      // Reload works in browser and installed PWA; no globals, no SW-specific hacks
      window.location.reload();
    }, spinMs);
  };

  // Use click only; pointerdown often conflicts with scrolling/tap states
  el.addEventListener('click', run, { passive: false });
}
