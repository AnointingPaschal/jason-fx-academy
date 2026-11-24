// Jason FX Academy — lead form + FAQ + year
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });

  // Lead form
  const form = document.getElementById('leadForm');
  if (!form) return;
  const success = document.getElementById('formSuccess');
  const errorBox = document.getElementById('formError');
  const submitBtn = document.getElementById('submitBtn');
  const successName = document.getElementById('successName');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.style.display = 'none';
    success.style.display = 'none';

    const data = {
      name: form.name.value.trim(),
      email: form.email.value.trim(),
      whatsapp: form.whatsapp.value.trim(),
      experience: form.experience.value,
      market: form.market.value,
      country: form.country.value.trim(),
      source: 'jasonfxacademy.com — Wick Theory landing page',
      website: form.website ? form.website.value : '' // honeypot, must stay empty
    };

    if (!data.name || !data.email) {
      errorBox.textContent = 'Please add your full name and a valid email address.';
      errorBox.style.display = 'block';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errorBox.textContent = 'That email address does not look valid. Please check it and try again.';
      errorBox.style.display = 'block';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="bi bi-arrow-repeat"></i> Sending your details…';

    try {
      const res = await fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out.message || out.error || 'The form could not be sent.');

      if (successName) successName.textContent = data.name.split(' ')[0];
      form.style.display = 'none';
      success.style.display = 'block';
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (err) {
      errorBox.innerHTML = '<strong>Your details were not sent yet.</strong><br>' +
        (err.message || 'Please try again in a moment.') +
        '<br><span class="small">If this keeps happening, the academy inbox may not be connected yet — see GMAIL_SETUP.md in the project repo.</span>';
      errorBox.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-send"></i> Claim my free place';
    }
  });
});
