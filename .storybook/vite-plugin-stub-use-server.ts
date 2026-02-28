const useServerRegex = /^['"]use server['"]/;
const jsExtRegex = /\.[cm]?[jt]sx?$/;

const exportAsyncFunctionRegex = /^export\s+async\s+function\s+(\w+)/gm;
const exportConstAsyncRegex = /^export\s+const\s+(\w+)\s*=\s*async/gm;
const exportTypeRegex = /^export\s+type\s+(\w+)/gm;

function getFirstNonEmptyLine(code: string): string {
  for (const line of code.split('\n')) {
    const trimmed = line.trim();
    if (trimmed !== '') return trimmed;
  }
  return '';
}

export function stubUseServer() {
  return {
    name: 'stub-use-server',
    enforce: 'pre' as const,

    transform(code: string, id: string) {
      if (id.includes('node_modules') || !jsExtRegex.test(id)) {
        return null;
      }

      const firstLine = getFirstNonEmptyLine(code);
      if (!useServerRegex.test(firstLine)) {
        return null;
      }

      const stubs: string[] = [`'use server';`];

      for (const match of code.matchAll(exportAsyncFunctionRegex)) {
        stubs.push(`export async function ${match[1]}() {}`);
      }

      for (const match of code.matchAll(exportConstAsyncRegex)) {
        stubs.push(`export const ${match[1]} = async () => {};`);
      }

      for (const match of code.matchAll(exportTypeRegex)) {
        stubs.push(`export type ${match[1]} = never;`);
      }

      return { code: stubs.join('\n'), map: null };
    },
  };
}
