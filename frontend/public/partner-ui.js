import { injectModal, showModal, hideModal, showToast } from './modal-injector.js';
import { t } from './scripts/i18n.js';

const PARTNER_CENTER_MODAL_ID = 'partner-center-modal';
const PARTNER_HANDOFF_MODAL_ID = 'partner-handoff-modal';
const PARTNER_CONNECT_MODAL_ID = 'partner-connect-modal';
const PARTNER_LEADS_MODAL_ID = 'partner-leads-modal';
const PARTNER_RENEWALS_MODAL_ID = 'partner-renewals-modal';
const PARTNER_COMMISSIONS_MODAL_ID = 'partner-commissions-modal';

const state = {
  partner: null,
  leads: [],
  commissions: [],
  renewalTasks: [],
  leadPath: 'manual',
  loading: false,
  message: '',
  handoffUrlByLeadId: new Map()
};

function text(key, fallback = '') {
  if (typeof t !== 'function') return fallback;
  const raw = String(t(key) || '').trim();
  if (!raw || raw === key || raw === `[${key}]`) return fallback;
  return raw;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

const PARTNER_PAYOUT_COUNTRY_CODES = 'AT BE BG CA CH CY CZ DE DK EE ES FI FR GB GR HR IE IS IT LI LT LU LV MT NL NO PL PT RO SE SI SK US'.split(' ');
const PARTNER_PAYOUT_COUNTRY_CODE_SET = new Set(PARTNER_PAYOUT_COUNTRY_CODES);

function partnerCountryName(code) {
  const value = String(code || '').trim().toUpperCase();
  try {
    return new Intl.DisplayNames([document.documentElement.lang || navigator.language || 'en'], { type: 'region' }).of(value) || value;
  } catch {
    return value;
  }
}

function renderPartnerCountryOptions(datalistId) {
  const id = String(datalistId || 'partner-country-options').trim();
  return `
    <datalist id="${escapeHtml(id)}">
      ${PARTNER_PAYOUT_COUNTRY_CODES.map((code) => `<option value="${escapeHtml(code)}" label="${escapeHtml(partnerCountryName(code))}"></option>`).join('')}
    </datalist>
  `;
}

function renderPartnerPayoutCountrySelectOptions(selectedValue = '') {
  const selected = String(selectedValue || '').trim().toUpperCase();

  return [
    `<option value="">${escapeHtml(text('partner.connect.countryEmpty', 'Select'))}</option>`,
    ...PARTNER_PAYOUT_COUNTRY_CODES.map((code) => `<option value="${escapeHtml(code)}"${selected === code ? ' selected' : ''}>${escapeHtml(code)}</option>`)
  ].join('');
}

function renderPartnerLauncherCard({ action, icon, title, desc }) {
  return `
    <button type="button" class="modal-menu-item partner-launch-card" data-partner-action="${escapeHtml(action)}">
      <span class="icon-img partner-launch-icon" aria-hidden="true">${escapeHtml(icon)}</span>
      <span class="label">
        <strong>${escapeHtml(title)}</strong><br>
        <small>${escapeHtml(desc)}</small>
      </span>
    </button>
  `;
}

let partnerStructureCatalogPromise;
let partnerStructureCatalogRows = [];

function loadPartnerStructureCatalog(force = false) {
  if (force) {
    partnerStructureCatalogPromise = null;
    partnerStructureCatalogRows = [];
  }

  if (partnerStructureCatalogRows.length && !force) return Promise.resolve(partnerStructureCatalogRows);

  if (!partnerStructureCatalogPromise) {
    partnerStructureCatalogPromise = fetch('/api/structure/business-categories', {
      cache: 'no-store',
      credentials: 'include',
      headers: { accept: 'application/json' }
    })
      .then((res) => (res.ok ? res.json().catch(() => null) : null))
      .then((payload) => {
        const rows = Array.isArray(payload?.groups) ? payload.groups : (Array.isArray(payload) ? payload : []);
        partnerStructureCatalogRows = rows;
        if (!rows.length) partnerStructureCatalogPromise = null;
        return rows;
      })
      .catch(() => {
        partnerStructureCatalogPromise = null;
        return partnerStructureCatalogRows;
      });
  }

  return partnerStructureCatalogPromise;
}

function renderPartnerTabOptions(tabs, selectedTab = '') {
  const selected = String(selectedTab || 'overview').trim();

  return tabs.map(([id, label]) => {
    const value = String(id || '').trim();
    return `<option value="${escapeHtml(value)}"${selected === value ? ' selected' : ''}>${escapeHtml(label)}</option>`;
  }).join('');
}

function renderPartnerGroupOptions(structureRows, selectedValue = '') {
  const selected = String(selectedValue || '').trim();

  return [
    `<option value="">${escapeHtml(text('partner.lead.group.placeholder', 'Select group'))}</option>`,
    ...(Array.isArray(structureRows) ? structureRows : []).map((row) => {
      const groupKey = String(row?.groupKey || '').trim();
      const groupName = String(row?.groupName || groupKey).trim();
      return groupKey ? `<option value="${escapeHtml(groupKey)}"${selected === groupKey ? ' selected' : ''}>${escapeHtml(groupName)}</option>` : '';
    }).filter(Boolean)
  ].join('');
}

function renderPartnerSubgroupOptions(structureRows, groupKey, selectedValue = '') {
  const selected = String(selectedValue || '').trim();
  const group = (Array.isArray(structureRows) ? structureRows : []).find((row) => String(row?.groupKey || '').trim() === String(groupKey || '').trim());
  const subgroups = Array.isArray(group?.subgroups) ? group.subgroups : [];

  return [
    `<option value="">${escapeHtml(text('partner.lead.subgroup.placeholder', 'Select subgroup'))}</option>`,
    ...subgroups.map((row) => {
      const key = String(row?.key || '').trim();
      const name = String(row?.name || key).trim();
      return key ? `<option value="${escapeHtml(key)}"${selected === key ? ' selected' : ''}>${escapeHtml(name)}</option>` : '';
    }).filter(Boolean)
  ].join('');
}

function partnerLeadSlugPart(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .trim();
}

function partnerGeneratedLeadContexts(data) {
  const country = partnerLeadSlugPart(partnerCountryName(data.get('country')) || data.get('country'));
  const city = partnerLeadSlugPart(data.get('city'));
  const pairs = [
    [data.get('groupKey'), data.get('subgroupKey')],
    [data.get('groupKey2'), data.get('subgroupKey2')],
    [data.get('groupKey3'), data.get('subgroupKey3')]
  ];

  const contexts = [];

  pairs.forEach(([groupRaw, subgroupRaw]) => {
    const group = partnerLeadSlugPart(String(groupRaw || '').replace(/^group\./, 'group-'));
    const subgroup = partnerLeadSlugPart(String(subgroupRaw || '').replace(/^sub\./, 'sub-'));

    if (!country || !group || !subgroup) return;

    contexts.push(`ctx.country.${country}.${group}.${subgroup}`);
    if (city) contexts.push(`ctx.city.${country}.${city}.${group}.${subgroup}`);
  });

  return Array.from(new Set(contexts));
}

function partnerTabLabel(tabId) {
  const id = String(tabId || 'overview').trim();
  if (id === 'leads') return text('partner.center.tab.leads', 'Leads');
  if (id === 'renewals') return text('partner.center.tab.renewals', 'Renewals');
  if (id === 'commissions') return text('partner.center.tab.commissions', 'Commissions');
  return text('partner.center.tab.overview', 'Overview');
}

function formatDate(value) {
  const ms = Date.parse(String(value || ''));
  if (!Number.isFinite(ms)) return '';
  try { return new Date(ms).toLocaleDateString(); } catch { return ''; }
}

async function api(path, opts = {}) {
  const method = String(opts.method || 'GET').toUpperCase();
  const hasBody = Object.prototype.hasOwnProperty.call(opts, 'body');
  const res = await fetch(path, {
    method,
    cache: 'no-store',
    credentials: 'include',
    headers: {
      accept: 'application/json',
      ...(hasBody ? { 'Content-Type': 'application/json' } : {})
    },
    body: hasBody ? JSON.stringify(opts.body || {}) : undefined
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error(String(json?.error?.message || json?.error?.code || `HTTP ${res.status}`));
    err.status = res.status;
    err.payload = json;
    throw err;
  }
  return json || {};
}

function ensurePartnerCenterModal() {
  const modal = injectModal({
    id: PARTNER_CENTER_MODAL_ID,
    title: text('partner.center.title', 'NaviGen partner center'),
    layout: 'menu',
    bodyHTML: '<div id="partner-center-root" class="partner-center"></div>'
  });

  if (!modal.dataset.partnerUiBound) {
    modal.dataset.partnerUiBound = '1';

    modal.addEventListener('click', async (ev) => {
      const target = ev.target instanceof Element ? ev.target : null;
      const action = target?.closest?.('[data-partner-action]');
      if (!(action instanceof HTMLElement)) return;

      ev.preventDefault();
      await handlePartnerCenterAction(action);
    });
  }

  return modal;
}

function renderPartnerOpenSurfaces() {
  renderPartnerLeadsSurface();
  renderPartnerRenewalsSurface();
  renderPartnerCommissionsSurface();
}

function ensurePartnerLeadsModal() {
  const modal = injectModal({
    id: PARTNER_LEADS_MODAL_ID,
    title: text('partner.center.tab.leads', 'Leads'),
    layout: 'menu',
    bodyHTML: '<div id="partner-leads-root" class="partner-center partner-modal-surface"></div>'
  });

  if (!modal.dataset.partnerLeadsBound) {
    modal.dataset.partnerLeadsBound = '1';

    modal.addEventListener('click', async (ev) => {
      const target = ev.target instanceof Element ? ev.target : null;
      const action = target?.closest?.('[data-partner-action]');
      if (!(action instanceof HTMLElement)) return;

      ev.preventDefault();
      await handlePartnerCenterAction(action);
    });

    modal.addEventListener('change', (ev) => {
      const target = ev.target instanceof Element ? ev.target : null;
      const leadPathSelect = target?.closest?.('[data-partner-lead-path]');

      if (leadPathSelect instanceof HTMLSelectElement) {
        state.leadPath = String(leadPathSelect.value || 'manual').trim() === 'google_import' ? 'google_import' : 'manual';
        renderPartnerLeadsSurface();
      }
    });

    modal.addEventListener('submit', async (ev) => {
      const form = ev.target instanceof HTMLFormElement ? ev.target : null;
      if (!form || !form.matches('[data-partner-form="lead"]')) return;

      ev.preventDefault();
      await submitPartnerLeadForm(form);
    });
  }

  return modal;
}

function renderPartnerLeadsSurface() {
  const root = document.getElementById('partner-leads-root');
  if (!root) return;

  root.innerHTML = renderLeadsPanel();
  wirePartnerLeadFormControls(root);
}

function showPartnerLeadsSurface() {
  ensurePartnerLeadsModal();
  renderPartnerLeadsSurface();
  showModal(PARTNER_LEADS_MODAL_ID);
}

function ensurePartnerRenewalsModal() {
  const modal = injectModal({
    id: PARTNER_RENEWALS_MODAL_ID,
    title: text('partner.center.tab.renewals', 'Renewals'),
    layout: 'menu',
    bodyHTML: '<div id="partner-renewals-root" class="partner-center partner-modal-surface"></div>'
  });

  if (!modal.dataset.partnerRenewalsBound) {
    modal.dataset.partnerRenewalsBound = '1';

    modal.addEventListener('click', async (ev) => {
      const target = ev.target instanceof Element ? ev.target : null;
      const action = target?.closest?.('[data-partner-action]');
      if (!(action instanceof HTMLElement)) return;

      ev.preventDefault();
      await handlePartnerCenterAction(action);
    });
  }

  return modal;
}

function renderPartnerRenewalsSurface() {
  const root = document.getElementById('partner-renewals-root');
  if (!root) return;

  root.innerHTML = renderRenewalTasksPanel();
}

function showPartnerRenewalsSurface() {
  ensurePartnerRenewalsModal();
  renderPartnerRenewalsSurface();
  showModal(PARTNER_RENEWALS_MODAL_ID);
}

function ensurePartnerCommissionsModal() {
  const modal = injectModal({
    id: PARTNER_COMMISSIONS_MODAL_ID,
    title: text('partner.center.tab.commissions', 'Commissions'),
    layout: 'menu',
    bodyHTML: '<div id="partner-commissions-root" class="partner-center partner-modal-surface"></div>'
  });

  return modal;
}

function renderPartnerCommissionsSurface() {
  const root = document.getElementById('partner-commissions-root');
  if (!root) return;

  root.innerHTML = renderCommissionsPanel();
}

function showPartnerCommissionsSurface() {
  ensurePartnerCommissionsModal();
  renderPartnerCommissionsSurface();
  showModal(PARTNER_COMMISSIONS_MODAL_ID);
}

function renderPartnerCenter() {
  const root = document.getElementById('partner-center-root');
  if (!root) return;

  if (state.loading) {
    root.innerHTML = `
      <div class="partner-status-card">
        <strong>${escapeHtml(text('partner.center.loading.title', 'Loading Partner Center...'))}</strong><br>
        <small>${escapeHtml(text('partner.center.loading.desc', 'Reading your Partner session and lead workspace.'))}</small>
      </div>
    `;
    return;
  }

  const partner = state.partner || {};
  const openLeadText = `${Number(partner.openLeadCount || 0)} / ${Number(partner.leadCapacity || 0)}`;

  root.innerHTML = `
    <div class="partner-center-shell">
      ${state.message ? `<div class="partner-status-card partner-status-card-info">${escapeHtml(state.message)}</div>` : ''}

      <div class="partner-header-stack">
        <details class="cm-chip request-section-chip partner-status-chip">
          <summary class="modal-menu-item cm-chip-face request-section-chip-face">
            <span class="label cm-chip-face-label request-section-chip-label">
              <strong class="request-section-chip-title">${escapeHtml(text('partner.center.statusChip.title', 'Partner status'))}</strong>
              <small class="request-section-chip-summary">${escapeHtml(text('partner.center.capacity', 'Open leads'))} ${openLeadText}</small>
            </span>
            <span class="cm-chip-face-chevron" aria-hidden="true"></span>
          </summary>
          <div class="cm-chip-body">
            <div class="cm-chip-stack">
              <div class="cm-chip-row"><span class="cm-chip-k">${escapeHtml(text('partner.center.partnerId', 'Partner ID'))}</span><span class="cm-chip-v partner-status-id-value">${escapeHtml(partner.partnerId || '—')}</span></div>
              <div class="cm-chip-row"><span class="cm-chip-k">${escapeHtml(text('partner.center.status', 'Status'))}</span><span class="cm-chip-v">${escapeHtml(partner.status || '—')}</span></div>
              <div class="cm-chip-row"><span class="cm-chip-k">${escapeHtml(text('partner.center.capacity', 'Open leads'))}</span><span class="cm-chip-v">${openLeadText}</span></div>
              <div class="cm-chip-row"><span class="cm-chip-k">${escapeHtml(text('partner.center.connect', 'Payout identity'))}</span><span class="cm-chip-v">${escapeHtml(partner.connectStatus || 'not_started')}</span></div>
            </div>
          </div>
        </details>
      </div>

      ${renderPartnerLauncherPanel()}
    </div>
  `;

  renderPartnerOpenSurfaces();
}

function renderPartnerLauncherPanel() {
  return `
    <div class="partner-launch-grid">
      ${renderPartnerLauncherCard({
        action: 'open-leads',
        icon: '🎯',
        title: text('partner.center.card.leads.title', 'Leads'),
        desc: text('partner.center.card.leads.desc', 'Create, import, prepare, and hand off businesses.')
      })}
      ${renderPartnerLauncherCard({
        action: 'connect-start',
        icon: '💰',
        title: text('partner.connect.start', 'Start payout onboarding'),
        desc: text('partner.center.card.connect.desc', 'Connect Stripe payout identity.')
      })}
      ${renderPartnerLauncherCard({
        action: 'open-renewals',
        icon: '🔄',
        title: text('partner.center.card.renewals.title', 'Renewals'),
        desc: text('partner.center.card.renewals.desc', 'Follow up on expiring or expired Partner-assisted Plans.')
      })}
      ${renderPartnerLauncherCard({
        action: 'open-commissions',
        icon: '💶',
        title: text('partner.center.card.commissions.title', 'Commissions'),
        desc: text('partner.center.card.commissions.desc', 'Review pending, eligible, and paid commission ledger entries.')
      })}
    </div>
  `;
}

function ensurePartnerConnectSetupModal() {
  const modal = injectModal({
    id: PARTNER_CONNECT_MODAL_ID,
    title: text('partner.connect.setupTitle', 'Start payout onboarding'),
    layout: 'menu',
    bodyHTML: `
      <form data-partner-form="connect" class="modal-form-stack partner-connect-form">
        <div class="modal-static-card partner-connect-note">
          <span class="label">
            <strong>${escapeHtml(text('partner.connect.setupTitle', 'Start payout onboarding'))}</strong><br>
            <small>${escapeHtml(text('partner.connect.setupDesc', 'Continue opens Stripe Connect onboarding.'))}</small>
          </span>
        </div>
        <div class="modal-field">
          <label>${escapeHtml(text('partner.connect.emailLabel', 'Payout email'))} <span class="required-star">*</span></label>
          <input class="input" name="email" type="email" autocomplete="email" placeholder=" " required>
        </div>
        <div class="modal-field">
          <label>${escapeHtml(text('partner.connect.countryLabel', 'Country code'))} <span class="required-star">*</span></label>
          <select class="input" name="country" required>
            ${renderPartnerPayoutCountrySelectOptions()}
          </select>
        </div>
        <div class="modal-actions">
          <button type="submit" class="modal-body-button">${escapeHtml(text('partner.connect.continue', 'Continue to Stripe'))}</button>
          <button type="button" class="modal-body-button" data-partner-connect-cancel>${escapeHtml(text('partner.connect.cancel', 'Cancel'))}</button>
        </div>
      </form>
    `
  });

  if (!modal.dataset.partnerConnectBound) {
    modal.dataset.partnerConnectBound = '1';

    modal.addEventListener('submit', (ev) => {
      const form = ev.target instanceof HTMLFormElement ? ev.target : null;
      if (!form || !form.matches('[data-partner-form="connect"]')) return;

      ev.preventDefault();

      const data = new FormData(form);
      const email = String(data.get('email') || '').trim();
      const country = String(data.get('country') || '').trim().toUpperCase();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showToast(text('partner.connect.emailRequired', 'Provide your own payout email for Stripe Connect.'), 3200);
        return;
      }

      if (!PARTNER_PAYOUT_COUNTRY_CODE_SET.has(country)) {
        showToast(text('partner.connect.countryRequired', 'Choose payout country code.'), 3200);
        return;
      }

      modal.dispatchEvent(new CustomEvent('partner-connect-submit', {
        detail: { email, country }
      }));
    });

    modal.addEventListener('click', (ev) => {
      const target = ev.target instanceof Element ? ev.target : null;
      if (!target?.closest?.('[data-partner-connect-cancel], .modal-close')) return;

      ev.preventDefault();
      modal.dispatchEvent(new CustomEvent('partner-connect-cancel'));
    });
  }

  return modal;
}

function requestPartnerConnectSetup() {
  return new Promise((resolve) => {
    const modal = ensurePartnerConnectSetupModal();
    const form = modal.querySelector('[data-partner-form="connect"]');
    if (form instanceof HTMLFormElement) form.reset();

    const cleanup = () => {
      modal.removeEventListener('partner-connect-submit', onSubmit);
      modal.removeEventListener('partner-connect-cancel', onCancel);
    };

    const onSubmit = (ev) => {
      cleanup();
      hideModal(PARTNER_CONNECT_MODAL_ID);
      resolve(ev.detail || null);
    };

    const onCancel = () => {
      cleanup();
      hideModal(PARTNER_CONNECT_MODAL_ID);
      resolve(null);
    };

    modal.addEventListener('partner-connect-submit', onSubmit);
    modal.addEventListener('partner-connect-cancel', onCancel);

    showModal(PARTNER_CONNECT_MODAL_ID);
    window.setTimeout(() => {
      modal.querySelector('input[name="email"]')?.focus?.();
    }, 0);
  });
}

function renderLeadsPanel() {
  const leads = asArray(state.leads);
  const googlePath = state.leadPath === 'google_import';

  return `
    <form class="partner-lead-form modal-form-stack" data-partner-form="lead">
      <div class="partner-lead-path-card">
        <label for="partner-lead-path">${escapeHtml(text('partner.lead.path.label', 'Partner lead path'))}</label>
        <div class="partner-lead-path-select-wrap">
          <select id="partner-lead-path" class="input partner-lead-path-select" data-partner-lead-path name="source">
            <option value="manual"${googlePath ? '' : ' selected'}>${escapeHtml(text('partner.lead.path.manual', 'Manual'))}</option>
            <option value="google_import"${googlePath ? ' selected' : ''}>${escapeHtml(text('partner.lead.path.google', 'Google import'))}</option>
          </select>
          <span class="partner-lead-path-chevron" aria-hidden="true"></span>
        </div>
      </div>

      <div class="modal-static-card partner-google-import-note ${googlePath ? '' : 'hidden'}" data-partner-google-import-note>
        <span class="label">
          <strong>${escapeHtml(text('partner.lead.google.title', 'Google import'))}</strong><br>
          <small>${escapeHtml(text('partner.lead.google.desc', 'Use only after the Partner-specific Google import bridge is connected.'))}</small>
        </span>
      </div>

      <div data-partner-manual-body>
        <details class="cm-chip request-section-chip partner-lead-section-chip" open>
          <summary class="modal-menu-item cm-chip-face request-section-chip-face">
            <span class="label cm-chip-face-label request-section-chip-label">
              <strong class="request-section-chip-title">${escapeHtml(text('partner.lead.businessSection.title', 'Business information'))}</strong>
            </span>
            <span class="request-section-badge-stack">
              <span class="request-section-badge is-required">${escapeHtml(text('partner.lead.section.required', 'Required'))}</span>
            </span>
            <span class="cm-chip-face-chevron" aria-hidden="true"></span>
          </summary>
          <div class="cm-chip-body">
            <div class="modal-form-stack">
              <div class="modal-field">
                <label>${escapeHtml(text('partner.lead.businessName', 'Business name'))} <span class="required-star">*</span></label>
                <input class="input" name="businessName" required autocomplete="organization" placeholder=" ">
              </div>

              <div class="modal-field">
                <label>${escapeHtml(text('partner.lead.address', 'Street address'))} <span class="required-star">*</span></label>
                <input class="input" name="address" required autocomplete="street-address" placeholder=" ">
              </div>

              <div class="modal-form-grid">
                <div class="modal-field">
                  <label>${escapeHtml(text('partner.lead.postalCode', 'Postal code'))}</label>
                  <input class="input" name="postalCode" autocomplete="postal-code" placeholder=" ">
                </div>
                <div class="modal-field">
                  <label>${escapeHtml(text('partner.lead.city', 'City'))} <span class="required-star">*</span></label>
                  <input class="input" name="city" required autocomplete="address-level2" placeholder=" ">
                </div>
              </div>

              <div class="modal-field">
                <label>${escapeHtml(text('partner.lead.countryCode', 'Country code'))} <span class="required-star">*</span></label>
                <input class="input" name="country" maxlength="2" list="partner-lead-country-options" autocomplete="off" autocapitalize="characters" spellcheck="false" required placeholder=" ">
                ${renderPartnerCountryOptions('partner-lead-country-options')}
              </div>

              <div class="request-surface-card partner-coordinate-card">
                <label class="modal-checkbox-row">
                  <input type="checkbox" data-partner-coordinate-toggle>
                  <span>${escapeHtml(text('partner.lead.hasCoord', 'I have coordinates'))}</span>
                </label>

                <div class="modal-field hidden request-surface-card-body" data-partner-coordinate-wrap>
                  <label>${escapeHtml(text('partner.lead.coord', 'Coordinates (lat,lng) — 6 decimals'))}</label>
                  <input class="input" name="coord" type="text" placeholder="52.527900,13.440200">
                  <small class="modal-help-text">${escapeHtml(text('partner.lead.coordHelp', 'Copy from Google Maps when available.'))}</small>
                </div>
              </div>

              <div class="modal-form-grid">
                <div class="modal-field">
                  <label>${escapeHtml(text('partner.lead.website', 'Website'))}</label>
                  <input class="input" name="website" autocomplete="url" placeholder=" ">
                </div>
                <div class="modal-field">
                  <label>${escapeHtml(text('partner.lead.phone', 'Phone'))}</label>
                  <input class="input" name="phone" autocomplete="tel" placeholder=" ">
                </div>
              </div>
            </div>
          </div>
        </details>

        <details class="cm-chip request-section-chip partner-lead-section-chip">
          <summary class="modal-menu-item cm-chip-face request-section-chip-face">
            <span class="label cm-chip-face-label request-section-chip-label">
              <strong class="request-section-chip-title">${escapeHtml(text('partner.lead.discoverySection.title', 'SEO & discovery'))}</strong>
              <small class="request-section-chip-summary">${escapeHtml(text('partner.lead.discoverySection.summary', 'Choose how customers may look for this business.'))}</small>
            </span>
            <span class="request-section-badge-stack">
              <span class="request-section-badge is-required">${escapeHtml(text('partner.lead.section.required', 'Required'))}</span>
            </span>
            <span class="cm-chip-face-chevron" aria-hidden="true"></span>
          </summary>
          <div class="cm-chip-body">
            <div class="modal-form-stack">
              <p class="modal-help-text request-discovery-help">${escapeHtml(text('partner.lead.discoveryHelp', 'Choose what the business is. Good choices improve NaviGen search, filters, category pages, and structured profile signals.'))}</p>

              <div class="modal-form-grid">
                <div class="modal-field">
                  <label>${escapeHtml(text('partner.lead.discovery.combo1.group', 'Combo 1 group'))} <span class="required-star">*</span></label>
                  <select class="input" name="groupKey" data-partner-group-select required></select>
                </div>
                <div class="modal-field">
                  <label>${escapeHtml(text('partner.lead.discovery.combo1.subgroup', 'Combo 1 subgroup'))} <span class="required-star">*</span></label>
                  <select class="input" name="subgroupKey" data-partner-subgroup-select required></select>
                </div>
              </div>

              <div class="modal-form-grid">
                <div class="modal-field">
                  <label>${escapeHtml(text('partner.lead.discovery.combo2.group', 'Combo 2 group'))}</label>
                  <select class="input" name="groupKey2" data-partner-group-select></select>
                </div>
                <div class="modal-field">
                  <label>${escapeHtml(text('partner.lead.discovery.combo2.subgroup', 'Combo 2 subgroup'))}</label>
                  <select class="input" name="subgroupKey2" data-partner-subgroup-select></select>
                </div>
              </div>

              <div class="modal-form-grid">
                <div class="modal-field">
                  <label>${escapeHtml(text('partner.lead.discovery.combo3.group', 'Combo 3 group'))}</label>
                  <select class="input" name="groupKey3" data-partner-group-select></select>
                </div>
                <div class="modal-field">
                  <label>${escapeHtml(text('partner.lead.discovery.combo3.subgroup', 'Combo 3 subgroup'))}</label>
                  <select class="input" name="subgroupKey3" data-partner-subgroup-select></select>
                </div>
              </div>

              <input type="hidden" name="contexts">
              <small class="modal-help-text" data-partner-context-preview>${escapeHtml(text('partner.lead.contexts.generated.empty', 'Generated from country, city, and SEO & discovery choices.'))}</small>
            </div>
          </div>
        </details>

        <div class="modal-actions">
          <button type="submit" class="modal-body-button">${escapeHtml(text('partner.lead.create', 'Create lead'))}</button>
        </div>
      </div>
    </form>

    <div class="partner-list">
      ${leads.length ? leads.map(renderLeadCard).join('') : `
        <div class="partner-empty">${escapeHtml(text('partner.lead.empty', 'No Partner leads yet.'))}</div>
      `}
    </div>
  `;
}

function wirePartnerLeadFormControls(root) {
  const form = root?.querySelector?.('[data-partner-form="lead"]');
  if (!(form instanceof HTMLFormElement) || form.dataset.partnerLeadControlsBound === '1') return;

  form.dataset.partnerLeadControlsBound = '1';

  const manualBody = form.querySelector('[data-partner-manual-body]');
  const googleNote = form.querySelector('[data-partner-google-import-note]');
  const submitButton = form.querySelector('button[type="submit"]');
  const countryInput = form.querySelector('input[name="country"]');
  const coordToggle = form.querySelector('[data-partner-coordinate-toggle]');
  const coordWrap = form.querySelector('[data-partner-coordinate-wrap]');
  const contextsInput = form.querySelector('input[name="contexts"]');
  const contextPreview = form.querySelector('[data-partner-context-preview]');
  const groupPairs = [
    {
      group: form.querySelector('select[name="groupKey"]'),
      subgroup: form.querySelector('select[name="subgroupKey"]')
    },
    {
      group: form.querySelector('select[name="groupKey2"]'),
      subgroup: form.querySelector('select[name="subgroupKey2"]')
    },
    {
      group: form.querySelector('select[name="groupKey3"]'),
      subgroup: form.querySelector('select[name="subgroupKey3"]')
    }
  ];

  const syncPath = () => {
    const google = state.leadPath === 'google_import';
    manualBody?.classList.toggle('hidden', google);
    googleNote?.classList.toggle('hidden', !google);
    if (submitButton instanceof HTMLButtonElement) submitButton.disabled = google;
  };

  const syncCoordinate = () => {
    coordWrap?.classList.toggle('hidden', !(coordToggle instanceof HTMLInputElement && coordToggle.checked));
  };

  const syncContexts = () => {
    const data = new FormData(form);
    const contexts = partnerGeneratedLeadContexts(data);
    if (contextsInput instanceof HTMLInputElement) contextsInput.value = contexts.join(', ');
    if (contextPreview instanceof HTMLElement) {
      contextPreview.textContent = contexts.length
        ? `${contexts.length} ${text('partner.lead.contexts.generated.count', 'generated routes')}`
        : text('partner.lead.contexts.generated.empty', 'Generated from country, city, and SEO & discovery choices.');
    }
  };

  countryInput?.addEventListener('input', () => {
    if (countryInput instanceof HTMLInputElement) {
      countryInput.value = String(countryInput.value || '').replace(/[^a-z]/gi, '').toUpperCase().slice(0, 2);
    }
    syncContexts();
  });

  coordToggle?.addEventListener('change', syncCoordinate);

  [
    'city',
    'country',
    'groupKey',
    'subgroupKey',
    'groupKey2',
    'subgroupKey2',
    'groupKey3',
    'subgroupKey3'
  ].forEach((name) => {
    form.querySelector(`[name="${name}"]`)?.addEventListener('change', syncContexts);
    form.querySelector(`[name="${name}"]`)?.addEventListener('input', syncContexts);
  });

  loadPartnerStructureCatalog().then((structureRows) => {
    groupPairs.forEach((pair) => {
      if (!(pair.group instanceof HTMLSelectElement) || !(pair.subgroup instanceof HTMLSelectElement)) return;

      const renderSubgroups = () => {
        pair.subgroup.innerHTML = renderPartnerSubgroupOptions(structureRows, pair.group.value, pair.subgroup.value);
        syncContexts();
      };

      pair.group.innerHTML = renderPartnerGroupOptions(structureRows, pair.group.value);
      renderSubgroups();

      pair.group.addEventListener('change', () => {
        pair.subgroup.value = '';
        renderSubgroups();
      });

      pair.subgroup.addEventListener('change', syncContexts);
    });

    syncContexts();
  });

  syncPath();
  syncCoordinate();
  syncContexts();
}

function renderLeadCard(lead) {
  const leadId = String(lead?.leadId || '').trim();
  const handoffUrl = state.handoffUrlByLeadId.get(leadId) || '';
  const hasDraft = lead?.hasDraft === true || !!lead?.draftULID;

  return `
    <article class="partner-lead-card">
      <div class="partner-card-head">
        <div>
          <strong>${escapeHtml(lead?.businessName || leadId || 'Lead')}</strong><br>
          <small>${escapeHtml([lead?.city, lead?.country].filter(Boolean).join(', ') || lead?.website || '')}</small>
        </div>
        <span class="partner-pill partner-pill-${escapeHtml(lead?.status || 'reserved')}">${escapeHtml(lead?.status || 'reserved')}</span>
      </div>
      <div class="partner-card-meta">
        <span>${escapeHtml(text('partner.lead.expires', 'Expires'))}: ${escapeHtml(formatDate(lead?.expiresAt) || '—')}</span>
        <span>${escapeHtml(hasDraft ? text('partner.lead.draftReady', 'Draft ready') : text('partner.lead.noDraft', 'No draft'))}</span>
      </div>
      ${handoffUrl ? `<div class="partner-handoff-box"><span>${escapeHtml(handoffUrl)}</span></div>` : ''}
      <div class="partner-actions-row">
        <button type="button" class="modal-body-button" data-partner-action="prepare-draft" data-lead-id="${escapeHtml(leadId)}">${escapeHtml(hasDraft ? text('partner.lead.refreshDraft', 'Refresh draft') : text('partner.lead.prepareDraft', 'Prepare draft'))}</button>
        <button type="button" class="modal-body-button" data-partner-action="create-handoff" data-lead-id="${escapeHtml(leadId)}" ${hasDraft ? '' : 'disabled'}>${escapeHtml(text('partner.lead.createHandoff', 'Create handoff'))}</button>
        <button type="button" class="modal-body-button" data-partner-action="archive-lead" data-lead-id="${escapeHtml(leadId)}">${escapeHtml(text('partner.lead.archive', 'Archive'))}</button>
      </div>
    </article>
  `;
}

function renderRenewalTasksPanel() {
  const tasks = asArray(state.renewalTasks);

  return `
    <div class="partner-status-card">
      <strong>${escapeHtml(text('partner.renewal.title', 'Renewal opportunities'))}</strong><br>
      <small>${escapeHtml(text('partner.renewal.desc', 'Follow up on converted Partner leads with expiring or expired NaviGen Plans.'))}</small>
    </div>
    <div class="partner-list">
      ${tasks.length ? tasks.map((task) => `
        <article class="partner-lead-card">
          <div class="partner-card-head">
            <div>
              <strong>${escapeHtml(task.title || task.businessName || task.taskId || 'Renewal task')}</strong><br>
              <small>${escapeHtml(task.detail || '')}</small>
            </div>
            <span class="partner-pill partner-pill-${escapeHtml(task.status || 'open')}">${escapeHtml(task.status || 'open')}</span>
          </div>
          <div class="partner-card-meta">
            <span>${escapeHtml(text('partner.renewal.expires', 'Plan expires'))}: ${escapeHtml(formatDate(task.planExpiresAt) || '—')}</span>
            <span>${escapeHtml(task.planTier || '')} · ${escapeHtml(task.planMode || '')}</span>
            <span>${escapeHtml(text('partner.renewal.priority', 'Priority'))}: ${escapeHtml(task.priority || 'normal')}</span>
          </div>
          <div class="partner-actions-row">
            <button type="button" class="modal-body-button" data-partner-action="complete-renewal" data-task-id="${escapeHtml(task.taskId || '')}">${escapeHtml(text('partner.renewal.complete', 'Complete'))}</button>
            <button type="button" class="modal-body-button" data-partner-action="dismiss-renewal" data-task-id="${escapeHtml(task.taskId || '')}">${escapeHtml(text('partner.renewal.dismiss', 'Dismiss'))}</button>
          </div>
        </article>
      `).join('') : `
        <div class="partner-empty">${escapeHtml(text('partner.renewal.empty', 'No renewal opportunities yet.'))}</div>
      `}
    </div>
  `;
}

function renderCommissionsPanel() {
  const commissions = asArray(state.commissions);
  return `
    <div class="partner-list">
      ${commissions.length ? commissions.map((commission) => `
        <article class="partner-lead-card">
          <div class="partner-card-head">
            <div>
              <strong>${escapeHtml(commission.commissionAmount || '0')} ${escapeHtml(commission.currency || 'EUR')}</strong><br>
              <small>${escapeHtml(commission.planTier || '')} · ${escapeHtml(commission.planMode || '')}</small>
            </div>
            <span class="partner-pill">${escapeHtml(commission.status || '')}</span>
          </div>
          <div class="partner-card-meta">
            <span>${escapeHtml(text('partner.commission.eligibleAt', 'Eligible'))}: ${escapeHtml(formatDate(commission.eligibleAt) || '—')}</span>
            <span>${escapeHtml(commission.commissionPolicyVersion || '')}</span>
          </div>
        </article>
      `).join('') : `
        <div class="partner-empty">${escapeHtml(text('partner.commission.empty', 'No commission ledger entries yet.'))}</div>
      `}
    </div>
  `;
}

async function loadPartnerWorkspace() {
  state.loading = true;
  state.message = '';
  renderPartnerCenter();

  const session = await api('/api/partner/session');
  const started = session?.authenticated === true
    ? session
    : await api('/api/partner/start', { method: 'POST', body: {} });

  state.partner = { ...(started.partner || {}), launch: started.launch || {} };

  await refreshPartnerLists();
  state.loading = false;
  renderPartnerCenter();
}

async function refreshPartnerLists() {
  const [leads, commissions, renewalTasks] = await Promise.all([
    api('/api/partner/leads'),
    api('/api/partner/commissions'),
    api('/api/partner/renewal-tasks').catch((err) => {
      if (Number(err?.status || 0) === 404) return { items: [] };
      throw err;
    })
  ]);

  state.partner = { ...(state.partner || {}), ...(leads.partner || {}), launch: leads.launch || state.partner?.launch || {} };
  state.leads = asArray(leads.items);
  state.commissions = asArray(commissions.items);
  state.renewalTasks = asArray(renewalTasks.items);
}

async function handlePartnerCenterAction(action) {
  const type = String(action.dataset.partnerAction || '').trim();
  const leadId = String(action.dataset.leadId || '').trim();

  try {
    if (type === 'open-leads') {
      showPartnerLeadsSurface();
      return;
    }

    if (type === 'open-renewals') {
      showPartnerRenewalsSurface();
      return;
    }

    if (type === 'open-commissions') {
      showPartnerCommissionsSurface();
      return;
    }

    if (type === 'refresh') {
      await refreshPartnerLists();
      state.message = text('partner.center.refreshed', 'Partner Center refreshed.');
      renderPartnerCenter();
      return;
    }

    if (type === 'connect-status') {
      const status = await api('/api/partner/connect/status');
      state.partner = { ...(state.partner || {}), ...(status.partner || {}), launch: status.launch || state.partner?.launch || {} };
      state.message = text('partner.connect.statusRefreshed', 'Payout identity status refreshed.');
      renderPartnerCenter();
      return;
    }
    
    if (type === 'connect-start') {
      const setup = await requestPartnerConnectSetup();
      if (!setup) return;

      const connect = await api('/api/partner/connect/start', {
        method: 'POST',
        body: {
          email: setup.email,
          country: setup.country,
          returnUrl: `${location.origin}/partner/center?connect=return`,
          refreshUrl: `${location.origin}/partner/center?connect=refresh`
        }
      });

      const url = String(connect?.url || '').trim();
      if (!url) throw new Error(text('partner.connect.noUrl', 'Stripe Connect did not return an onboarding URL.'));

      location.href = url;
      return;
    }    
    
    if (type === 'prepare-draft' && leadId) {
      await api(`/api/partner/leads/${encodeURIComponent(leadId)}/draft`, { method: 'POST', body: { draft: {} } });
      await refreshPartnerLists();
      state.message = text('partner.lead.draftPrepared', 'Partner draft prepared.');
      renderPartnerCenter();
      return;
    }

    if (type === 'create-handoff' && leadId) {
      const handoff = await api(`/api/partner/handoff/${encodeURIComponent(leadId)}/create`, { method: 'POST', body: {} });
      const url = String(handoff.handoffUrl || '').trim();
      if (url) {
        state.handoffUrlByLeadId.set(leadId, url);
        try { await navigator.clipboard?.writeText?.(url); } catch {}
      }
      await refreshPartnerLists();
      state.message = url
        ? text('partner.lead.handoffCopied', 'Handoff link created and copied when clipboard is available.')
        : text('partner.lead.handoffCreated', 'Handoff link created.');
      renderPartnerCenter();
      return;
    }

    if (type === 'archive-lead' && leadId) {
      await api(`/api/partner/leads/${encodeURIComponent(leadId)}/archive`, { method: 'POST', body: {} });
      await refreshPartnerLists();
      state.message = text('partner.lead.archived', 'Lead archived.');
      renderPartnerCenter();
    }
    const taskId = String(action.dataset.taskId || '').trim();

    if (type === 'complete-renewal' && taskId) {
      await api(`/api/partner/renewal-tasks/${encodeURIComponent(taskId)}/complete`, { method: 'POST', body: {} });
      await refreshPartnerLists();
      state.message = text('partner.renewal.completed', 'Renewal task completed.');
      renderPartnerCenter();
      return;
    }

    if (type === 'dismiss-renewal' && taskId) {
      await api(`/api/partner/renewal-tasks/${encodeURIComponent(taskId)}/dismiss`, { method: 'POST', body: {} });
      await refreshPartnerLists();
      state.message = text('partner.renewal.dismissed', 'Renewal task dismissed.');
      renderPartnerCenter();
    }    
  } catch (err) {
    showToast(String(err?.message || text('partner.center.error', 'Partner action failed.')), 3200);
  }
}

async function submitPartnerLeadForm(form) {
  const data = new FormData(form);

  if (state.leadPath === 'google_import') {
    showToast(text('partner.lead.google.blocked', 'Use Partner Google import only after the Partner attribution bridge is connected.'), 3200);
    return;
  }

  const generatedContexts = partnerGeneratedLeadContexts(data);
  const manualContexts = String(data.get('contexts') || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const contexts = Array.from(new Set([...generatedContexts, ...manualContexts]));

  const payload = {
    source: 'partner_manual',
    businessName: String(data.get('businessName') || '').trim(),
    website: String(data.get('website') || '').trim(),
    phone: String(data.get('phone') || '').trim(),
    address: String(data.get('address') || '').trim(),
    postalCode: String(data.get('postalCode') || '').trim(),
    city: String(data.get('city') || '').trim(),
    country: String(data.get('country') || '').trim().toUpperCase(),
    coord: String(data.get('coord') || '').trim(),
    groupKey: String(data.get('groupKey') || '').trim(),
    subgroupKey: String(data.get('subgroupKey') || '').trim(),
    contexts
  };

  try {
    await api('/api/partner/leads', { method: 'POST', body: payload });
    form.reset();
    await refreshPartnerLists();
    state.message = text('partner.lead.created', 'Partner lead created.');
    renderPartnerCenter();
  } catch (err) {
    showToast(String(err?.message || text('partner.lead.createError', 'Could not create Partner lead.')), 3600);
  }
}

export async function openPartnerCenter() {
  ensurePartnerCenterModal();
  showModal(PARTNER_CENTER_MODAL_ID);

  try {
    await loadPartnerWorkspace();

    const params = new URL(location.href).searchParams;
    const connectReturn = params.get('connect') === 'return' || params.get('connect') === 'refresh';

    if (connectReturn) {
      const status = await api('/api/partner/connect/status');
      state.partner = { ...(state.partner || {}), ...(status.partner || {}), launch: status.launch || state.partner?.launch || {} };
      state.message = text('partner.connect.statusRefreshed', 'Payout identity status refreshed.');
      history.replaceState({}, document.title, location.pathname + location.hash);
      renderPartnerCenter();
    }
  } catch (err) {
    state.loading = false;
    state.message = String(err?.message || text('partner.center.error', 'Could not open Partner Center.'));
    renderPartnerCenter();
  }
}

const PARTNER_ADMIN_MODAL_ID = 'partner-admin-modal';

const adminState = {
  token: '',
  partners: [],
  selectedPartner: null,
  message: '',
  loading: false
};

function ensureAdminToken() {
  if (adminState.token) return adminState.token;

  const entered = window.prompt(text('partner.admin.tokenPrompt', 'Enter NaviGen admin bearer token'));
  const token = String(entered || '').replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    throw new Error(text('partner.admin.tokenRequired', 'Admin bearer token is required.'));
  }

  adminState.token = token;
  return token;
}

async function adminApi(path, opts = {}) {
  const token = ensureAdminToken();
  const method = String(opts.method || 'GET').toUpperCase();
  const hasBody = Object.prototype.hasOwnProperty.call(opts, 'body');

  const res = await fetch(path, {
    method,
    cache: 'no-store',
    credentials: 'include',
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${token}`,
      ...(hasBody ? { 'Content-Type': 'application/json' } : {})
    },
    body: hasBody ? JSON.stringify(opts.body || {}) : undefined
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) adminState.token = '';
    const err = new Error(String(json?.error?.message || json?.error?.code || `HTTP ${res.status}`));
    err.status = res.status;
    err.payload = json;
    throw err;
  }

  return json || {};
}

function ensurePartnerAdminModal() {
  const modal = injectModal({
    id: PARTNER_ADMIN_MODAL_ID,
    title: text('partner.admin.title', 'Admin platform'),
    layout: 'menu',
    bodyHTML: '<div id="partner-admin-root" class="partner-center"></div>'
  });

  if (!modal.dataset.partnerAdminBound) {
    modal.dataset.partnerAdminBound = '1';

    modal.addEventListener('click', async (ev) => {
      const target = ev.target instanceof Element ? ev.target : null;
      const action = target?.closest?.('[data-partner-admin-action]');
      if (!(action instanceof HTMLElement)) return;

      ev.preventDefault();
      await handlePartnerAdminAction(action);
    });
  }

  return modal;
}

function renderPartnerAdminPlatform() {
  const root = document.getElementById('partner-admin-root');
  if (!root) return;

  if (adminState.loading) {
    root.innerHTML = `
      <div class="partner-status-card">
        <strong>${escapeHtml(text('partner.admin.loading.title', 'Loading Admin Platform...'))}</strong><br>
        <small>${escapeHtml(text('partner.admin.loading.desc', 'Reading Partner operational state.'))}</small>
      </div>
    `;
    return;
  }

  const partners = asArray(adminState.partners);
  const selected = adminState.selectedPartner || null;

  root.innerHTML = `
    <div class="partner-center-shell">
      ${adminState.message ? `<div class="partner-status-card partner-status-card-info">${escapeHtml(adminState.message)}</div>` : ''}

      <div class="partner-status-card">
        <strong>${escapeHtml(text('partner.admin.overview.title', 'Partner operations'))}</strong><br>
        <small>${escapeHtml(text('partner.admin.overview.desc', 'Inspect Partner status, capacity, leads, attribution, and commission ledger state.'))}</small>
      </div>

      <div class="partner-actions-row">
        <button type="button" class="modal-body-button" data-partner-admin-action="refresh">${escapeHtml(text('partner.admin.refresh', 'Refresh partners'))}</button>
        <button type="button" class="modal-body-button" data-partner-admin-action="renewal-run">${escapeHtml(text('partner.admin.renewalRun', 'Refresh renewal tasks'))}</button>
        <button type="button" class="modal-body-button" data-partner-admin-action="payrun-dry">${escapeHtml(text('partner.admin.payrunDry', 'Dry-run payouts'))}</button>
        <button type="button" class="modal-body-button" data-partner-admin-action="payrun-execute">${escapeHtml(text('partner.admin.payrunExecute', 'Run eligible payouts'))}</button>
        <button type="button" class="modal-body-button" data-partner-admin-action="reset-token">${escapeHtml(text('partner.admin.resetToken', 'Change admin token'))}</button>
      </div>

      <div class="partner-summary-grid">
        <div class="partner-summary-card">
          <small>${escapeHtml(text('partner.admin.totalPartners', 'Loaded partners'))}</small>
          <strong>${partners.length}</strong>
        </div>
        <div class="partner-summary-card">
          <small>${escapeHtml(text('partner.admin.selectedPartner', 'Selected Partner'))}</small>
          <strong>${escapeHtml(selected?.partner?.partnerId || '—')}</strong>
        </div>
      </div>

      <div class="partner-list">
        ${partners.length ? partners.map(renderAdminPartnerCard).join('') : `
          <div class="partner-empty">${escapeHtml(text('partner.admin.empty', 'No Partner profiles loaded.'))}</div>
        `}
      </div>

      ${selected ? renderAdminPartnerDetail(selected) : ''}
    </div>
  `;
}

function renderAdminPartnerCard(partner) {
  const partnerId = String(partner?.partnerId || '').trim();

  return `
    <article class="partner-lead-card">
      <div class="partner-card-head">
        <div>
          <strong>${escapeHtml(partnerId || 'Partner')}</strong><br>
          <small>${escapeHtml(partner?.connectStatus || 'not_started')} · ${escapeHtml(partner?.commissionPolicyVersion || '')}</small>
        </div>
        <span class="partner-pill partner-pill-${escapeHtml(partner?.status || 'applicant')}">${escapeHtml(partner?.status || 'applicant')}</span>
      </div>
      <div class="partner-card-meta">
        <span>${escapeHtml(text('partner.admin.openLeads', 'Open leads'))}: ${Number(partner?.openLeadCount || 0)} / ${Number(partner?.leadCapacity || 0)}</span>
        <span>${escapeHtml(text('partner.admin.freeQuota', 'Free quota'))}: ${Number(partner?.freeLeadQuota || 0)}</span>
        <span>${escapeHtml(text('partner.admin.updated', 'Updated'))}: ${escapeHtml(formatDate(partner?.updatedAt) || '—')}</span>
      </div>
      <div class="partner-actions-row">
        <button type="button" class="modal-body-button" data-partner-admin-action="view-partner" data-partner-id="${escapeHtml(partnerId)}">${escapeHtml(text('partner.admin.view', 'View'))}</button>
        <button type="button" class="modal-body-button" data-partner-admin-action="set-status" data-partner-id="${escapeHtml(partnerId)}">${escapeHtml(text('partner.admin.setStatus', 'Set status'))}</button>
        <button type="button" class="modal-body-button" data-partner-admin-action="set-capacity" data-partner-id="${escapeHtml(partnerId)}">${escapeHtml(text('partner.admin.setCapacity', 'Set capacity'))}</button>
      </div>
    </article>
  `;
}

function renderAdminPartnerDetail(detail) {
  const partner = detail.partner || {};
  const leads = asArray(detail.leads);
  const commissions = asArray(detail.commissions);

  return `
    <div class="partner-status-card">
      <strong>${escapeHtml(text('partner.admin.detail.title', 'Partner detail'))}</strong><br>
      <small>${escapeHtml(partner.partnerId || '')}</small>
    </div>

    <div class="partner-summary-grid">
      <div class="partner-summary-card">
        <small>${escapeHtml(text('partner.admin.leads', 'Leads'))}</small>
        <strong>${leads.length}</strong>
      </div>
      <div class="partner-summary-card">
        <small>${escapeHtml(text('partner.admin.commissions', 'Commissions'))}</small>
        <strong>${commissions.length}</strong>
      </div>
    </div>

    <div class="partner-list">
      ${leads.length ? leads.map((lead) => `
        <article class="partner-lead-card">
          <div class="partner-card-head">
            <div>
              <strong>${escapeHtml(lead.businessName || lead.leadId || 'Lead')}</strong><br>
              <small>${escapeHtml(lead.leadId || '')}</small>
            </div>
            <span class="partner-pill partner-pill-${escapeHtml(lead.status || 'reserved')}">${escapeHtml(lead.status || '')}</span>
          </div>
          <div class="partner-card-meta">
            <span>${escapeHtml(lead.city || '')} ${escapeHtml(lead.country || '')}</span>
            <span>${escapeHtml(lead.hasDraft ? text('partner.lead.draftReady', 'Draft ready') : text('partner.lead.noDraft', 'No draft'))}</span>
          </div>
          <div class="partner-actions-row">
            <button type="button" class="modal-body-button" data-partner-admin-action="revoke-attribution" data-partner-id="${escapeHtml(partner.partnerId || '')}" data-lead-id="${escapeHtml(lead.leadId || '')}">${escapeHtml(text('partner.admin.revokeAttribution', 'Revoke attribution'))}</button>
          </div>
        </article>
      `).join('') : `
        <div class="partner-empty">${escapeHtml(text('partner.admin.noLeads', 'No leads for this Partner.'))}</div>
      `}
    </div>

    <div class="partner-list">
      ${commissions.length ? commissions.map((commission) => `
        <article class="partner-lead-card">
          <div class="partner-card-head">
            <div>
              <strong>${escapeHtml(commission.commissionAmount || '0')} ${escapeHtml(commission.currency || 'EUR')}</strong><br>
              <small>${escapeHtml(commission.partnerLeadId || '')}</small>
            </div>
            <span class="partner-pill">${escapeHtml(commission.status || '')}</span>
          </div>
          <div class="partner-card-meta">
            <span>${escapeHtml(commission.planTier || '')} · ${escapeHtml(commission.planMode || '')}</span>
            <span>${escapeHtml(text('partner.commission.eligibleAt', 'Eligible'))}: ${escapeHtml(formatDate(commission.eligibleAt) || '—')}</span>
          </div>
        </article>
      `).join('') : `
        <div class="partner-empty">${escapeHtml(text('partner.admin.noCommissions', 'No commission entries for this Partner.'))}</div>
      `}
    </div>
  `;
}

async function loadPartnerAdminPlatform() {
  adminState.loading = true;
  adminState.message = '';
  renderPartnerAdminPlatform();

  const partners = await adminApi('/api/admin/partners?limit=50');
  adminState.partners = asArray(partners.items);
  adminState.loading = false;
  renderPartnerAdminPlatform();
}

async function refreshAdminSelectedPartner(partnerId) {
  const detail = await adminApi(`/api/admin/partners/${encodeURIComponent(partnerId)}`);
  adminState.selectedPartner = detail;
}

async function handlePartnerAdminAction(action) {
  const type = String(action.dataset.partnerAdminAction || '').trim();
  const partnerId = String(action.dataset.partnerId || '').trim();
  const leadId = String(action.dataset.leadId || '').trim();

  try {
    if (type === 'refresh') {
      await loadPartnerAdminPlatform();
      adminState.message = text('partner.admin.refreshed', 'Partner Admin Platform refreshed.');
      renderPartnerAdminPlatform();
      return;
    }

    if (type === 'reset-token') {
      adminState.token = '';
      ensureAdminToken();
      await loadPartnerAdminPlatform();
      return;
    }

    if (type === 'renewal-run') {
      const run = await adminApi('/api/admin/partner-renewal-tasks/run', {
        method: 'POST',
        body: {
          limit: 50
        }
      });

      adminState.message = text('partner.admin.renewalRunDone', 'Renewal task refresh completed.') + ` partners=${Number(run.scannedPartners || 0)} converted=${Number(run.scannedConvertedLeads || 0)} tasks=${Number(run.createdOrUpdated || 0)}`;
      renderPartnerAdminPlatform();
      return;
    }
    
    if (type === 'payrun-dry') {
      const run = await adminApi('/api/admin/partner-commissions/pay-run', {
        method: 'POST',
        body: {
          dryRun: true,
          limit: 50
        }
      });

      adminState.message = text('partner.admin.payrunDryDone', 'Payout dry-run completed.') + ` eligible=${Number(run.eligible || 0)} skipped=${Number(run.skipped || 0)}`;
      renderPartnerAdminPlatform();
      return;
    }

    if (type === 'payrun-execute') {
      const phrase = 'PAY_ELIGIBLE_PARTNER_COMMISSIONS';
      const confirmed = String(window.prompt(text('partner.admin.payrunConfirmPrompt', 'Type PAY_ELIGIBLE_PARTNER_COMMISSIONS to run eligible payouts'), '') || '').trim();
      if (confirmed !== phrase) {
        adminState.message = text('partner.admin.payrunCanceled', 'Payout run canceled.');
        renderPartnerAdminPlatform();
        return;
      }

      const run = await adminApi('/api/admin/partner-commissions/pay-run', {
        method: 'POST',
        body: {
          dryRun: false,
          execute: true,
          confirm: phrase,
          limit: 50
        }
      });

      adminState.message = text('partner.admin.payrunExecuteDone', 'Payout run completed.') + ` paid=${Number(run.paid || 0)} skipped=${Number(run.skipped || 0)}`;
      renderPartnerAdminPlatform();
      return;
    }

    if (type === 'view-partner' && partnerId) {
      await refreshAdminSelectedPartner(partnerId);
      adminState.message = text('partner.admin.detailLoaded', 'Partner detail loaded.');
      renderPartnerAdminPlatform();
      return;
    }

    if (type === 'set-status' && partnerId) {
      const current = adminState.partners.find((partner) => partner.partnerId === partnerId)?.status || 'applicant';
      const status = String(window.prompt(text('partner.admin.statusPrompt', 'Enter Partner status'), current) || '').trim();
      if (!status) return;

      await adminApi(`/api/admin/partners/${encodeURIComponent(partnerId)}/status`, {
        method: 'POST',
        body: { status }
      });

      await loadPartnerAdminPlatform();
      await refreshAdminSelectedPartner(partnerId).catch(() => {});
      adminState.message = text('partner.admin.statusUpdated', 'Partner status updated.');
      renderPartnerAdminPlatform();
      return;
    }

    if (type === 'set-capacity' && partnerId) {
      const current = adminState.partners.find((partner) => partner.partnerId === partnerId);
      const leadCapacity = Number(window.prompt(text('partner.admin.capacityPrompt', 'Enter lead capacity'), String(current?.leadCapacity ?? 5)) || current?.leadCapacity || 5);
      const freeLeadQuota = Number(window.prompt(text('partner.admin.freeQuotaPrompt', 'Enter free lead quota'), String(current?.freeLeadQuota ?? 5)) || current?.freeLeadQuota || 5);

      await adminApi(`/api/admin/partners/${encodeURIComponent(partnerId)}/capacity`, {
        method: 'POST',
        body: { leadCapacity, freeLeadQuota }
      });

      await loadPartnerAdminPlatform();
      await refreshAdminSelectedPartner(partnerId).catch(() => {});
      adminState.message = text('partner.admin.capacityUpdated', 'Partner capacity updated.');
      renderPartnerAdminPlatform();
      return;
    }

    if (type === 'revoke-attribution' && partnerId && leadId) {
      const reason = String(window.prompt(text('partner.admin.revokeReasonPrompt', 'Enter revoke reason'), 'admin_attribution_revoked') || 'admin_attribution_revoked').trim();

      await adminApi(`/api/admin/partners/${encodeURIComponent(partnerId)}/revoke-attribution`, {
        method: 'POST',
        body: {
          partnerLeadId: leadId,
          reason
        }
      });

      await loadPartnerAdminPlatform();
      await refreshAdminSelectedPartner(partnerId).catch(() => {});
      adminState.message = text('partner.admin.attributionRevoked', 'Partner attribution revoked.');
      renderPartnerAdminPlatform();
    }
  } catch (err) {
    showToast(String(err?.message || text('partner.admin.error', 'Admin action failed.')), 3600);
  }
}

export async function openPartnerAdminPlatform() {
  ensurePartnerAdminModal();
  showModal(PARTNER_ADMIN_MODAL_ID);

  try {
    ensureAdminToken();
    await loadPartnerAdminPlatform();
  } catch (err) {
    adminState.loading = false;
    adminState.message = String(err?.message || text('partner.admin.error', 'Could not open Partner Admin Platform.'));
    renderPartnerAdminPlatform();
  }
}

function ensurePartnerHandoffModal() {
  const modal = injectModal({
    id: PARTNER_HANDOFF_MODAL_ID,
    title: text('partner.handoff.title', 'Partner handoff preview'),
    layout: 'menu',
    bodyHTML: '<div id="partner-handoff-root" class="partner-center"></div>'
  });

  if (!modal.dataset.partnerHandoffBound) {
    modal.dataset.partnerHandoffBound = '1';
    modal.addEventListener('click', async (ev) => {
      const target = ev.target instanceof Element ? ev.target : null;
      const action = target?.closest?.('[data-partner-handoff-action]');
      if (!(action instanceof HTMLElement)) return;

      ev.preventDefault();
      await handleHandoffAction(action);
    });
  }

  return modal;
}

const handoffState = {
  token: '',
  preview: null,
  message: ''
};

function renderHandoffPreview() {
  const root = document.getElementById('partner-handoff-root');
  if (!root) return;

  const preview = handoffState.preview;
  if (!preview) {
    root.innerHTML = `<div class="partner-status-card">${escapeHtml(handoffState.message || text('partner.handoff.loading', 'Loading handoff preview...'))}</div>`;
    return;
  }

  root.innerHTML = `
    <div class="partner-status-card">
      <strong>${escapeHtml(preview.lead?.businessName || text('partner.handoff.business', 'Business preview'))}</strong><br>
      <small>${escapeHtml([preview.lead?.address, preview.lead?.city, preview.lead?.country].filter(Boolean).join(', '))}</small>
    </div>
    <div class="partner-status-card">
      <strong>${escapeHtml(text('partner.handoff.draft.title', 'Prepared NaviGen profile'))}</strong><br>
      <small>${escapeHtml(preview.draft?.description || text('partner.handoff.draft.desc', 'Review the prepared profile details before continuing.'))}</small>
    </div>
    ${handoffState.message ? `<div class="partner-status-card partner-status-card-info">${escapeHtml(handoffState.message)}</div>` : ''}
    <div class="partner-actions-row">
      <button type="button" class="modal-body-button" data-partner-handoff-action="accept">${escapeHtml(text('partner.handoff.accept', 'Accept handoff'))}</button>
      <button type="button" class="modal-body-button" data-partner-handoff-action="checkout">${escapeHtml(text('partner.handoff.checkout', 'Continue to Plan payment'))}</button>
      <button type="button" class="modal-body-button" data-partner-handoff-action="close">${escapeHtml(text('common.close', 'Close'))}</button>
    </div>
  `;
}

async function handleHandoffAction(action) {
  const type = String(action.dataset.partnerHandoffAction || '').trim();

  try {
    if (type === 'close') {
      hideModal(PARTNER_HANDOFF_MODAL_ID);
      return;
    }

    if (type === 'accept') {
      const accepted = await api(`/api/partner/handoff/${encodeURIComponent(handoffState.token)}/accept`, {
        method: 'POST',
        body: { accepted: true }
      });
      handoffState.preview = accepted;
      handoffState.message = text('partner.handoff.accepted', 'Handoff accepted.');
      renderHandoffPreview();
      return;
    }

    if (type === 'checkout') {
      const checkout = await api(`/api/partner/handoff/${encodeURIComponent(handoffState.token)}/plan-checkout`, {
        method: 'POST',
        body: { planCode: 'standard', planMode: 'managed_presence' }
      });
      const checkoutUrl = String(checkout?.url || '').trim();
      if (checkoutUrl) window.location.href = checkoutUrl;
      return;
    }
  } catch (err) {
    handoffState.message = String(err?.message || text('partner.handoff.error', 'Handoff action failed.'));
    renderHandoffPreview();
  }
}

export async function openPartnerHandoffPreview(token) {
  const cleanToken = String(token || '').trim();
  handoffState.token = cleanToken;
  handoffState.preview = null;
  handoffState.message = '';

  ensurePartnerHandoffModal();
  showModal(PARTNER_HANDOFF_MODAL_ID);
  renderHandoffPreview();

  try {
    handoffState.preview = await api(`/api/partner/handoff/${encodeURIComponent(cleanToken)}`);
    handoffState.message = '';
  } catch (err) {
    handoffState.message = String(err?.message || text('partner.handoff.error', 'Could not load handoff preview.'));
  }

  renderHandoffPreview();
}