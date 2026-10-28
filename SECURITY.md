# Security Notes

## 1. Leaked secrets in git history (action required)

Earlier commits of this repository (see the audit report, finding C1) exposed
real environment values in the git history:

- `JWT_SECRET` (the old hard-coded fallback `supersecretkey` and a committed value)
- `MONGO_URI` (a real database connection string)

Even though the current code no longer contains them, **anyone can recover them
from history**. Because the code fix alone cannot un-leak a secret:

1. **Rotate the JWT secret now.** Generate a strong one:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
   Put it in `server/.env` as `JWT_SECRET=...`. Restarting the API invalidates
   every existing token (users simply log in again).
2. **Rotate the MongoDB credentials.** Change the database user's password in
   MongoDB Atlas / your host and update `MONGO_URI` in `server/.env`.
3. **Restrict network access** to the database (Atlas IP allowlist) as defense
   in depth.
4. Optionally, rewrite history to purge the secrets
   (`git filter-repo --path server/.env --invert-paths`) and force-push. All
   clones would need to re-clone afterwards.

## 2. GitHub personal access tokens

If a PAT is ever pasted into chat, an issue, or a script, revoke it at
GitHub -> Settings -> Developer settings -> Personal access tokens and issue a
new one. Prefer fine-grained tokens scoped to this repository only.

## 3. Configuration rules enforced by the code

- `server/config/env.js` refuses to boot in production without `JWT_SECRET`
  and `MONGO_URI` (no insecure fallbacks anywhere).
- Development boots use a random per-boot JWT secret, so a forgotten
  `.env` can never silently reintroduce a forgeable secret.
- `server/.env` and `client/.env` are git-ignored; `.env.example` files
  document the required variables.
- Runtime uploads (`server/uploads/`) are no longer tracked in git.

## 4. Upload hardening

Media and practice-photo uploads (audit finding C7) accept images only,
cap at 10 MB, and store every file under a server-generated UUID filename -
client-supplied filenames never reach the filesystem path.
