// Jason FX Academy v4 — reveal, counters, FAQ, lead form (FormSubmit -> onespiritgate@gmail.com)
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // Animated counters
  const counters = document.querySelectorAll('.count');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target, target = parseInt(el.dataset.count || '0', 10);
      const start = performance.now(), dur = 900;
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      cio.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach((el) => cio.observe(el));

  // Live animated candlestick chart
  const chartEl = document.getElementById('liveCandles');
  const priceEl = document.getElementById('livePrice');
  const changeEl = document.getElementById('liveChange');
  const tickEl = document.getElementById('liveTick');
  if (chartEl) {
    let price = 2412.30;
    const mkCandle = (up) => {
      const c = document.createElement('div');
      c.className = 'live-candle ' + (up ? 'up' : 'down');
      const topWick = 6 + Math.random() * 22, body = 22 + Math.random() * 42, botWick = up ? 6 + Math.random() * 26 : 4 + Math.random() * 10;
      c.innerHTML = '<div class="wick-line' + (up ? ' gold' : '') + '" style="height:' + topWick.toFixed(0) + 'px"></div><div class="candle-body" style="height:' + body.toFixed(0) + 'px"></div><div class="wick-line' + (up ? ' gold' : '') + '" style="height:' + botWick.toFixed(0) + 'px"></div>';
      return c;
    };
    for (let i = 0; i < 14; i++) chartEl.appendChild(mkCandle(Math.random() > 0.45));
    setInterval(() => {
      const up = Math.random() > 0.42;
      const move = (Math.random() * 2.4 + 0.3) * (up ? 1 : -1);
      price = Math.max(2380, Math.min(2450, price + move));
      if (priceEl) {
        priceEl.textContent = '$' + price.toFixed(2);
        priceEl.style.color = up ? '#32d583' : '#f97066';
        setTimeout(() => { if (priceEl) priceEl.style.color = '#fff'; }, 600);
      }
      if (changeEl) {
        const pct = ((price - 2402.15) / 2402.15 * 100);
        changeEl.textContent = (pct >= 0 ? '▲ +' : '▼ ') + pct.toFixed(2) + '%';
        changeEl.className = 'chg ' + (pct >= 0 ? 'up' : 'down');
      }
      chartEl.appendChild(mkCandle(up));
      while (chartEl.children.length > 14) chartEl.removeChild(chartEl.firstChild);
      if (tickEl) {
        const eur = (1.0842 + (Math.random() - 0.5) * 0.001).toFixed(4);
        const gbp = (1.2718 + (Math.random() - 0.5) * 0.001).toFixed(4);
        const btc = Math.round(97420 + (Math.random() - 0.5) * 400);
        tickEl.textContent = 'EURUSD ' + eur + ' • GBPUSD ' + gbp + ' • BTC $' + btc.toLocaleString();
      }
    }, 1800);
  }

  document.querySelectorAll('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach((i) => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // Lead form — native POST to FormSubmit (no AJAX fetch).
  // The AJAX endpoint timed out and left the button stuck on
  // "Sending your details…", so the form now submits normally:
  // the browser posts to FormSubmit and lands on thank-you.html.
  const form = document.getElementById('leadForm');
  if (!form) return;
  const errorBox = document.getElementById('formError');
  const submitBtn = document.getElementById('submitBtn');
  form.addEventListener('submit', (e) => {
    const name = (form.name.value || '').trim();
    const email = (form.email.value || '').trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.preventDefault();
      errorBox.textContent = 'Please add your full name and a valid email address.';
      errorBox.style.display = 'block';
      return;
    }
    errorBox.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Vetting you a spot…';
    // Let the browser submit the form normally to FormSubmit,
    // which redirects to thank-you.html.
  });
});
