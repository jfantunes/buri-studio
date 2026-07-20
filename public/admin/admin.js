const ENDPOINTS = {
  login: '/.netlify/functions/admin-login',
  content: '/.netlify/functions/cms-content',
  update: '/.netlify/functions/cms-update'
};

const NAV = [
  ['dashboard', 'Overview'],
  ['site', 'Site'],
  ['home', 'Home'],
  ['work', 'Work'],
  ['projects', 'Projects'],
  ['about', 'About'],
  ['contact', 'Contact']
];

const state = {
  authenticated: false,
  content: null,
  section: 'dashboard',
  selectedProject: 0,
  uploads: [],
  dirty: false,
  loading: true,
  saving: false,
  toast: null
};

const app = document.querySelector('#app');

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

function getPath(root, path) {
  return path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), root);
}

function setPath(root, path, value) {
  const keys = path.split('.');
  let target = root;
  for (const key of keys.slice(0, -1)) {
    if (target[key] == null) target[key] = /^\d+$/.test(key) ? [] : {};
    target = target[key];
  }
  target[keys.at(-1)] = value;
}

function input(path, label, type = 'text', options = {}) {
  const value = getPath(state.content, path) ?? '';
  const extra = options.wide ? ' field--wide' : '';
  return `<label class="field${extra}"><span>${label}</span><input class="control" type="${type}" data-bind="${path}" value="${escapeHtml(value)}" ${options.placeholder ? `placeholder="${escapeHtml(options.placeholder)}"` : ''}></label>`;
}

function textarea(path, label, options = {}) {
  const value = getPath(state.content, path) ?? '';
  return `<label class="field field--wide"><span>${label}</span><textarea class="textarea" data-bind="${path}" ${options.rows ? `rows="${options.rows}"` : ''}>${escapeHtml(value)}</textarea></label>`;
}

function imageObject(path, label, options = {}) {
  const image = getPath(state.content, path) || {};
  const src = typeof image === 'string' ? image : image.src;
  const alt = typeof image === 'string' ? '' : image.alt || '';
  return `
    <article class="image-card">
      <div class="image-card__preview">${src ? `<img src="${escapeHtml(src)}" alt="">` : ''}</div>
      <div class="image-card__body">
        <label class="field"><span>${label} alt text</span><input class="control" data-image-alt="${path}" value="${escapeHtml(alt)}"></label>
        <label class="field"><span>Image URL</span><input class="control" data-image-src="${path}" value="${escapeHtml(src || '')}" placeholder="/images/uploads/example.webp"></label>
        <div class="image-card__actions">
          <button class="button button--ghost" type="button" data-upload-trigger="${path}">Upload image</button>
          ${options.remove ? `<button class="button button--danger" type="button" data-remove-image="${path}">Remove</button>` : ''}
        </div>
        <input class="hidden-input" type="file" accept="image/jpeg,image/png,image/webp" data-upload-input="${path}">
      </div>
    </article>`;
}

function ensureImageObject(path) {
  const current = getPath(state.content, path);
  if (!current || typeof current === 'string') {
    setPath(state.content, path, { src: current || '', alt: '' });
  }
  return getPath(state.content, path);
}

function markDirty() {
  state.dirty = true;
  render();
}

function reflectDirtyState() {
  const status = document.querySelector('.status');
  const saveButton = document.querySelector('[data-action="save"]');
  if (status) status.textContent = state.dirty ? 'Unsaved edits' : 'Synced with GitHub';
  if (saveButton) saveButton.disabled = state.saving;
}

async function api(endpoint, options = {}) {
  const response = await fetch(endpoint, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed with ${response.status}`);
  return data;
}

async function init() {
  try {
    const session = await api(ENDPOINTS.login);
    state.authenticated = session.authenticated;
    if (state.authenticated) await loadContent();
  } catch {
    state.authenticated = false;
  } finally {
    state.loading = false;
    render();
  }
}

async function loadContent() {
  const { content } = await api(ENDPOINTS.content);
  state.content = content;
  state.uploads = [];
  state.dirty = false;
}

function render() {
  if (state.loading) return;
  if (!state.authenticated) {
    renderLogin();
    return;
  }
  app.innerHTML = renderAdmin();
  renderToast();
}

function renderLogin(message = '') {
  app.innerHTML = `
    <section class="login">
      <div class="login__card">
        <p class="eyebrow">Private dashboard</p>
        <h1>Buri Studio CMS</h1>
        <p class="login__copy">Manage the live site content and media without opening GitHub. Changes are committed to the repository and Netlify rebuilds the site.</p>
        <form class="login__form" id="login-form">
          <label class="field"><span>Password</span><input class="control" name="password" type="password" autocomplete="current-password" required autofocus></label>
          <button class="button button--accent" type="submit">Enter dashboard</button>
          <p class="message" id="login-message">${escapeHtml(message)}</p>
        </form>
      </div>
    </section>`;
}

function renderAdmin() {
  return `
    <div class="admin">
      <aside class="sidebar">
        <div class="brand">
          <div class="brand__mark">B</div>
          <strong>Buri CMS</strong>
          <span>Content, images, and deploys.</span>
        </div>
        <nav class="nav" aria-label="Admin sections">
          ${NAV.map(([key, label]) => `<button type="button" class="${state.section === key ? 'is-active' : ''}" data-section="${key}"><span>${label}</span><span>→</span></button>`).join('')}
        </nav>
        <div class="sidebar__footer">
          <div class="status">${state.dirty ? 'Unsaved edits' : 'Synced with GitHub'}</div>
          <button class="button button--ghost" type="button" data-action="logout">Log out</button>
        </div>
      </aside>
      <main class="main">
        <div class="topbar">
          ${renderSectionTitle()}
          <div class="actions">
            <button class="button button--ghost" type="button" data-action="reload">Reload</button>
            <button class="button button--accent" type="button" data-action="save" ${state.saving ? 'disabled' : ''}>${state.saving ? 'Saving...' : 'Save & deploy'}</button>
          </div>
        </div>
        ${renderSection()}
      </main>
    </div>`;
}

function renderSectionTitle() {
  const titles = {
    dashboard: ['Overview', 'A quick read on the content that will be committed to GitHub.'],
    site: ['Site settings', 'Global identity, SEO defaults, analytics, and social links.'],
    home: ['Homepage', 'Hero slideshow, intro copy, and the home page search description.'],
    work: ['Work page', 'Heading and SEO content for the project listing page.'],
    projects: ['Projects', 'Create, edit, reorder, and upload project imagery.'],
    about: ['About', 'Studio biography, portrait, services, and about-page SEO.'],
    contact: ['Contact', 'Contact details and form labels used on the public site.']
  };
  const [title, copy] = titles[state.section];
  return `<div class="section-title"><h1>${title}</h1><p>${copy}</p></div>`;
}

function renderSection() {
  if (!state.content) return '<div class="notice">Content could not be loaded.</div>';
  return {
    dashboard: renderDashboard,
    site: renderSite,
    home: renderHome,
    work: renderWork,
    projects: renderProjects,
    about: renderAbout,
    contact: renderContact
  }[state.section]();
}

function renderDashboard() {
  const projects = state.content.project?.projects || [];
  const heroSlides = state.content.homepage?.hero?.slides || [];
  return `
    <section class="grid">
      <div class="panel">
        <div class="metrics">
          <div class="metric"><strong>${projects.length}</strong><span>Projects</span></div>
          <div class="metric"><strong>${heroSlides.length}</strong><span>Hero slides</span></div>
          <div class="metric"><strong>${state.uploads.length}</strong><span>Pending uploads</span></div>
        </div>
      </div>
      <div class="panel panel--half"><h2>How saving works</h2><p class="notice">When you save, the dashboard sends JSON and optimized images to a Netlify Function. The function commits everything to GitHub in one commit, then Netlify starts a fresh production build from that commit.</p></div>
      <div class="panel panel--half"><h2>Image note</h2><p class="notice">New uploads are optimized in your browser as WebP files and stored in <code>public/images/uploads/</code>. Existing responsive image sets remain untouched unless you replace them.</p></div>
    </section>`;
}

function renderSite() {
  return `
    <section class="grid">
      <div class="panel panel--half"><h2>Identity</h2><div class="form-grid">
        ${input('site.name', 'Studio name')}
        ${input('site.tagline', 'Tagline')}
        ${input('site.logo', 'Logo URL', 'text', { wide: true })}
        ${input('site.instagram', 'Instagram handle')}
        ${input('site.instagramUrl', 'Instagram URL')}
      </div></div>
      <div class="panel panel--half"><h2>SEO and analytics</h2><div class="form-grid">
        ${input('site.seo.siteUrl', 'Site URL')}
        ${input('site.seo.titleTemplate', 'Title template')}
        ${input('site.seo.defaultTitle', 'Default title', 'text', { wide: true })}
        ${textarea('site.seo.defaultDescription', 'Default description')}
        ${input('site.seo.ogImage', 'Default OG image', 'text', { wide: true })}
        ${input('site.analytics.gaMeasurementId', 'GA Measurement ID')}
      </div></div>
    </section>`;
}

function renderHome() {
  const slides = state.content.homepage?.hero?.slides || [];
  return `
    <section class="grid">
      <div class="panel"><h2>Copy</h2><div class="form-grid">
        ${textarea('homepage.intro', 'Intro')}
        ${textarea('homepage.seo.description', 'SEO description')}
        ${input('homepage.hero.intervalMs', 'Hero interval (ms)', 'number')}
      </div></div>
      <div class="panel"><h2>Hero slides</h2><div class="cards">
        ${slides.map((_, index) => imageObject(`homepage.hero.slides.${index}`, `Slide ${index + 1}`, { remove: true })).join('')}
      </div><div class="split-actions"><button class="button button--ghost" type="button" data-action="add-hero-slide">Add slide</button></div></div>
    </section>`;
}

function renderWork() {
  return `
    <section class="grid">
      <div class="panel"><h2>Work listing</h2><div class="form-grid">
        ${input('work.heading', 'Heading')}
        ${input('work.seo.title', 'SEO title')}
        ${textarea('work.seo.description', 'SEO description')}
      </div></div>
    </section>`;
}

function renderProjects() {
  const projects = state.content.project?.projects || [];
  const project = projects[state.selectedProject];
  return `
    <section class="project-layout">
      <aside class="project-list">
        ${projects.map((item, index) => `<button type="button" class="project-list__item ${index === state.selectedProject ? 'is-active' : ''}" data-project-index="${index}"><strong>${escapeHtml(item.title || 'Untitled project')}</strong><span>${escapeHtml(item.category || 'No category')} · ${escapeHtml(item.year || '')}</span></button>`).join('')}
        <div class="split-actions"><button class="button button--accent" type="button" data-action="add-project">Add project</button></div>
      </aside>
      <div class="panel">
        ${project ? renderProjectEditor(state.selectedProject) : '<p class="notice">Add a project to begin.</p>'}
      </div>
    </section>`;
}

function renderProjectEditor(index) {
  const images = state.content.project.projects[index].images || [];
  return `
    <h2 class="project-title">${escapeHtml(state.content.project.projects[index].title || 'Untitled project')}</h2>
    <div class="form-grid">
      ${input(`project.projects.${index}.title`, 'Title')}
      ${input(`project.projects.${index}.slug`, 'Slug')}
      ${input(`project.projects.${index}.location`, 'Location')}
      ${input(`project.projects.${index}.year`, 'Year')}
      ${input(`project.projects.${index}.category`, 'Category')}
      ${textarea(`project.projects.${index}.description`, 'Description')}
      ${textarea(`project.projects.${index}.seoDescription`, 'SEO description')}
    </div>
    <h2 style="margin-top: 28px">Images</h2>
    <div class="cards">${images.map((_, imageIndex) => imageObject(`project.projects.${index}.images.${imageIndex}`, `Image ${imageIndex + 1}`, { remove: true })).join('')}</div>
    <div class="split-actions">
      <button class="button button--ghost" type="button" data-action="add-project-image">Add image</button>
      <button class="button button--danger" type="button" data-action="remove-project">Delete project</button>
    </div>`;
}

function renderAbout() {
  const services = (state.content.about?.services || []).join('\n');
  return `
    <section class="grid">
      <div class="panel panel--half"><h2>Story</h2><div class="form-grid">
        ${input('about.heading', 'Heading')}
        ${textarea('about.bio', 'Bio')}
        ${input('about.servicesHeading', 'Services heading')}
        <label class="field field--wide"><span>Services, one per line</span><textarea class="textarea" data-services>${escapeHtml(services)}</textarea></label>
      </div></div>
      <div class="panel panel--half"><h2>Portrait</h2><div class="cards">${imageObject('about.portrait', 'Portrait')}</div></div>
      <div class="panel"><h2>SEO</h2><div class="form-grid">${input('about.seo.title', 'SEO title')}${textarea('about.seo.description', 'SEO description')}</div></div>
    </section>`;
}

function renderContact() {
  return `
    <section class="grid">
      <div class="panel panel--half"><h2>Details</h2><div class="form-grid">
        ${input('contact.heading', 'Heading')}
        ${input('contact.email', 'Email', 'email')}
        ${input('contact.phone', 'Phone')}
        ${input('contact.location', 'Location')}
      </div></div>
      <div class="panel panel--half"><h2>Form</h2><div class="form-grid">
        ${input('contact.form.namePlaceholder', 'Name placeholder')}
        ${input('contact.form.emailPlaceholder', 'Email placeholder')}
        ${input('contact.form.messagePlaceholder', 'Message placeholder')}
        ${input('contact.form.submitLabel', 'Submit label')}
        ${input('contact.form.web3formsAccessKey', 'Web3Forms key')}
        ${input('contact.form.subject', 'Subject', 'text', { wide: true })}
        ${input('contact.form.fromName', 'From name')}
        ${textarea('contact.form.thanksMessage', 'Thanks message')}
      </div></div>
      <div class="panel"><h2>SEO</h2><div class="form-grid">${input('contact.seo.title', 'SEO title')}${textarea('contact.seo.description', 'SEO description')}</div></div>
    </section>`;
}

function renderToast() {
  if (!state.toast) return;
  const node = document.createElement('div');
  node.className = `toast ${state.toast.type === 'error' ? 'toast--error' : ''}`;
  node.textContent = state.toast.message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 3600);
  state.toast = null;
}

function showToast(message, type = 'success') {
  state.toast = { message, type };
  render();
}

async function save() {
  state.saving = true;
  render();
  const files = {
    'data/site.json': state.content.site,
    'data/homepage.json': state.content.homepage,
    'data/work.json': state.content.work,
    'data/about.json': state.content.about,
    'data/contact.json': state.content.contact,
    'data/project.json': state.content.project
  };

  try {
    const result = await api(ENDPOINTS.update, {
      method: 'POST',
      body: JSON.stringify({ files, uploads: state.uploads, message: 'CMS: Update site content' })
    });
    state.uploads = [];
    state.dirty = false;
    showToast(`Saved. Commit ${result.commit.sha.slice(0, 7)} is deploying.`);
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    state.saving = false;
    render();
  }
}

async function optimizeImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  const bitmap = await createImageBitmap(file);
  const maxWidth = 1800;
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86));
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const base64 = dataUrl.replace(/^data:image\/webp;base64,/, '');
  const filename = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.webp`;
  return { path: `public/images/uploads/${filename}`, publicUrl: `/images/uploads/${filename}`, contentBase64: base64 };
}

app.addEventListener('submit', async (event) => {
  if (event.target.id !== 'login-form') return;
  event.preventDefault();
  const button = event.target.querySelector('button');
  const message = event.target.querySelector('#login-message');
  button.disabled = true;
  message.textContent = '';
  try {
    await api(ENDPOINTS.login, {
      method: 'POST',
      body: JSON.stringify({ password: event.target.password.value })
    });
    state.authenticated = true;
    await loadContent();
    render();
  } catch (error) {
    message.textContent = error.message;
  } finally {
    button.disabled = false;
  }
});

app.addEventListener('input', (event) => {
  const target = event.target;
  if (target.dataset.bind) {
    const value = target.type === 'number' ? Number(target.value) : target.value;
    setPath(state.content, target.dataset.bind, value);
    if (target.dataset.bind.endsWith('.title')) {
      const slugPath = target.dataset.bind.replace(/\.title$/, '.slug');
      if (getPath(state.content, slugPath) === '') setPath(state.content, slugPath, slugify(target.value));
    }
    state.dirty = true;
    reflectDirtyState();
  }
  if (target.dataset.imageSrc) {
    const image = ensureImageObject(target.dataset.imageSrc);
    image.src = target.value;
    delete image.srcset;
    state.dirty = true;
    reflectDirtyState();
  }
  if (target.dataset.imageAlt) {
    ensureImageObject(target.dataset.imageAlt).alt = target.value;
    state.dirty = true;
    reflectDirtyState();
  }
  if ('services' in target.dataset) {
    state.content.about.services = target.value.split('\n').map((item) => item.trim()).filter(Boolean);
    state.dirty = true;
    reflectDirtyState();
  }
});

app.addEventListener('change', async (event) => {
  const target = event.target;
  if (!target.dataset.uploadInput || !target.files?.[0]) return;
  try {
    const upload = await optimizeImage(target.files[0]);
    const image = ensureImageObject(target.dataset.uploadInput);
    image.src = upload.publicUrl;
    delete image.srcset;
    state.uploads = state.uploads.filter((item) => item.path !== upload.path).concat(upload);
    markDirty();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

app.addEventListener('click', async (event) => {
  const button = event.target.closest('button');
  if (!button) return;

  if (button.dataset.section) {
    state.section = button.dataset.section;
    render();
    return;
  }
  if (button.dataset.projectIndex) {
    state.selectedProject = Number(button.dataset.projectIndex);
    render();
    return;
  }
  if (button.dataset.uploadTrigger) {
    document.querySelector(`[data-upload-input="${button.dataset.uploadTrigger}"]`)?.click();
    return;
  }
  if (button.dataset.removeImage) {
    const keys = button.dataset.removeImage.split('.');
    const index = Number(keys.pop());
    const list = getPath(state.content, keys.join('.'));
    if (Array.isArray(list)) list.splice(index, 1);
    markDirty();
    return;
  }

  const action = button.dataset.action;
  if (action === 'logout') {
    await api(ENDPOINTS.login, { method: 'POST', body: JSON.stringify({ action: 'logout' }) });
    state.authenticated = false;
    state.content = null;
    render();
  }
  if (action === 'reload') {
    await loadContent();
    showToast('Reloaded latest GitHub content.');
  }
  if (action === 'save') save();
  if (action === 'add-hero-slide') {
    state.content.homepage.hero.slides.push({ alt: 'New hero slide', src: '' });
    markDirty();
  }
  if (action === 'add-project') {
    state.content.project.projects.push({ slug: '', title: '', location: '', year: '', category: '', description: '', images: [] });
    state.selectedProject = state.content.project.projects.length - 1;
    markDirty();
  }
  if (action === 'remove-project') {
    state.content.project.projects.splice(state.selectedProject, 1);
    state.selectedProject = Math.max(0, state.selectedProject - 1);
    markDirty();
  }
  if (action === 'add-project-image') {
    state.content.project.projects[state.selectedProject].images ??= [];
    state.content.project.projects[state.selectedProject].images.push({ alt: 'Project image', src: '' });
    markDirty();
  }
});

init();
