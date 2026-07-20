# Admin CMS Setup

The private dashboard lives at `/admin/`. It is a static admin interface backed by Netlify Functions, so the GitHub write token stays in Netlify environment variables and is never stored in the repository.

## Required Netlify Environment Variables

- `ADMIN_PASSWORD`: password used to log in to `/admin/`.
- `ADMIN_SESSION_SECRET`: random long secret used to sign the admin session cookie.
- `GITHUB_TOKEN`: fine-grained GitHub token with contents read/write access to this repository.
- `GITHUB_OWNER`: GitHub owner or organization name.
- `GITHUB_REPO`: repository name.
- `GITHUB_BRANCH`: branch to update, usually `main`.

## Save Flow

1. The client logs in at `/admin/` with `ADMIN_PASSWORD`.
2. Netlify sets an HttpOnly signed session cookie.
3. The dashboard reads the current JSON files from GitHub through `cms-content`.
4. Saves are sent to `cms-update`.
5. `cms-update` writes changed `data/*.json` files and uploaded images to GitHub in one commit.
6. Netlify detects the commit and starts a new production build.

Uploaded images are optimized in the browser as WebP files and committed under `public/images/uploads/`.
