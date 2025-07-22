# Task Completion Checklist

When completing any coding task, always run these commands in order:

## 1. Type Checking

```bash
pnpm ts-lint
```

Fix any TypeScript errors before proceeding.

## 2. Linting

```bash
pnpm lint --fix
```

This will automatically fix many ESLint issues. Fix any remaining issues manually.

## 3. Code Formatting

```bash
npx prettier --write .
```

Format all code according to project standards.

## 4. Testing (if applicable)

```bash
pnpm test
```

Run tests to ensure functionality is working correctly.

## 5. Build Verification

```bash
pnpm build
```

Verify the application builds successfully.

## Additional Checks

- Ensure no `console.log` statements are left in production code
- Verify proper TypeScript types are used
- Check that imports use the `~/` path mapping where appropriate
- Ensure proper error handling is in place
