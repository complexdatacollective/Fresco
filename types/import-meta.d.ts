interface ImportMetaEnv {
  readonly MODE: string;
  [key: string]: string | boolean | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
