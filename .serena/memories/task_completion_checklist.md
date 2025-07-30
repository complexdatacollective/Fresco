# Task Completion Checklist

When completing any coding task, always run these commands in order:

## 1. Type Checking
```bash
pnpm typecheck
# or
pnpm ts-lint
```
- Ensure all TypeScript types are correct
- Fix any type errors before proceeding

## 2. Code Quality Checks
```bash
pnpm lint --fix
```
- Automatically fix linting errors with `--fix` flag
- ESLint will catch TypeScript, import, and code style issues
- Fix any remaining issues manually

## 3. Code Formatting
```bash
npx prettier --write .
```
- Format all code according to project standards
- Uses Tailwind plugin for class ordering
- Should be automatically applied by editor or pre-commit hooks

## 4. Unused Code Detection
```bash
pnpm knip
```
- Remove any unused imports, exports, or code
- Keep codebase clean and minimal

## 5. Testing (if relevant)
```bash
pnpm test
```
- Run unit tests to ensure functionality
- For E2E tests: `npx playwright test`

## 6. Build Verification
```bash
pnpm build
```
- Verify the application builds successfully

## Important Notes
- **Always run lint and typecheck** before considering a task complete
- **Never commit** unless explicitly asked by the user
- **Use absolute imports** with `~/` prefix from tsconfig paths
- **Follow the established patterns** in the codebase
- **Use types instead of interfaces** (ESLint enforced)
- Ensure no `console.log` statements are left in production code
- Verify proper TypeScript types are used
- Ensure proper error handling is in place