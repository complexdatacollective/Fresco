const fs = require('fs-extra');
const path = require('path');
const Ajv = require('ajv');
const pack = require('ajv-pack');

const ajv = new Ajv({ sourceCode: true, allErrors: true });
ajv.addFormat('integer', /\d+/);

const isJsonFile = fileName =>
  path.extname(fileName) === '.json';

const getBaseName = schemaFileName =>
  path.basename(schemaFileName, '.json');

const asVariableName = schemaName =>
  `version_${schemaName.replace(/\./g, '_')}`;

const asIntName = (schemaName) => {
  if (isNaN(parseInt(schemaName, 10))) {
    throw Error('Schema version could not be converted to integer');
  }

  return parseInt(schemaName, 10);
}

// get schemas,
const getSchemas = directory =>
  fs.readdir(directory)
    .then(
      files =>
        files
          .filter(isJsonFile)
          .map(getBaseName),
    );

const generateModuleIndex = (schemas) => {
  const formatRequire = (baseSchemaName) => {
    const relativeModulePath = path.join(`./${baseSchemaName}.js`);
    return `const ${asVariableName(baseSchemaName)} = require('./${relativeModulePath}');`;
  };

  const formatVersions = baseSchemaName =>
    `  { version: ${asIntName(baseSchemaName)}, validator: ${asVariableName(baseSchemaName)} },`;

  const schemaRequires = schemas.map(formatRequire).join('\n');
  const schemaVersions = `${schemas.map(formatVersions).join('\n')}`;

  return `${schemaRequires}

const versions = [
${schemaVersions}
];

module.exports = versions;
\r\n`;
};

const buildSchemas = async () => {
  const schemasDirectory = path.resolve('schemas');

  const schemas = await getSchemas(schemasDirectory);

  schemas.forEach(async (baseSchemaName) => {
    const schemaPath = path.join(schemasDirectory, `${baseSchemaName}.json`);
    const modulePath = path.join(schemasDirectory, `${baseSchemaName}.js`);

    const schema = await fs.readJson(schemaPath);
    const validate = ajv.compile(schema);
    const moduleCode = pack(ajv, validate);

    await fs.writeFile(modulePath, moduleCode);

    console.log(`${baseSchemaName} done.`); // eslint-disable-line
  });

  const moduleIndexPath = path.join(schemasDirectory, 'index.js');
  const moduleIndex = generateModuleIndex(schemas);
  await fs.writeFile(moduleIndexPath, moduleIndex);
};

buildSchemas();
