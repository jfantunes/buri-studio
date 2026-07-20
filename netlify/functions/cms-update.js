import { json, requireAdmin } from './_admin-auth.js';
import { commitContentUpdate } from './_github.js';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const unauthorized = requireAdmin(event);
  if (unauthorized) return unauthorized;

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  try {
    const commit = await commitContentUpdate({
      files: body.files,
      uploads: body.uploads,
      message: body.message
    });
    return json(200, { message: 'Content updated', commit });
  } catch (error) {
    return json(500, { error: error.message });
  }
}
