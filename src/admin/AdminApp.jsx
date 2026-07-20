import { startTransition, useEffect, useRef, useState } from 'react';

const ENDPOINTS = {
  login: '/.netlify/functions/admin-login',
  content: '/.netlify/functions/cms-content',
  update: '/.netlify/functions/cms-update',
  deploy: '/.netlify/functions/cms-deploy-status'
};

const DEPLOY_FINAL_STATES = new Set(['ready', 'error']);
const RESPONSIVE_WIDTHS = [480, 800, 1200, 1600, 2560, 3840];
const FALLBACK_IMAGE_WIDTH = 1600;

const NAV = [
  ['dashboard', 'Overview'],
  ['site', 'Site'],
  ['home', 'Home'],
  ['work', 'Work'],
  ['projects', 'Projects'],
  ['about', 'About'],
  ['contact', 'Contact']
];

const SECTION_TITLES = {
  dashboard: ['Overview', 'Content health, pending media, and deploy state.'],
  site: ['Site settings', 'Identity, defaults, analytics, and social links.'],
  home: ['Homepage', 'Hero slideshow and introduction copy.'],
  work: ['Work page', 'Project listing page copy and search metadata.'],
  projects: ['Projects', 'Edit project details and responsive image sets.'],
  about: ['About', 'Studio story, services, portrait, and metadata.'],
  contact: ['Contact', 'Contact details and form labels.']
};

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'untitled';
}

function clone(value) {
  return typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
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

function ensureImageObject(root, path) {
  const current = getPath(root, path);
  if (!current || typeof current === 'string') {
    setPath(root, path, { src: current || '', alt: '' });
  }
  return getPath(root, path);
}

function getResponsiveWidths(srcset = {}) {
  const existingWidths = Object.keys(srcset).map(Number).filter(Number.isFinite);
  return [...new Set(RESPONSIVE_WIDTHS.concat(existingWidths))].sort((a, b) => a - b);
}

function setImageSrcsetValue(image, width, value) {
  image.srcset ??= {};
  if (value) {
    image.srcset[width] = value;
  } else {
    delete image.srcset[width];
    if (Object.keys(image.srcset).length === 0) delete image.srcset;
  }
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

function imageVariantWidths(sourceWidth) {
  const widths = RESPONSIVE_WIDTHS.filter((width) => width <= sourceWidth);
  if (!widths.includes(sourceWidth) && sourceWidth < RESPONSIVE_WIDTHS.at(-1)) widths.push(sourceWidth);
  return [...new Set(widths.length ? widths : [sourceWidth])].sort((a, b) => a - b);
}

function fallbackImageUrl(variants) {
  return variants.find((variant) => variant.width === FALLBACK_IMAGE_WIDTH)?.publicUrl || variants.at(-1)?.publicUrl || '';
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).replace(/^data:image\/webp;base64,/, ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function createImageVariant(bitmap, width, baseName) {
  const scale = Math.min(1, width / bitmap.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.84));
  if (!blob) throw new Error('Could not optimize this image.');
  const filename = `${baseName}-${canvas.width}.webp`;
  return {
    width: canvas.width,
    path: `public/images/uploads/${filename}`,
    publicUrl: `/images/uploads/${filename}`,
    contentBase64: await blobToBase64(blob)
  };
}

async function optimizeImage(file) {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  const bitmap = await createImageBitmap(file);
  const baseName = `${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}`;
  const variants = await Promise.all(imageVariantWidths(bitmap.width).map((width) => createImageVariant(bitmap, width, baseName)));
  bitmap.close?.();
  return {
    uploads: variants.map(({ path, contentBase64 }) => ({ path, contentBase64 })),
    publicUrl: fallbackImageUrl(variants),
    srcset: Object.fromEntries(variants.map((variant) => [String(variant.width), variant.publicUrl]))
  };
}

function deployLabel(stateName) {
  return {
    waiting: 'Waiting for Netlify',
    unconfigured: 'Deploy monitoring off',
    ready: 'Published',
    error: 'Deploy failed',
    building: 'Building',
    processing: 'Processing',
    enqueued: 'Queued',
    new: 'Queued',
    uploading: 'Uploading'
  }[stateName] || 'Checking deploy';
}

function deployMessage(deploy) {
  if (!deploy) return '';
  if (deploy.state === 'ready') return 'The latest CMS save is live in production.';
  if (deploy.state === 'error') return deploy.errorMessage || 'Content was saved, but the production deploy failed.';
  if (deploy.state === 'unconfigured') return 'Content was saved, but Netlify deploy monitoring is not configured yet.';
  if (deploy.state === 'waiting') return 'Content was saved to GitHub. Waiting for Netlify to start the deploy.';
  return 'Netlify is building the saved content now.';
}

function Field({ path, label, type = 'text', value, onChange, wide = false, placeholder }) {
  return (
    <label className={`field${wide ? ' field--wide' : ''}`}>
      <span>{label}</span>
      <input className="control" type={type} value={value ?? ''} placeholder={placeholder} onChange={(event) => onChange(path, type === 'number' ? Number(event.target.value) : event.target.value)} />
    </label>
  );
}

function TextArea({ path, label, value, onChange, rows }) {
  return (
    <label className="field field--wide">
      <span>{label}</span>
      <textarea className="textarea" rows={rows} value={value ?? ''} onChange={(event) => onChange(path, event.target.value)} />
    </label>
  );
}

function ImageField({ image, label, path, removable, onAlt, onSrc, onSrcset, onUpload, onRemove, onClear }) {
  const imageObject = typeof image === 'string' ? { src: image, alt: '', srcset: {} } : image || {};
  const srcset = imageObject.srcset || {};
  const responsiveWidths = getResponsiveWidths(srcset);

  async function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) await onUpload(path, file);
  }

  return (
    <article className="image-card">
      <div className="image-card__preview">{imageObject.src ? <img src={imageObject.src} alt="" /> : <span>No image</span>}</div>
      <div className="image-card__body">
        <div className="image-card__topline">
          <Field path={path} label={`${label} alt text`} value={imageObject.alt || ''} onChange={onAlt} />
          <Field path={path} label="Fallback image URL" value={imageObject.src || ''} placeholder="/images/uploads/example-1600.webp" onChange={onSrc} />
        </div>
        <div className="srcset-grid">
          {responsiveWidths.map((width) => (
            <label className="field" key={width}>
              <span>{width}w URL</span>
              <input className="control" value={srcset[width] || ''} placeholder={`/images/uploads/example-${width}.webp`} onChange={(event) => onSrcset(path, String(width), event.target.value)} />
            </label>
          ))}
        </div>
        <div className="image-card__actions">
          <label className="button button--ghost button--file">
            Upload responsive image
            <input className="hidden-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
          </label>
          {removable ? (
            <button className="button button--danger" type="button" onClick={() => onRemove(path)}>Remove image</button>
          ) : (
            <button className="button button--danger" type="button" onClick={() => onClear(path)}>Clear image</button>
          )}
        </div>
      </div>
    </article>
  );
}

function Toast({ toast, onClear }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onClear, 3600);
    return () => clearTimeout(timer);
  }, [toast, onClear]);

  if (!toast) return null;
  return <div className={`toast${toast.type === 'error' ? ' toast--error' : ''}`}>{toast.message}</div>;
}

function Login({ onLogin }) {
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api(ENDPOINTS.login, { method: 'POST', body: JSON.stringify({ password }) });
      await onLogin();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login">
      <section className="login__card">
        <p className="eyebrow">Private dashboard</p>
        <h1>Buri Studio CMS</h1>
        <p className="login__copy">Manage live content and media. Changes are committed to GitHub and published through Netlify.</p>
        <form className="login__form" onSubmit={submit}>
          <label className="field">
            <span>Password</span>
            <input className="control" value={password} type="password" autoComplete="current-password" required autoFocus onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button className="button button--accent" type="submit" disabled={submitting}>{submitting ? 'Entering...' : 'Enter dashboard'}</button>
          <p className="message">{message}</p>
        </form>
      </section>
    </main>
  );
}

function Sidebar({ section, dirty, saving, onSection, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <strong>Buri CMS</strong>
        <span>Content and media ops</span>
      </div>
      <nav className="nav" aria-label="Admin sections">
        {NAV.map(([key, label]) => (
          <button className={section === key ? 'is-active' : ''} type="button" key={key} onClick={() => onSection(key)}>
            <span>{label}</span>
            <span className="nav__dot" />
          </button>
        ))}
      </nav>
      <div className="sidebar__footer">
        <div className={`status${dirty ? ' is-dirty' : ''}`}>{dirty ? 'Unsaved edits' : 'Synced with GitHub'}</div>
        <button className="button button--ghost" type="button" disabled={saving} onClick={onLogout}>Log out</button>
      </div>
    </aside>
  );
}

function DeployCard({ deploy }) {
  if (!deploy) return null;
  const className = `deploy-card ${deploy.state === 'error' ? 'deploy-card--error' : ''} ${deploy.state === 'ready' ? 'deploy-card--ready' : ''}`;
  return (
    <section className={className} aria-live="polite">
      <div>
        <span className="deploy-card__label">{deployLabel(deploy.state)}</span>
        <p>{deployMessage(deploy)}</p>
      </div>
      <div className="deploy-card__meta">
        {deploy.commitSha ? <code>{deploy.commitSha.slice(0, 7)}</code> : null}
        {deploy.adminUrl ? <a href={deploy.adminUrl} target="_blank" rel="noreferrer">Open deploy</a> : null}
      </div>
    </section>
  );
}

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [content, setContent] = useState(null);
  const [section, setSection] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(0);
  const [uploads, setUploads] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deploy, setDeploy] = useState(null);
  const [toast, setToast] = useState(null);
  const deployPollTimer = useRef(null);

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const session = await api(ENDPOINTS.login);
        if (!active) return;
        setAuthenticated(session.authenticated);
        if (session.authenticated) {
          const result = await api(ENDPOINTS.content);
          if (!active) return;
          applyContent(result.content);
        }
      } catch {
        if (active) setAuthenticated(false);
      } finally {
        if (active) setLoading(false);
      }
    }
    init();
    return () => {
      active = false;
      clearTimeout(deployPollTimer.current);
    };
  }, []);

  function applyContent(nextContent) {
    setContent(nextContent);
    setUploads([]);
    setDirty(false);
    setSelectedProject(0);
  }

  async function loadContent() {
    const result = await api(ENDPOINTS.content);
    applyContent(result.content);
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
  }

  function updateContent(mutator) {
    setContent((current) => {
      const next = clone(current);
      mutator(next);
      return next;
    });
    setDirty(true);
  }

  function updatePath(path, value) {
    updateContent((next) => {
      setPath(next, path, value);
      if (path.endsWith('.title')) {
        const slugPath = path.replace(/\.title$/, '.slug');
        if (getPath(next, slugPath) === '') setPath(next, slugPath, slugify(value));
      }
    });
  }

  function updateImageAlt(path, value) {
    updateContent((next) => {
      ensureImageObject(next, path).alt = value;
    });
  }

  function updateImageSrc(path, value) {
    updateContent((next) => {
      ensureImageObject(next, path).src = value;
    });
  }

  function updateImageSrcset(path, width, value) {
    updateContent((next) => {
      setImageSrcsetValue(ensureImageObject(next, path), width, value);
    });
  }

  async function uploadImage(path, file) {
    try {
      const upload = await optimizeImage(file);
      updateContent((next) => {
        const image = ensureImageObject(next, path);
        image.src = upload.publicUrl;
        image.srcset = upload.srcset;
      });
      const uploadPaths = new Set(upload.uploads.map((item) => item.path));
      setUploads((current) => current.filter((item) => !uploadPaths.has(item.path)).concat(upload.uploads));
      showToast('Responsive image variants are ready to save.');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  function removeImage(path) {
    updateContent((next) => {
      const keys = path.split('.');
      const index = Number(keys.pop());
      const list = getPath(next, keys.join('.'));
      if (Array.isArray(list)) list.splice(index, 1);
    });
  }

  function addProject() {
    const nextIndex = content.project.projects.length;
    updateContent((next) => {
      next.project.projects.push({ slug: '', title: '', location: '', year: '', category: '', description: '', images: [] });
    });
    setSelectedProject(nextIndex);
  }

  function removeProject() {
    updateContent((next) => {
      next.project.projects.splice(selectedProject, 1);
    });
    setSelectedProject(Math.max(0, selectedProject - 1));
  }

  function addProjectImage() {
    updateContent((next) => {
      next.project.projects[selectedProject].images ??= [];
      next.project.projects[selectedProject].images.push({ alt: 'Project image', src: '' });
    });
  }

  function clearImage(path) {
    updateContent((next) => {
      const image = ensureImageObject(next, path);
      image.src = '';
      delete image.srcset;
    });
  }

  async function pollDeploy(commitSha, attempt = 0) {
    clearTimeout(deployPollTimer.current);
    try {
      const result = await api(`${ENDPOINTS.deploy}?commit=${encodeURIComponent(commitSha)}`);
      if (!result.configured) {
        setDeploy({ state: 'unconfigured', commitSha });
        return;
      }
      if (result.deploy) {
        setDeploy({ ...result.deploy, commitSha });
        if (DEPLOY_FINAL_STATES.has(result.deploy.state)) return;
      } else {
        setDeploy({ state: 'waiting', commitSha });
      }
    } catch (error) {
      setDeploy({ state: 'error', commitSha, errorMessage: error.message });
      return;
    }
    if (attempt < 30) deployPollTimer.current = setTimeout(() => pollDeploy(commitSha, attempt + 1), 5000);
  }

  function startDeployPolling(commitSha) {
    setDeploy({ state: 'waiting', commitSha });
    pollDeploy(commitSha);
  }

  async function save() {
    setSaving(true);
    const files = {
      'data/site.json': content.site,
      'data/homepage.json': content.homepage,
      'data/work.json': content.work,
      'data/about.json': content.about,
      'data/contact.json': content.contact,
      'data/project.json': content.project
    };
    try {
      const result = await api(ENDPOINTS.update, {
        method: 'POST',
        body: JSON.stringify({ files, uploads, message: 'CMS: Update site content' })
      });
      setUploads([]);
      setDirty(false);
      showToast(`Saved. Commit ${result.commit.sha.slice(0, 7)} is deploying.`);
      startDeployPolling(result.commit.sha);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function reload() {
    await loadContent();
    showToast('Reloaded latest GitHub content.');
  }

  async function logout() {
    await api(ENDPOINTS.login, { method: 'POST', body: JSON.stringify({ action: 'logout' }) });
    setAuthenticated(false);
    setContent(null);
  }

  function selectSection(key) {
    startTransition(() => setSection(key));
  }

  function selectProject(index) {
    startTransition(() => setSelectedProject(index));
  }

  if (loading) return <Boot />;
  if (!authenticated) return <Login onLogin={async () => { setAuthenticated(true); await loadContent(); }} />;
  if (!content) return <div className="notice">Content could not be loaded.</div>;

  const [title, copy] = SECTION_TITLES[section];
  const imageHandlers = { onAlt: updateImageAlt, onSrc: updateImageSrc, onSrcset: updateImageSrcset, onUpload: uploadImage, onRemove: removeImage, onClear: clearImage };

  return (
    <div className="admin">
      <Sidebar section={section} dirty={dirty} saving={saving} onSection={selectSection} onLogout={logout} />
      <main className="main">
        <header className="topbar">
          <div className="section-title">
            <p className="eyebrow">Buri Studio</p>
            <h1>{title}</h1>
            <p>{copy}</p>
          </div>
          <div className="actions">
            <button className="button button--ghost" type="button" onClick={reload}>Reload</button>
            <button className="button button--accent" type="button" disabled={saving} onClick={save}>{saving ? 'Saving...' : 'Save & deploy'}</button>
          </div>
        </header>
        <DeployCard deploy={deploy} />
        <Section
          section={section}
          content={content}
          selectedProject={selectedProject}
          uploads={uploads}
          onChange={updatePath}
          onServices={(value) => updateContent((next) => { next.about.services = value.split('\n').map((item) => item.trim()).filter(Boolean); })}
          onSelectProject={selectProject}
          onAddHero={() => updateContent((next) => { next.homepage.hero.slides.push({ alt: 'New hero slide', src: '' }); })}
          onAddProject={addProject}
          onRemoveProject={removeProject}
          onAddProjectImage={addProjectImage}
          imageHandlers={imageHandlers}
        />
      </main>
      <Toast toast={toast} onClear={() => setToast(null)} />
    </div>
  );
}

function Boot() {
  return (
    <section className="boot" aria-label="Loading admin">
      <span className="boot__mark" />
      <p>Opening studio dashboard...</p>
    </section>
  );
}

function Section(props) {
  if (props.section === 'dashboard') return <Dashboard {...props} />;
  if (props.section === 'site') return <SiteSection {...props} />;
  if (props.section === 'home') return <HomeSection {...props} />;
  if (props.section === 'work') return <WorkSection {...props} />;
  if (props.section === 'projects') return <ProjectsSection {...props} />;
  if (props.section === 'about') return <AboutSection {...props} />;
  return <ContactSection {...props} />;
}

function Dashboard({ content, uploads }) {
  const projects = content.project?.projects || [];
  const heroSlides = content.homepage?.hero?.slides || [];
  return (
    <section className="grid">
      <div className="panel panel--full metrics">
        <div className="metric"><span>Projects</span><strong>{projects.length}</strong></div>
        <div className="metric"><span>Hero slides</span><strong>{heroSlides.length}</strong></div>
        <div className="metric"><span>Pending files</span><strong>{uploads.length}</strong></div>
      </div>
      <div className="panel panel--half"><h2>Save flow</h2><p className="notice">Saves send JSON and optimized media to Netlify Functions, commit to GitHub, then trigger a production build.</p></div>
      <div className="panel panel--half"><h2>Image handling</h2><p className="notice">Uploads generate responsive WebP files for mobile, desktop, 2K, and 4K screens under <code>public/images/uploads/</code>.</p></div>
    </section>
  );
}

function SiteSection({ content, onChange }) {
  return (
    <section className="grid">
      <div className="panel panel--half"><h2>Identity</h2><div className="form-grid">
        <Field path="site.name" label="Studio name" value={getPath(content, 'site.name')} onChange={onChange} />
        <Field path="site.tagline" label="Tagline" value={getPath(content, 'site.tagline')} onChange={onChange} />
        <Field path="site.logo" label="Logo URL" value={getPath(content, 'site.logo')} onChange={onChange} wide />
        <Field path="site.instagram" label="Instagram handle" value={getPath(content, 'site.instagram')} onChange={onChange} />
        <Field path="site.instagramUrl" label="Instagram URL" value={getPath(content, 'site.instagramUrl')} onChange={onChange} />
      </div></div>
      <div className="panel panel--half"><h2>SEO and analytics</h2><div className="form-grid">
        <Field path="site.seo.siteUrl" label="Site URL" value={getPath(content, 'site.seo.siteUrl')} onChange={onChange} />
        <Field path="site.seo.titleTemplate" label="Title template" value={getPath(content, 'site.seo.titleTemplate')} onChange={onChange} />
        <Field path="site.seo.defaultTitle" label="Default title" value={getPath(content, 'site.seo.defaultTitle')} onChange={onChange} wide />
        <TextArea path="site.seo.defaultDescription" label="Default description" value={getPath(content, 'site.seo.defaultDescription')} onChange={onChange} />
        <Field path="site.seo.ogImage" label="Default OG image" value={getPath(content, 'site.seo.ogImage')} onChange={onChange} wide />
        <Field path="site.analytics.gaMeasurementId" label="GA Measurement ID" value={getPath(content, 'site.analytics.gaMeasurementId')} onChange={onChange} />
      </div></div>
    </section>
  );
}

function HomeSection({ content, onChange, onAddHero, imageHandlers }) {
  const slides = content.homepage?.hero?.slides || [];
  return (
    <section className="grid">
      <div className="panel panel--full"><h2>Copy</h2><div className="form-grid">
        <TextArea path="homepage.intro" label="Intro" value={getPath(content, 'homepage.intro')} onChange={onChange} />
        <TextArea path="homepage.seo.description" label="SEO description" value={getPath(content, 'homepage.seo.description')} onChange={onChange} />
        <Field path="homepage.hero.intervalMs" label="Hero interval (ms)" type="number" value={getPath(content, 'homepage.hero.intervalMs')} onChange={onChange} />
      </div></div>
      <div className="panel panel--full"><PanelHeader title="Hero slides" action="Add slide" onAction={onAddHero} /><div className="cards">
        {slides.map((slide, index) => <ImageField key={index} image={slide} path={`homepage.hero.slides.${index}`} label={`Slide ${index + 1}`} removable {...imageHandlers} />)}
      </div></div>
    </section>
  );
}

function WorkSection({ content, onChange }) {
  return (
    <section className="grid">
      <div className="panel panel--full"><h2>Work listing</h2><div className="form-grid">
        <Field path="work.heading" label="Heading" value={getPath(content, 'work.heading')} onChange={onChange} />
        <Field path="work.seo.title" label="SEO title" value={getPath(content, 'work.seo.title')} onChange={onChange} />
        <TextArea path="work.seo.description" label="SEO description" value={getPath(content, 'work.seo.description')} onChange={onChange} />
      </div></div>
    </section>
  );
}

function ProjectsSection({ content, selectedProject, onSelectProject, onChange, onAddProject, onRemoveProject, onAddProjectImage, imageHandlers }) {
  const projects = content.project?.projects || [];
  const project = projects[selectedProject];
  return (
    <section className="project-layout">
      <aside className="project-list">
        {projects.map((item, index) => (
          <button className={`project-list__item${index === selectedProject ? ' is-active' : ''}`} type="button" key={item.slug || index} onClick={() => onSelectProject(index)}>
            <strong>{item.title || 'Untitled project'}</strong>
            <span>{item.category || 'No category'} / {item.year || ''}</span>
          </button>
        ))}
        <button className="button button--accent button--wide" type="button" onClick={onAddProject}>Add project</button>
      </aside>
      <div className="panel">{project ? <ProjectEditor project={project} index={selectedProject} onChange={onChange} onRemoveProject={onRemoveProject} onAddProjectImage={onAddProjectImage} imageHandlers={imageHandlers} /> : <p className="notice">Add a project to begin.</p>}</div>
    </section>
  );
}

function ProjectEditor({ project, index, onChange, onRemoveProject, onAddProjectImage, imageHandlers }) {
  const images = project.images || [];
  return (
    <>
      <h2 className="project-title">{project.title || 'Untitled project'}</h2>
      <div className="form-grid">
        <Field path={`project.projects.${index}.title`} label="Title" value={project.title} onChange={onChange} />
        <Field path={`project.projects.${index}.slug`} label="Slug" value={project.slug} onChange={onChange} />
        <Field path={`project.projects.${index}.location`} label="Location" value={project.location} onChange={onChange} />
        <Field path={`project.projects.${index}.year`} label="Year" value={project.year} onChange={onChange} />
        <Field path={`project.projects.${index}.category`} label="Category" value={project.category} onChange={onChange} />
        <TextArea path={`project.projects.${index}.description`} label="Description" value={project.description} onChange={onChange} />
        <TextArea path={`project.projects.${index}.seoDescription`} label="SEO description" value={project.seoDescription} onChange={onChange} />
      </div>
      <PanelHeader title="Images" action="Add image" onAction={onAddProjectImage} />
      <div className="cards">{images.map((image, imageIndex) => <ImageField key={imageIndex} image={image} path={`project.projects.${index}.images.${imageIndex}`} label={`Image ${imageIndex + 1}`} removable {...imageHandlers} />)}</div>
      <div className="panel-actions"><button className="button button--danger" type="button" onClick={onRemoveProject}>Delete project</button></div>
    </>
  );
}

function AboutSection({ content, onChange, onServices, imageHandlers }) {
  return (
    <section className="grid">
      <div className="panel panel--half"><h2>Story</h2><div className="form-grid">
        <Field path="about.heading" label="Heading" value={getPath(content, 'about.heading')} onChange={onChange} />
        <TextArea path="about.bio" label="Bio" value={getPath(content, 'about.bio')} onChange={onChange} />
        <Field path="about.servicesHeading" label="Services heading" value={getPath(content, 'about.servicesHeading')} onChange={onChange} />
        <label className="field field--wide"><span>Services, one per line</span><textarea className="textarea" value={(content.about?.services || []).join('\n')} onChange={(event) => onServices(event.target.value)} /></label>
      </div></div>
      <div className="panel panel--half"><h2>Portrait</h2><div className="cards"><ImageField image={content.about?.portrait} path="about.portrait" label="Portrait" {...imageHandlers} /></div></div>
      <div className="panel panel--full"><h2>SEO</h2><div className="form-grid"><Field path="about.seo.title" label="SEO title" value={getPath(content, 'about.seo.title')} onChange={onChange} /><TextArea path="about.seo.description" label="SEO description" value={getPath(content, 'about.seo.description')} onChange={onChange} /></div></div>
    </section>
  );
}

function ContactSection({ content, onChange }) {
  return (
    <section className="grid">
      <div className="panel panel--half"><h2>Details</h2><div className="form-grid">
        <Field path="contact.heading" label="Heading" value={getPath(content, 'contact.heading')} onChange={onChange} />
        <Field path="contact.email" label="Email" type="email" value={getPath(content, 'contact.email')} onChange={onChange} />
        <Field path="contact.phone" label="Phone" value={getPath(content, 'contact.phone')} onChange={onChange} />
        <Field path="contact.location" label="Location" value={getPath(content, 'contact.location')} onChange={onChange} />
      </div></div>
      <div className="panel panel--half"><h2>Form</h2><div className="form-grid">
        <Field path="contact.form.namePlaceholder" label="Name placeholder" value={getPath(content, 'contact.form.namePlaceholder')} onChange={onChange} />
        <Field path="contact.form.emailPlaceholder" label="Email placeholder" value={getPath(content, 'contact.form.emailPlaceholder')} onChange={onChange} />
        <Field path="contact.form.messagePlaceholder" label="Message placeholder" value={getPath(content, 'contact.form.messagePlaceholder')} onChange={onChange} />
        <Field path="contact.form.submitLabel" label="Submit label" value={getPath(content, 'contact.form.submitLabel')} onChange={onChange} />
        <Field path="contact.form.web3formsAccessKey" label="Web3Forms key" value={getPath(content, 'contact.form.web3formsAccessKey')} onChange={onChange} />
        <Field path="contact.form.subject" label="Subject" value={getPath(content, 'contact.form.subject')} onChange={onChange} wide />
        <Field path="contact.form.fromName" label="From name" value={getPath(content, 'contact.form.fromName')} onChange={onChange} />
        <TextArea path="contact.form.thanksMessage" label="Thanks message" value={getPath(content, 'contact.form.thanksMessage')} onChange={onChange} />
      </div></div>
      <div className="panel panel--full"><h2>SEO</h2><div className="form-grid"><Field path="contact.seo.title" label="SEO title" value={getPath(content, 'contact.seo.title')} onChange={onChange} /><TextArea path="contact.seo.description" label="SEO description" value={getPath(content, 'contact.seo.description')} onChange={onChange} /></div></div>
    </section>
  );
}

function PanelHeader({ title, action, onAction }) {
  return (
    <div className="panel-header">
      <h2>{title}</h2>
      <button className="button button--ghost" type="button" onClick={onAction}>{action}</button>
    </div>
  );
}
