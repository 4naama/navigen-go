
// 1) Route test
const path = location.pathname;
const isDash = /^\/(?:[a-z]{2}\/)?dash(?:\/|$)/i.test(path);
const hasLangPrefix = /^[a-z]{2}(?:\/|$)/.test(path.slice(1));

// 2) If DASH without /{lang}/, prefer stored lang (or keep EN at root)
if (isDash && !hasLangPrefix) {
  let stored = "en";
  try { stored = (localStorage.getItem("lang") || "en").slice(0,2).toLowerCase(); } catch {}
  if (stored !== "en") {
    const qs = location.search || "", hash = location.hash || "";
    location.replace(`/${stored}${path}${qs}${hash}`);
  }
}

// 3) Route-dependent boot (dynamic import prevents premature side-effects)
(async () => {
  if (isDash) {
    // DASH: import ONLY the dashboard bundle; never load the app shell
    // If your dash is pure HTML+its own script tag, you can leave this empty.
    // Otherwise point to your dash module here:
    try { await import('./dash.js'); } catch {}
    return;
  }

  // APP pages: load the original app shell (moved into a separate module)
  try { await import('./app-shell.js'); } catch (e) { console.error('App boot failed', e); }
})();
