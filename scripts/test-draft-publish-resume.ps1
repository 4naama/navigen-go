param(
  [int] $ServerPort = 0,
  [int] $DebugPort = 0,
  [string] $BrowserPath = "",
  [string] $PublicDir = ""
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { Split-Path -Parent $MyInvocation.MyCommand.Path }

if (-not $PublicDir) {
  $cursor = [System.IO.DirectoryInfo]::new($ScriptDir)

  while ($null -ne $cursor) {
    $sameDirCandidate = $cursor.FullName
    $frontendPublicCandidate = Join-Path $cursor.FullName "frontend\public"

    if (Test-Path (Join-Path $sameDirCandidate "modal-injector.js")) {
      $PublicDir = $sameDirCandidate
      break
    }

    if (Test-Path (Join-Path $frontendPublicCandidate "modal-injector.js")) {
      $PublicDir = $frontendPublicCandidate
      break
    }

    $cursor = $cursor.Parent
  }
}

if (-not $PublicDir -or -not (Test-Path (Join-Path $PublicDir "modal-injector.js"))) {
  throw "Could not find frontend\public\modal-injector.js. Run from the repo scripts directory or pass -PublicDir `"C:\Users\USER\Documents\a_git\navigen-go\frontend\public`"."
}

$PublicDir = [System.IO.Path]::GetFullPath($PublicDir)

function Get-FreeTcpPort {
  $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
  $listener.Start()
  try {
    return $listener.LocalEndpoint.Port
  } finally {
    $listener.Stop()
  }
}

if ($ServerPort -le 0) { $ServerPort = Get-FreeTcpPort }
if ($DebugPort -le 0) { $DebugPort = Get-FreeTcpPort }

function Resolve-BrowserPath {
  param([string] $Explicit)

  if ($Explicit -and (Test-Path $Explicit)) {
    return $Explicit
  }

  $candidates = @(
    "${env:ProgramFiles}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
    "${env:LOCALAPPDATA}\Microsoft\Edge\Application\msedge.exe",
    "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "${env:LOCALAPPDATA}\Google\Chrome\Application\chrome.exe"
  ) | Where-Object { $_ -and (Test-Path $_) }

  if ($candidates.Count -eq 0) {
    throw "Microsoft Edge or Chrome was not found. Pass -BrowserPath `"C:\Path\to\msedge.exe`"."
  }

  return $candidates[0]
}

$BrowserPath = Resolve-BrowserPath $BrowserPath

$harnessName = "__navigen_draft_resume_smoke.html"
$harnessPath = Join-Path $PublicDir $harnessName
$serverScript = Join-Path $env:TEMP ("navigen-static-" + [guid]::NewGuid() + ".mjs")
$userData = Join-Path $env:TEMP ("navigen-cdp-" + [guid]::NewGuid())
$nodeProc = $null
$browserProc = $null
$socket = $null
$script:cdpId = 0

try {
  Set-Content -Path $harnessPath -Value '<!doctype html><html><head><meta charset="utf-8"><title>NaviGen draft resume smoke</title></head><body><div id="root"></div></body></html>' -Encoding UTF8

  $nodeServer = @'
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const port = Number(process.argv[2] || 0);
const root = path.resolve(process.argv[3] || process.cwd());

const mime = new Map([
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.svg', 'image/svg+xml; charset=utf-8']
]);

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
    const clean = decodeURIComponent(url.pathname).replace(/^\/+/, '') || 'index.html';
    const file = path.resolve(root, clean);

    if (!file.startsWith(root + path.sep) && file !== root) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }

    fs.readFile(file, (err, data) => {
      if (err) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('not found');
        return;
      }

      res.writeHead(200, {
        'content-type': mime.get(path.extname(file).toLowerCase()) || 'application/octet-stream',
        'cache-control': 'no-store'
      });
      res.end(data);
    });
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(String(err && err.stack || err));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`navigen-static-ready:${port}`);
});
'@

  Set-Content -Path $serverScript -Value $nodeServer -Encoding UTF8

  $nodeArgs = @(
    "`"$serverScript`"",
    [string] $ServerPort,
    "`"$PublicDir`""
  )

  $nodeProc = Start-Process -FilePath "node" -ArgumentList $nodeArgs -PassThru -WindowStyle Hidden

  $deadline = (Get-Date).AddSeconds(10)
  do {
    try {
      $ping = Invoke-WebRequest -Uri "http://127.0.0.1:$ServerPort/$harnessName" -UseBasicParsing -TimeoutSec 2
      if ($ping.StatusCode -eq 200) { break }
    } catch {}
    Start-Sleep -Milliseconds 150
  } while ((Get-Date) -lt $deadline)

  if ((Get-Date) -ge $deadline) {
    throw "Static server did not start on port $ServerPort."
  }

  New-Item -ItemType Directory -Force -Path $userData | Out-Null

  $targetUrl = "http://127.0.0.1:$ServerPort/$harnessName"
  $browserArgs = @(
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--disable-extensions",
    "--disable-background-networking",
    "--remote-debugging-port=$DebugPort",
    "--user-data-dir=`"$userData`"",
    $targetUrl
  )

  $browserProc = Start-Process -FilePath $BrowserPath -ArgumentList $browserArgs -PassThru

  $deadline = (Get-Date).AddSeconds(15)
  $page = $null
  do {
    try {
      $tabs = Invoke-RestMethod -Uri "http://127.0.0.1:$DebugPort/json/list" -TimeoutSec 2
      $page = @($tabs | Where-Object { $_.type -eq "page" -and $_.webSocketDebuggerUrl } | Select-Object -First 1)[0]
      if ($page) { break }
    } catch {}
    Start-Sleep -Milliseconds 150
  } while ((Get-Date) -lt $deadline)

  if (-not $page) {
    throw "Browser CDP endpoint did not expose a page target."
  }

  function Receive-CdpMessage {
    param([System.Net.WebSockets.ClientWebSocket] $Socket)

    $chunks = New-Object System.Collections.Generic.List[byte]

    do {
      $buffer = New-Object byte[] 65536
      $segment = [System.ArraySegment[byte]]::new($buffer)
      $result = $Socket.ReceiveAsync($segment, [Threading.CancellationToken]::None).GetAwaiter().GetResult()

      if ($result.MessageType -eq [System.Net.WebSockets.WebSocketMessageType]::Close) {
        throw "CDP websocket closed unexpectedly."
      }

      for ($i = 0; $i -lt $result.Count; $i++) {
        $chunks.Add($buffer[$i])
      }
    } while (-not $result.EndOfMessage)

    return [Text.Encoding]::UTF8.GetString($chunks.ToArray()) | ConvertFrom-Json
  }

  function Send-Cdp {
    param(
      [System.Net.WebSockets.ClientWebSocket] $Socket,
      [string] $Method,
      [hashtable] $Params = @{}
    )

    $script:cdpId += 1

    $payload = @{
      id = $script:cdpId
      method = $Method
      params = $Params
    } | ConvertTo-Json -Depth 80 -Compress

    $bytes = [Text.Encoding]::UTF8.GetBytes($payload)

    $Socket.SendAsync(
      [System.ArraySegment[byte]]::new($bytes),
      [System.Net.WebSockets.WebSocketMessageType]::Text,
      $true,
      [Threading.CancellationToken]::None
    ).GetAwaiter().GetResult() | Out-Null

    while ($true) {
      $msg = Receive-CdpMessage $Socket

      if ($msg.id -eq $script:cdpId) {
        if ($msg.error) {
          throw ("CDP {0} failed: {1}" -f $Method, ($msg.error | ConvertTo-Json -Compress))
        }

        return $msg.result
      }
    }
  }

  $socket = [System.Net.WebSockets.ClientWebSocket]::new()
  $socket.ConnectAsync([Uri] $page.webSocketDebuggerUrl, [Threading.CancellationToken]::None).GetAwaiter().GetResult() | Out-Null

  Send-Cdp -Socket $socket -Method "Runtime.enable" | Out-Null

  $expression = @'
(async () => {
  const out = {
    ok: false,
    failures: [],
    fetchCalls: [],
    pageErrors: [],
    cards: 0,
    title: '',
    stored: null
  };

  const fail = (message) => out.failures.push(String(message || 'unknown failure'));
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  window.__navigenPageErrors = [];
  window.addEventListener('error', (ev) => {
    window.__navigenPageErrors.push(String(ev?.message || ev?.error?.stack || ev?.error || 'window error'));
  });
  window.addEventListener('unhandledrejection', (ev) => {
    window.__navigenPageErrors.push(String(ev?.reason?.stack || ev?.reason || 'unhandled rejection'));
  });

  try {
    window.t = () => '';
    window.__navigenFetchCalls = [];

    window.fetch = async (input, init = {}) => {
      const url = String(input && input.url ? input.url : input);
      window.__navigenFetchCalls.push(url);

      const json = (payload, status = 200) =>
        new Response(JSON.stringify(payload), {
          status,
          headers: { 'content-type': 'application/json' }
        });

      if (url.includes('/api/owner/campaigns')) {
        return json({ error: 'owner campaign probe should not be called in this guest draft smoke test' }, 401);
      }

      if (url.includes('/api/status')) {
        return json({
          locationID: 'draft-smoke-ulid',
          status: 'draft'
        });
      }

      if (url.includes('/api/data/item')) {
        return json({
          locationID: 'smoke-location',
          locationName: { en: 'Smoke Location' }
        });
      }

      return json({});
    };

    localStorage.clear();

    const seed = {
      draftULID: 'draft-smoke-ulid',
      draftSessionId: 'smoke-session',
      mode: 'manual',
      name: 'Smoke Draft Location',
      displayName: 'Smoke Draft Location',
      address: 'Smoke Street 1',
      city: 'Budapest',
      country: 'HU',
      coord: '47.4979,19.0402',
      planCode: 'standard',
      planMode: 'managed_presence',
      campaignPreset: 'visibility',
      campaignScope: 'single',
      selectedLocationULIDs: [],
      campaignDraft: {
        planCode: 'standard',
        planMode: 'managed_presence',
        campaignScope: 'single'
      },
      createdAt: Date.now() - 1000,
      updatedAt: Date.now()
    };

    localStorage.setItem('navigen.p8.pendingLocationDrafts', JSON.stringify([seed]));

    const mod = await import('/modal-injector.js?smoke=' + Date.now());

    mod.showSelectLocationModal();
    await sleep(100);

    const draftsRoute = document.querySelector('#select-location-drafts-route');
    if (!draftsRoute) {
      fail('select-location-drafts-route was not rendered');
    } else {
      draftsRoute.click();
    }

    await sleep(150);

    const draftsModal = document.querySelector('#profile-drafts-modal');
    if (!draftsModal) {
      fail('profile-drafts-modal was not rendered');
    }

    const draftCards = Array.from(document.querySelectorAll('.syb-draft-card'));
    out.cards = draftCards.length;

    if (!draftCards.length) {
      fail('no profile draft card was rendered');
    } else {
      draftCards[0].click();
    }

    await sleep(700);

    out.pageErrors = Array.from(window.__navigenPageErrors || []);
    const seriousErrors = out.pageErrors.filter((message) =>
      /ReferenceError|TypeError|p8DraftSubtitle|Unhandled/i.test(message)
    );

    if (seriousErrors.length) {
      fail('page runtime error(s): ' + seriousErrors.join(' | '));
    }

    out.fetchCalls = Array.from(window.__navigenFetchCalls || []);

    if (out.fetchCalls.some((url) => String(url).includes('/api/owner/campaigns'))) {
      fail('unexpected /api/owner/campaigns request happened during draft resume');
    }

    if (document.querySelector('#request-listing-modal:not(.hidden)')) {
      fail('publish-state draft reopened Create Location instead of Publish setup');
    }

    const campaignModal = document.querySelector('#campaign-management-modal');
    if (!campaignModal) {
      fail('campaign-management-modal was not opened');
    }

    out.title = String(campaignModal?.querySelector('.modal-title, h1, h2')?.textContent || '').trim();
    out.publishControls = {
      modalVisible: !!(campaignModal && !campaignModal.classList.contains('hidden')),
      planModeSelect: !!document.querySelector('#cm-plan-mode'),
      multiPlanChip: !!document.querySelector('.campaign-funding-chip[data-plan-code="multi"]')
    };

    if (!out.publishControls.modalVisible || !out.publishControls.planModeSelect || !out.publishControls.multiPlanChip) {
      fail('campaign modal did not expose Publish setup controls: ' + JSON.stringify(out.publishControls) + '; title=' + out.title);
    }

    const multiPlanChip = document.querySelector('.campaign-funding-chip[data-plan-code="multi"]');
    if (!multiPlanChip) {
      fail('multi plan chip was not rendered');
    } else {
      multiPlanChip.click();
    }

    await sleep(150);

    const planModeSelect = document.querySelector('#cm-plan-mode');
    if (!planModeSelect) {
      fail('cm-plan-mode select was not rendered');
    } else {
      planModeSelect.value = 'campaign_with_promo_qr';
      planModeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }

    await sleep(150);

    const stored = JSON.parse(localStorage.getItem('navigen.p8.pendingLocationDrafts') || '[]');
    out.stored = Array.isArray(stored) ? stored[0] : null;

    if (!out.stored) {
      fail('saved draft was not found after publish setup edits');
    } else {
      if (out.stored.planCode !== 'multi') {
        fail('saved draft did not persist changed planCode=multi');
      }

      if (out.stored.planMode !== 'campaign_with_promo_qr') {
        fail('saved draft did not persist changed planMode=campaign_with_promo_qr');
      }

      if (out.stored.campaignPreset !== 'promotion') {
        fail('saved draft did not persist campaignPreset=promotion');
      }

      if (!out.stored.campaignDraft || out.stored.campaignDraft.planMode !== 'campaign_with_promo_qr') {
        fail('saved draft did not persist campaignDraft for promo QR mode');
      }
    }
  } catch (err) {
    fail(err && err.stack ? err.stack : err);
  }

  out.ok = out.failures.length === 0;
  return out;
})()
'@

  $result = Send-Cdp -Socket $socket -Method "Runtime.evaluate" -Params @{
    expression = $expression
    awaitPromise = $true
    returnByValue = $true
  }

  if ($result.exceptionDetails) {
    throw ("Runtime.evaluate failed: {0}" -f ($result.exceptionDetails | ConvertTo-Json -Depth 80))
  }

  $value = $result.result.value

  if (-not $value.ok) {
    $details = $value | ConvertTo-Json -Depth 80
    throw "Operational draft publish resume smoke test failed:`n$details"
  }

  Write-Host "PASS: draft publish resume operational smoke test passed."
}
finally {
  if ($socket) {
    try {
      if ($socket.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        $socket.CloseAsync(
          [System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure,
          "done",
          [Threading.CancellationToken]::None
        ).GetAwaiter().GetResult() | Out-Null
      }

      $socket.Dispose()
    } catch {}
  }

  if ($browserProc -and -not $browserProc.HasExited) {
    try { Stop-Process -Id $browserProc.Id -Force } catch {}
  }

  if ($nodeProc -and -not $nodeProc.HasExited) {
    try { Stop-Process -Id $nodeProc.Id -Force } catch {}
  }

  Remove-Item $harnessPath -Force -ErrorAction SilentlyContinue
  Remove-Item $serverScript -Force -ErrorAction SilentlyContinue
  Remove-Item $userData -Recurse -Force -ErrorAction SilentlyContinue
}