# Task Completion Checklist

When completing any coding task, always run these commands in order:

## 1. Code Quality Checks
```bash
npm run lint
```
- Automatically fix linting errors with `--fix` flag if available
- ESLint will catch TypeScript, import, and code style issues

## 2. Type Checking
```bash
npm run typecheck
```
- Ensure all TypeScript types are correct
- Fix any type errors before proceeding

## 3. Unused Code Detection
```bash
npm run knip
```
- Remove any unused imports, exports, or code
- Keep codebase clean and minimal

## 4. Code Formatting
- Code formatting is handled by Prettier
- Should be automatically applied by editor or pre-commit hooks
- Uses Tailwind plugin for class ordering

## 5. Testing (if relevant)
```bash
npm run test
```
- Run unit tests to ensure functionality
- For E2E tests: `npx playwright test`

## Important Notes
- **Always run lint and typecheck** before considering a task complete
- **Never commit** unless explicitly asked by the user
- **Use absolute imports** with `~/` prefix from tsconfig paths
- **Follow the established patterns** in the codebase
- **Use types instead of interfaces** (ESLint enforced)