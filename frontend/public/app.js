
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
    // Do NOT import the app shell here. Dash owns its skin.
    // Optional: if you *do* want to module-load extra dash code later, use an absolute URL:
    // await import('/dash.js');
    return;
  }
  // APP pages: load the original app shell (moved into a separate module)
  try {
    // Force network check for correct MIME to avoid HTML/404 masquerading as JS
    const url = '/app-shell.js?cb=' + Date.now();
    const r = await fetch(url, { cache: 'no-store' });
    const ct = (r.headers.get('content-type') || '').toLowerCase();
    if (!r.ok || !ct.includes('javascript')) {
      throw new Error('app-shell.js bad fetch: ' + r.status + ' ' + ct);
    }
    await import(url);
  } catch (e) {
    console.error('[boot] app-shell load failed:', e);
    // Probe likely nested imports so console shows the real offender
    for (const u of ['/scripts/i18n.js','/scripts/stripe.js']) {
      try {
        const rr = await fetch(u + '?cb=' + Date.now(), { cache: 'no-store' });
        console.info('[probe]', u, rr.status, rr.headers.get('content-type'));
      } catch (pe) {
        console.warn('[probe failed]', u, pe);
      }
    }
    // Last resort: module tag injection (keeps page usable if import() rejects)
    try {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.type = 'module'; s.src = '/app-shell.js?tag=' + Date.now();
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    } catch {}
  }
  })();
