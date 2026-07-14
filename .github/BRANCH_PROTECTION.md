# Branch Protection Rules — Wavio

Configure these rules in **Settings → Branches → Add rule** on GitHub.

## `main` branch (production)

- Require pull request before merging
  - Required approvals: 1
  - Dismiss stale reviews on new pushes
  - Require review from Code Owners
- Require status checks to pass:
  - Typecheck — Backend
  - Typecheck — Frontend
  - Lint — Backend
  - Lint — Frontend
  - Format Check
  - Build — Backend
  - Build — Frontend
  - Prisma Validate
  - Security Audit
  - Security — CodeQL
  - Docker Build — Backend
- Require branches to be up to date before merging
- Require conversation resolution before merging
- Require linear history (squash merge)
- Include administrators
- Restrict who can push to matching branches

## `dev` branch (staging)

- Require pull request before merging
  - Required approvals: 1
- Require status checks to pass (same as main)
- Allow force pushes (for rebasing during development)
