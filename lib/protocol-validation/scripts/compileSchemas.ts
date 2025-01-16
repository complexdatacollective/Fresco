import Ajv from 'ajv';
import standaloneCode from 'ajv/dist/standalone/index.js';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';

const SCHEMA_SRC_PATH = './lib/protocol-validation/schemas/src';
const SCHEMA_OUTPUT_PATH = './lib/protocol-validation/schemas/compiled';

const ajv = new Ajv({
  code: { source: true, esm: true, lines: true },
  allErrors: true,
  allowUnionTypes: true,
});

ajv.addFormat('integer', /\d+/);
ajv.addFormat('date-time', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);

const isJsonFile = (fileName: string) => extname(fileName) === '.json';
const getBaseName = (schemaFileName: string) =>
  basename(schemaFileName, '.json');

const asVariableName = (schemaName: string) =>
  `version_${schemaName.replace(/\./g, '_')}`;

const asIntName = (schemaVersion: string | number) => {
  if (isNaN(parseInt(schemaVersion as string, 10))) {
    throw Error('Schema version could not be converted to integer');
  }

  return parseInt(schemaVersion as string, 10);
};

// get schemas,
const getSchemas = async (directory: string) => {
  const files = await readdir(directory);
  return files.filter(isJsonFile).map(getBaseName);
};

const generateModuleIndex = (schemas: string[]) => {
  const formatRequire = (baseSchemaName: string) => {
    const relativeModulePath = join(`./${baseSchemaName}.js`);
    return `import ${asVariableName(
      baseSchemaName,
    )} from './${relativeModulePath}';`;
  };

  const formatVersions = (baseSchemaName: string) =>
    `  { version: ${asIntName(baseSchemaName)}, validator: ${asVariableName(
      baseSchemaName,
    )} },`;

  const schemaRequires = schemas.map(formatRequire).join('\n');
  const schemaVersions = `${schemas.map(formatVersions).join('\n')}`;

  return `${schemaRequires}

const versions = [
${schemaVersions}
];

export default versions;
\r\n`;
};

const buildSchemas = async () => {
  const schemaSrcDirectory = resolve(SCHEMA_SRC_PATH);
  const schemaOutputDirectory = resolve(SCHEMA_OUTPUT_PATH);

  if (!(await stat(schemaOutputDirectory)).isDirectory()) {
    await mkdir(schemaOutputDirectory, { recursive: true });
  }

  const schemas = await getSchemas(schemaSrcDirectory);

  console.log('Compiling schemas...'); // eslint-disable-line

  schemas.forEach(async (baseSchemaName) => {
    const schemaPath = join(schemaSrcDirectory, `${baseSchemaName}.json`);
    const modulePath = join(schemaOutputDirectory, `${baseSchemaName}.js`);

    // Read the file at schemaPath and parse as JSON
    const schema = (await readFile(schemaPath, 'utf8').then(
      JSON.parse,
    )) as Record<string, unknown>;
    const validateFunction = ajv.compile(schema);
    const moduleCode = standaloneCode(ajv, validateFunction);

    await writeFile(modulePath, moduleCode, {});

    console.log(`${baseSchemaName} done.`); // eslint-disable-line
  });

  const moduleIndexPath = join(schemaOutputDirectory, 'index.js');
  const moduleIndex = generateModuleIndex(schemas);
  await writeFile(moduleIndexPath, moduleIndex);
};

buildSchemas();
