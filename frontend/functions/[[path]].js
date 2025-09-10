// functions/[[path]].js
// Gate: 6-digit admin code; keep PWA assets public.

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const ADMIN_COOKIE = 'navigen_gate_v2'; // bump name to logout all

  // Public: PWA & assets
  if (
    url.pathname === '/manifest.webmanifest' ||
    url.pathname === '/sw.js' ||
    url.pathname.startsWith('/assets/')
  ) {
    const r = await context.next();
    r.headers.set('x-ng-worker', 'ok'); // debug
    return r;
  }

  // Guard /data/* explicitly
  if (url.pathname.startsWith('/data/')) {
    if (!hasAdminCookie(request.headers.get('cookie'), ADMIN_COOKIE)) {
      return renderGate(env, ADMIN_COOKIE, url);
    }
  }

  // Guard everything else (no guests)
  if (!hasAdminCookie(request.headers.get('cookie'), ADMIN_COOKIE)) {
    const expected = String(env.SHOWCASE_STATIC6 || '').trim();
    const code = await readCode(request, url);
    if (/^\d{6}$/.test(code) && expected && code === expected) {
      const headers = new Headers({
        'Set-Cookie': `${ADMIN_COOKIE}=ok; Max-Age=31536000; Path=/; Secure; SameSite=Lax`
      });
      url.searchParams.delete('code');
      return Response.redirect(url.toString(), 303, { headers });
    }
    return renderGate(env, ADMIN_COOKIE, url);
  }

  // Authenticated → continue to static files
  const res = await context.next();
  res.headers.set('x-ng-worker', 'ok'); // debug
  return res;
}

function hasAdminCookie(cookie, name) {
  const s = String(cookie || '');
  return new RegExp(`\\b${name}=ok\\b`).test(s);
}

async function readCode(request, url) {
  const q = (url.searchParams.get('code') || '').trim();
  if (q) return q;
  if (request.method !== 'POST') return '';
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const form = await request.formData();
      return String(form.get('code') || '').trim();
    }
    if (ct.includes('application/json')) {
      const j = await request.json();
      return String(j.code || '').trim();
    }
  } catch {}
  return '';
}

function renderGate(env, ADMIN_COOKIE, url) {
  const body = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Admin Access</title>
<style>
body{font:16px system-ui;margin:0;background:#f7f7f7;color:#111}
.card{max-width:420px;margin:14vh auto;padding:24px;background:#fff;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.08)}
h1{font-size:20px;margin:0 0 12px}.muted{opacity:.75;margin:0 0 16px}
form{display:flex;gap:8px}input{flex:1;padding:10px 12px;border:1px solid #ddd;border-radius:8px}
button{padding:10px 14px;border:1px solid #111;border-radius:8px;background:#111;color:#fff;cursor:pointer}
.small{font-size:13px;opacity:.7;margin-top:12px}
</style></head><body>
<div class="card" role="dialog" aria-labelledby="t">
  <h1 id="t">🔒 Admin Access</h1>
  <p class="muted">Enter your 6-digit admin code.</p>
  <form method="POST"><input name="code" inputmode="numeric" pattern="\\d{6}" maxlength="6" placeholder="123456" required>
  <button type="submit">Enter</button></form>
  <p class="small">Tip: add <code>?code=123456</code> to your URL for quicker login.</p>
</div></body></html>`;
  return new Response(body, { status: 401, headers: { 'content-type': 'text/html; charset=utf-8', 'x-ng-worker': 'gate' } });
}
