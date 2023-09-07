import friendlyErrorMessage from './friendlyErrorMessage';
import { validateSchema, validateLogic } from '../lib/protocol-utils';
import { errToString } from '../lib/protocol-utils/validate/helpers';
import { APP_SUPPORTED_SCHEMA_VERSIONS } from '../config';

const openError = friendlyErrorMessage(
  "There was an error reading that protocol file. It doesn't seem to be a valid JSON object. Check the format of your protocol, and try again.",
);
const validationError = friendlyErrorMessage(
  'Your protocol file failed validation. See below for the specific problems we found. This is often caused by attempting to open a protocol file authored in an incompatible version of Architect.',
);

// Basic validation on protocol format;
// any error will halt loading and display a message to the user.
const validateProtocol = (protocol) => {
  //   console.log('utils>>>', utils);
  //   console.log('utils>>>', utils.validateSchema);
  //   console.log('utils>>>', utils.validateSchema.default);
  //   const validateSchema = utils.validateSchema.default;
  //   const validateLogic = utils.validateLogic.default;
  // concentricCircles: 3, skewedTowardCenter: true }

  protocol.stages[17].background = {
    ...protocol.stages[17].background,
    concentricCircles: 3,
    skewedTowardCenter: true,
  };

  protocol.stages[29].background = {
    ...protocol.stages[29].background,
    skewedTowardCenter: true,
  };
  const schemaErrors = validateSchema.default(protocol);
  //   const schemaErrors = [];
  // console.log(
  //   '🚀 ~ file: parseProtocol.ts:24 ~ validateProtocol ~ schemaErrors:',
  //   schemaErrors,
  // );
  // console.log('/stages/17/background>16', protocol.stages[16].background);
  // console.log('/stages/17/background>29', protocol.stages[29].background);
  //   const logicErrors = validateLogic.default(protocol);
  const logicErrors = [];

  if (schemaErrors.length > 0 || logicErrors.length > 0) {
    throw new Error(
      [...schemaErrors, ...logicErrors].map(errToString).join(''),
    );
  }
};

const checkSchemaVersion = (protocol: any) => {
  if (!APP_SUPPORTED_SCHEMA_VERSIONS.includes(protocol.schemaVersion)) {
    throw new Error(
      'The schema version of this protocol is not compatible with this version of Network Canvas Interviewer. Upgrade the protocol using Architect, and try importing it again.',
    );
  }
};

// const parseProtocol1 = (protocolUID, name) =>
//   readFile(protocolPath(protocolUID, 'protocol.json'))
//     .then((json) => JSON.parse(json))
//     .then((protocol) => checkSchemaVersion(protocol))
//     .then((protocol) => validateProtocol(protocol))
//     .catch(validationError)
//     .then((protocol) => {
//       const withFilename = {
//         ...protocol,
//         name,
//         uid: protocolUID,
//       };
//       return withFilename;
//     })
//     .catch(openError);

export default function parseProtocol(protocol: any) {
  try {
    checkSchemaVersion(protocol);
    validateProtocol(protocol);
    console.log('protocal parsed');
  } catch (e) {
    validationError(e);
  }
}
