import { json, requireAdmin } from './_admin-auth.js';

function deployUrl(siteId, deployId) {
  return `https://app.netlify.com/sites/${siteId}/deploys/${deployId}`;
}

function normalizeDeploy(deploy, siteId) {
  if (!deploy) return null;
  return {
    id: deploy.id,
    state: deploy.state,
    commitRef: deploy.commit_ref,
    title: deploy.title,
    errorMessage: deploy.error_message || deploy.summary?.messages?.[0]?.message || '',
    publishedUrl: deploy.ssl_url || deploy.deploy_ssl_url || deploy.url || '',
    adminUrl: deploy.admin_url || deployUrl(siteId, deploy.id),
    createdAt: deploy.created_at,
    updatedAt: deploy.updated_at
  };
}

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const unauthorized = requireAdmin(event);
  if (unauthorized) return unauthorized;

  const token = process.env.NETLIFY_AUTH_TOKEN;
  const siteId = process.env.NETLIFY_SITE_ID;
  const commit = event.queryStringParameters?.commit;

  if (!token || !siteId) {
    return json(200, { configured: false, deploy: null });
  }

  try {
    const params = new URLSearchParams({ per_page: '20' });
    const response = await fetch(`https://api.netlify.com/api/v1/sites/${siteId}/deploys?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Netlify API ${response.status}: ${body}`);
    }

    const deploys = await response.json();
    const deploy = commit ? deploys.find((item) => item.commit_ref === commit) : deploys[0];
    return json(200, { configured: true, deploy: normalizeDeploy(deploy, siteId) });
  } catch (error) {
    return json(500, { error: error.message });
  }
}
