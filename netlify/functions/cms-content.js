import { json, requireAdmin } from './_admin-auth.js';
import { readContentFiles } from './_github.js';

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' });
  }

  const unauthorized = requireAdmin(event);
  if (unauthorized) return unauthorized;

  try {
    const content = await readContentFiles();
    return json(200, { content });
  } catch (error) {
    return json(500, { error: error.message });
  }
}
