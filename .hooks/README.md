# Git Hooks Setup

This directory contains configurations for git hooks to ensure code quality before commits.

## Pre-commit Hook

The project includes a `pre-commit` npm script that runs essential validations:

```bash
pnpm pre-commit
```

This script runs:
1. **Format check** - Ensures code is properly formatted with Prettier
2. **Linting** - Checks for ESLint violations
3. **Database types check** - Validates database types are in sync
4. **Type checking** - Ensures TypeScript compilation succeeds

## Manual Setup

To enable automatic pre-commit validation, run:

```bash
# Enable pre-commit hook (run once)
echo '#!/bin/sh
pnpm pre-commit' > .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```

## Alternative: Husky (Future Enhancement)

For a more robust git hooks setup, consider adding Husky:

```bash
pnpm add --save-dev husky
npx husky install
npx husky add .husky/pre-commit "pnpm pre-commit"
```

## Hook Bypassing

If you need to bypass the pre-commit hook (not recommended), use:

```bash
git commit --no-verify -m "commit message"
```

Only use this for emergency commits or when you understand the risks.
