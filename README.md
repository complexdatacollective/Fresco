# Fresco Monorepo

## Structure

Turbo monorepo, with the following structure:

```
├── apps
│   ├── web-backend // Node/Deno/Express backend for web
│   ├── frontend // Current Interviewer frontend React app
│   └── electron-backend // Node/Electron backend
├── packages
│   ├── api // TRPC Router definition share between frontend and backends
│   ├── config // Shared eslint/ts configuration files
│   ├── database // Prisma db client
```

## TODO

- [ ] Frontend build mode switch for web/electron
- [ ] tsconfig package for reuse across the project. like [this]<https://turbo.build/repo/docs/handbook/linting/typescript>
- [ ] esling configuration
- [ ] testing. Note that enzyme [is dead]<https://github.com/react-recompose/react-recompose/issues/40>
- [ ] Docker packaging of web-backend
- [ ] CI/CD
- [ ] .env file for project configuration
- [ ] Electron packaging with prisma. Real PITA.
  - See [here]<https://github.com/florianbepunkt/electron-prisma> and [here]<https://github.com/awohletz/electron-prisma-trpc-example/tree/react> for examples. See [here]<https://github.com/prisma/prisma/issues/9613> for prisma discussion.
  - Ideally, we want to switch to electron-forge since it seems a bit less bonkers.
- [ ] ...cordova/capacitor. not sure that these will be possible.
