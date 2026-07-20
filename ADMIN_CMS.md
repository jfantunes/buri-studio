# Admin CMS Setup

The private dashboard lives at `/admin/`. It is a separate React app in the same Vite build, backed by Netlify Functions, so the GitHub write token stays in Netlify environment variables and is never stored in the repository.

## Required Netlify Environment Variables

- `ADMIN_PASSWORD`: password used to log in to `/admin/`.
- `ADMIN_SESSION_SECRET`: random long secret used to sign the admin session cookie.
- `GITHUB_TOKEN`: fine-grained GitHub token with contents read/write access to this repository.

The repository target is public information and is hardcoded in `netlify/functions/_github.js` as `jfantunes/buri-studio` on `main`. Do not add `GITHUB_OWNER`, `GITHUB_REPO`, or `GITHUB_BRANCH` as Netlify environment variables; Netlify may treat those public values as exposed secrets during deploy scanning.

## Optional Deploy Monitoring

To show a warning in `/admin/` when a save commits successfully but the Netlify deploy fails, add:

- `NETLIFY_SITE_ID`: Netlify site ID.
- `NETLIFY_AUTH_TOKEN`: Netlify personal access token with access to this site.

Without these variables, saving still works, but the dashboard will show that deploy monitoring is not configured.

## Save Flow

1. The client logs in at `/admin/` with `ADMIN_PASSWORD`.
2. Netlify sets an HttpOnly signed session cookie.
3. The dashboard reads the current JSON files from GitHub through `cms-content`.
4. Saves are sent to `cms-update`.
5. `cms-update` writes changed `data/*.json` files and uploaded images to GitHub in one commit.
6. Netlify detects the commit and starts a new production build.
7. If deploy monitoring is configured, the dashboard polls Netlify and warns when the deploy fails.

Uploaded images are optimized in the browser as a single 2K or 4K WebP source and committed under `public/images/uploads/`. The CMS rejects images under 2560px wide or over 6 MB. During the build, `scripts/generate-responsive-images.mjs` creates smaller responsive WebP variants under `public/images/generated/` for mobile, desktop, 2K, and 4K screens.
