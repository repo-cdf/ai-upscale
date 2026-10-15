/* AI Upscale website — settings, before/after slider, donations, ads */
'use strict';

/* ---------------- SETTINGS — edit these ---------------- */
const CONFIG = {
  siteUrl: 'https://repo-cdf.github.io/ai-upscale/',
  version: '1.0.0',
  download: 'https://github.com/repo-cdf/ai-upscale/releases/download/v1.0.0/AI-Upscale-v1.0.0-Windows-NVIDIA.zip',
  sizeLabel: '167 KB installer',
  sha256: '6d1980c7af304fe2b7492a11e78f2d0017928b7b2d462a5c628dba8899082b35',
  virustotal: 'https://www.virustotal.com/gui/file/6d1980c7af304fe2b7492a11e78f2d0017928b7b2d462a5c628dba8899082b35',
  vtResult: '0 / 61 engines',   // shown on the green button (scanned 2026-10-15)

  // PayPal (Donate buttons aren't available for Saudi accounts → regular checkout link, visitor picks the amount)
  paypalEmail: 'rayan6razan@gmail.com',
  currency: 'USD',
  suggestedPrice: 5,   // optional "Pay $5 & download" — the free button always stays

  // Adsterra units for repo-cdf.github.io (publisher dashboard: beta.publishers.adsterra.com)
  adsterra: {
    host: 'https://bauval.org',
    native: '',   // native widget removed 2026-10-15: it attracted dating/gambling ads
    banner728x90: 'a759d28079132d88e05907e5c6e67e76',
    banner320x50: '606a341ab3645a1ad03056c96eb92c09',
  },
};
/* ------------------------------------------------------- */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200);
}

async function copyText(text, msg) {
  try { await navigator.clipboard.writeText(text); }
  catch (e) {
    const ta = Object.assign(document.createElement('textarea'), { value: text });
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove();
  }
  toast(msg);
}

// kind 'paid' = the optional $5 (download starts on return), 'donate' = visitor picks the amount
function paypalUrl(kind = 'donate') {
  const paid = kind === 'paid';
  const p = new URLSearchParams({
    cmd: '_xclick',
    business: CONFIG.paypalEmail,
    item_name: paid ? 'AI Upscale - optional $5 support (thank you!)' : 'Donation for AI Upscale - keeping it free for everyone',
    no_shipping: '1',
    currency_code: CONFIG.currency,
    rm: '1',
    return: CONFIG.siteUrl + '?thanks=' + kind,
    cancel_return: CONFIG.siteUrl,
  });
  if (paid) p.set('amount', String(CONFIG.suggestedPrice));
  return 'https://www.paypal.com/cgi-bin/webscr?' + p.toString();
}

function startDownload() {
  const a = Object.assign(document.createElement('a'), { href: CONFIG.download, download: '' });
  document.body.appendChild(a); a.click(); a.remove();
}

// visitor came back from PayPal → thank-you popup (+ download for the $5 checkout)
function showThanks() {
  const q = new URLSearchParams(location.search);
  const kind = q.get('thanks') || (location.hash === '#thanks' ? 'donate' : '');
  if (!kind) return;
  history.replaceState(null, '', location.pathname);
  const m = $('#thanks'), btn = $('#thanksBtn'), status = $('#thanksDl');
  btn.href = CONFIG.download;
  if (kind === 'paid') {
    setTimeout(() => { startDownload(); status.textContent = '✅ Your download has started — check your Downloads folder!'; }, 1200);
  } else {
    $('#thanksText').textContent = 'Your donation truly means the world to me. 😊 It helps keep AI Upscale — and every program I make — '
      + 'free for everyone, including people who can\'t afford to pay. I really appreciate you! 🙏✨';
    status.hidden = true;
    $('#thanksBtnLabel').textContent = 'Download AI Upscale';
  }
  m.hidden = false;
}

/* ---------------- before / after slider ---------------- */
function initSlider() {
  const box = $('#ba'), before = $('#baBefore'), handle = $('#baHandle');
  if (!box) return;
  const inner = before.querySelector('img');
  const set = (pct) => {
    pct = Math.max(0, Math.min(100, pct));
    before.style.width = pct + '%';
    handle.style.left = pct + '%';
  };
  const size = () => { inner.style.width = box.clientWidth + 'px'; };
  size(); window.addEventListener('resize', size);
  const fromEvent = (e) => {
    const r = box.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    set(x / r.width * 100);
  };
  let drag = false;
  box.addEventListener('pointerdown', (e) => { drag = true; box.setPointerCapture(e.pointerId); fromEvent(e); });
  box.addEventListener('pointermove', (e) => { if (drag) fromEvent(e); });
  box.addEventListener('pointerup', () => { drag = false; });
  // gentle intro sweep so people notice it's interactive
  let t0 = null;
  const sweep = (ts) => {
    if (drag) return;
    t0 = t0 || ts;
    const k = (ts - t0) / 1800;
    if (k > 1) { set(50); return; }
    set(50 + Math.sin(k * Math.PI * 2) * 22);
    requestAnimationFrame(sweep);
  };
  setTimeout(() => requestAnimationFrame(sweep), 700);
}

/* ---------------- ads (Adsterra, each banner in its own frame) ---------------- */
function adsterraBanner(key, w, h) {
  const f = document.createElement('iframe');
  f.width = w; f.height = h; f.title = 'Advertisement';
  f.setAttribute('scrolling', 'no'); f.style.border = '0';
  f.srcdoc = `<!doctype html><html><head><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body>` +
    `<script>atOptions={'key':'${key}','format':'iframe','height':${h},'width':${w},'params':{}};<\/script>` +
    `<script src="${CONFIG.adsterra.host}/22/${key}"><\/script></body></html>`;
  return f;
}
function initAds() {
  const A = CONFIG.adsterra;
  if (!A || !A.host) return;
  $$('.ad-slot').forEach((slot) => {
    slot.insertAdjacentHTML('beforeend', '<span class="ad-label">Advertisement — helps keep AI Upscale free</span>');
    if (slot.dataset.slot === 'native' && A.native) {
      slot.insertAdjacentHTML('beforeend', `<div id="container-${A.native}"></div>`);
      const s = document.createElement('script');
      s.async = true; s.setAttribute('data-cfasync', 'false'); s.src = `${A.host}/21/${A.native}`;
      slot.appendChild(s);
    } else if (slot.dataset.slot === 'banner') {
      const wide = window.innerWidth >= 800;
      slot.appendChild(wide ? adsterraBanner(A.banner728x90, 728, 90) : adsterraBanner(A.banner320x50, 320, 50));
    }
    slot.hidden = false;
  });
}

/* ---------------- wiring ---------------- */
function init() {
  $('#year').textContent = new Date().getFullYear();
  const dl = $('#dl');
  dl.href = CONFIG.download;
  $('#dlMeta').textContent = `v${CONFIG.version} · ${CONFIG.sizeLabel}`;
  $('#payNow').addEventListener('click', () => { location.href = paypalUrl('paid'); });
  $('#sha').textContent = CONFIG.sha256;
  const vt = $('#vt');
  vt.href = CONFIG.virustotal;
  if (CONFIG.vtResult) $('#vtMeta').textContent = `${CONFIG.vtResult} · view report`;

  const modal = $('#donate');
  const open = (e) => { e.preventDefault(); modal.hidden = false; };
  const close = () => { $$('.modal').forEach((m) => { m.hidden = true; }); };
  $$('[data-donate]').forEach((b) => b.addEventListener('click', open));
  $$('[data-close]').forEach((b) => b.addEventListener('click', close));
  $$('.modal').forEach((m) => m.addEventListener('click', (e) => { if (e.target === m) close(); }));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  $$('[data-paypal]').forEach((b) => b.addEventListener('click', () => window.open(paypalUrl('donate'), '_blank', 'noopener')));
  $$('[data-copy-email]').forEach((b) => b.addEventListener('click', () => copyText(CONFIG.paypalEmail, 'PayPal email copied — thank you so much! 💜')));
  $$('[data-share]').forEach((b) => b.addEventListener('click', async () => {
    const data = { title: 'AI Upscale — free AI video upscaler', text: 'Free AI video upscaler & 120 FPS interpolation for NVIDIA GPUs. No sign-up.', url: CONFIG.siteUrl };
    if (navigator.share) { try { await navigator.share(data); return; } catch (e) { /* fall through */ } }
    copyText(CONFIG.siteUrl, 'Link copied — thanks for sharing! ❤️');
  }));
  showThanks();

  initSlider();
  initAds();
}
document.addEventListener('DOMContentLoaded', init);
