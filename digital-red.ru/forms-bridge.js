(() => {
  const endpoint = location.pathname.startsWith('/digital-red-preview/')
    ? '/digital-red-preview/api/web-leads'
    : '/api/web-leads';

  const clean = value => String(value || '').trim();
  const field = (form, names) => {
    for (const name of names) {
      const element = form.querySelector(`[name="${name}"]`);
      if (element && clean(element.value)) return clean(element.value);
    }
    return '';
  };
  const setError = (form, message) => {
    const box = form.querySelector('.js-errorbox-all, .t-form__errorbox-wrapper');
    if (box) {
      box.style.display = 'block';
      const text = box.querySelector('ul') || box;
      text.textContent = message;
    } else alert(message);
  };
  const setSuccess = form => {
    form.classList.remove('js-send-form-error');
    form.classList.add('js-send-form-success');
    const inputs = form.querySelector('.t-form__inputsbox');
    if (inputs) inputs.style.display = 'none';
    const success = form.querySelector('.js-successbox');
    if (success) {
      success.textContent = 'Спасибо! Заявка отправлена. Мы скоро свяжемся с вами.';
      success.style.display = 'block';
    }
  };

  document.addEventListener('submit', async event => {
    const form = event.target.closest?.('form.t-form');
    if (!form) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (form.dataset.digitalredSending === '1') return;

    const phone = field(form, ['Phone']) || clean(form.querySelector('input[type="tel"]')?.value);
    const email = field(form, ['Email', 'email']);
    const contactName = field(form, ['Name', 'name']);
    const generic = field(form, ['Input']);
    const website = field(form, ['Website', 'website', 'Url', 'url']) || (/^(?:https?:\/\/|www\.)/i.test(generic) ? generic : '');
    const message = field(form, ['Textarea', 'Message', 'Comment', 'Description']) || (website ? '' : generic);
    if (!phone && !email) {
      setError(form, 'Укажите телефон или email.');
      return;
    }

    const submit = form.querySelector('[type="submit"]');
    form.dataset.digitalredSending = '1';
    if (submit) submit.disabled = true;
    if (!form.dataset.digitalredSubmissionId) {
      form.dataset.digitalredSubmissionId = crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    const params = new URLSearchParams(location.search);
    const utm = [...params].filter(([key]) => key.startsWith('utm_')).map(([key, value]) => `${key}=${value}`).join('&');
    const payload = {
      submission_id: form.dataset.digitalredSubmissionId.replace(/[^a-zA-Z0-9_-]/g, ''),
      contact_name: contactName,
      phone,
      email,
      website,
      message,
      service: field(form, ['tildaspec-formname']) || 'Заявка с сайта',
      form_name: field(form, ['tildaspec-formname']) || form.id,
      page: location.href,
      utm,
      website_trap: '',
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Не удалось отправить заявку.');
      setSuccess(form);
    } catch (error) {
      form.classList.add('js-send-form-error');
      setError(form, error.message || 'Не удалось отправить заявку. Попробуйте ещё раз.');
    } finally {
      form.dataset.digitalredSending = '0';
      if (submit) submit.disabled = false;
    }
  }, true);
})();
