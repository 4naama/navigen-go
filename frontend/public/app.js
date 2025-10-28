
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
    // prefer absolute URL; avoids path/prefix pitfalls
    await import('/app-shell.js');
  } catch (e1) {
    console.warn('[boot] /app-shell.js failed, trying fallbacks', e1);
    const lang = (document.documentElement.lang || 'en').slice(0,2).toLowerCase();
    const tries = [
      `/app-shell.js?cb=${Date.now()}`,     // cache-bust straight path
      `/${lang}/app-shell.js`,              // language-prefixed hosting
      `/assets/app-shell.js`,               // static assets folder (if published there)
    ];
    let ok = false, lastErr = e1;
    for (const u of tries) {
      try { await import(u); ok = true; break; } catch (e) { lastErr = e; }
    }
    if (!ok) {
      // final attempt: inject a <script type="module"> to bypass import() MIME checks
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.type = 'module'; s.src = `/app-shell.js?tag=${Date.now()}`;
        s.onload = res; s.onerror = () => rej(lastErr);
        document.currentScript?.parentNode?.appendChild(s) || document.head.appendChild(s);
      }).catch(err => { console.error('App boot failed', err); });
    }
  }
  })();
