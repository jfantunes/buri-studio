const JSON_PATHS = [
  'data/site.json',
  'data/homepage.json',
  'data/work.json',
  'data/about.json',
  'data/contact.json',
  'data/project.json'
];

const JSON_PATH_SET = new Set(JSON_PATHS);
const MAX_JSON_BYTES = 600 * 1024;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const GITHUB_OWNER = 'jfantunes';
const GITHUB_REPO = 'buri-studio';
const GITHUB_BRANCH = 'main';

function githubConfig() {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    throw new Error('GITHUB_TOKEN is required');
  }

  return { owner: GITHUB_OWNER, repo: GITHUB_REPO, token, branch: GITHUB_BRANCH };
}

async function githubFetch(path, options = {}) {
  const { owner, repo, token } = githubConfig();
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body}`);
  }

  return response.status === 204 ? null : response.json();
}

function encodeBranchPath(branch) {
  return branch.split('/').map(encodeURIComponent).join('/');
}

function assertJsonPath(path) {
  if (!JSON_PATH_SET.has(path)) {
    throw new Error(`Invalid JSON path: ${path}`);
  }
}

function assertUploadPath(path) {
  const clean = typeof path === 'string' ? path : '';
  const valid = /^public\/images\/uploads\/[a-z0-9][a-z0-9._/-]*\.(jpe?g|png|webp)$/i.test(clean);
  if (!valid || clean.includes('..') || clean.includes('\\\\') || clean.includes('//')) {
    throw new Error(`Invalid upload path: ${path}`);
  }
}

export async function readContentFiles() {
  const files = {};
  const { branch } = githubConfig();

  await Promise.all(
    JSON_PATHS.map(async (path) => {
      const data = await githubFetch(`/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${encodeURIComponent(branch)}`);
      const json = Buffer.from(data.content || '', data.encoding || 'base64').toString('utf8');
      files[path] = JSON.parse(json);
    })
  );

  return {
    site: files['data/site.json'],
    homepage: files['data/homepage.json'],
    work: files['data/work.json'],
    about: files['data/about.json'],
    contact: files['data/contact.json'],
    project: files['data/project.json']
  };
}

export async function commitContentUpdate({ files, uploads = [], message }) {
  const { branch } = githubConfig();
  const tree = [];

  for (const [path, value] of Object.entries(files || {})) {
    assertJsonPath(path);
    const content = `${JSON.stringify(value, null, 2)}\n`;
    if (Buffer.byteLength(content, 'utf8') > MAX_JSON_BYTES) {
      throw new Error(`${path} is too large`);
    }
    tree.push({ path, mode: '100644', type: 'blob', content });
  }

  for (const upload of uploads) {
    assertUploadPath(upload.path);
    const content = String(upload.contentBase64 || '').replace(/^data:image\/[a-z0-9.+-]+;base64,/i, '');
    const bytes = Buffer.byteLength(content, 'base64');
    if (!content || bytes > MAX_IMAGE_BYTES) {
      throw new Error(`${upload.path} is empty or larger than 5 MB`);
    }

    const blob = await githubFetch('/git/blobs', {
      method: 'POST',
      body: JSON.stringify({ content, encoding: 'base64' })
    });
    tree.push({ path: upload.path, mode: '100644', type: 'blob', sha: blob.sha });
  }

  if (tree.length === 0) {
    throw new Error('No files were provided');
  }

  const branchPath = encodeBranchPath(branch);
  const ref = await githubFetch(`/git/ref/heads/${branchPath}`);
  const parent = await githubFetch(`/git/commits/${ref.object.sha}`);
  const newTree = await githubFetch('/git/trees', {
    method: 'POST',
    body: JSON.stringify({ base_tree: parent.tree.sha, tree })
  });
  const commit = await githubFetch('/git/commits', {
    method: 'POST',
    body: JSON.stringify({
      message: message || 'CMS: Update site content',
      tree: newTree.sha,
      parents: [ref.object.sha]
    })
  });

  await githubFetch(`/git/refs/heads/${branchPath}`, {
    method: 'PATCH',
    body: JSON.stringify({ sha: commit.sha, force: false })
  });

  return { sha: commit.sha, url: commit.html_url };
}
