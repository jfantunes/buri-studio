import { clearSessionCookie, createSessionCookie, isAuthenticated, json } from './_admin-auth.js';

export async function handler(event) {
  if (event.httpMethod === 'GET') {
    return json(200, { authenticated: isAuthenticated(event) });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  if (body.action === 'logout') {
    return json(200, { authenticated: false }, { 'Set-Cookie': clearSessionCookie() });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return json(500, { error: 'ADMIN_PASSWORD is not configured' });
  }

  if (body.password !== process.env.ADMIN_PASSWORD) {
    return json(401, { error: 'Invalid password' });
  }

  return json(200, { authenticated: true }, { 'Set-Cookie': createSessionCookie() });
}
