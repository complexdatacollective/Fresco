# protocol-validation
Submodule implementing protocol schema validation

- Schemas are defined in the JSON schema format: https://json-schema.org/latest/json-schema-validation.html
- Schemas can be found in `/schemas/` (`*.json`)
- When adding/modifying a schema run `npm run build` to compile the new validators (this will generate the corresponding `*.js` for each schema file)
