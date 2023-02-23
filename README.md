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
- [ ] tsconfig package for reuse across the project
- [ ] esling configuration
- [ ] testing
- [ ] Docker packaging of web-backend
- [ ] CI/CD
- [ ] .env file for project configuration
- [ ] Electron packaging with prisma. Real PITA.
  - See [here]<https://github.com/florianbepunkt/electron-prisma> and [here]<https://github.com/awohletz/electron-prisma-trpc-example/tree/react> for examples
  - Ideally, we want to switch to electron-forge since it seems a bit less bonkers.
- [ ] ...cordova/capacitor. not sure that these will be possible.
