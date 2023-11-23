// Model properties
const entityPrimaryKeyProperty = '_uid';
const entityAttributesProperty = 'attributes';
const edgeSourceProperty = 'from';
const edgeTargetProperty = 'to';

// Session variable properties
const caseProperty = 'caseId';
const sessionProperty = 'sessionId';
const protocolProperty = 'protocolUID';
const protocolName = 'protocolName';
const sessionStartTimeProperty = 'sessionStart';
const sessionFinishTimeProperty = 'sessionFinish';
const sessionExportTimeProperty = 'sessionExported';
const codebookHashProperty = 'codebookHash';

// Export properties
const nodeExportIDProperty = 'nodeID'; // Incrementing ID number for nodes
const edgeExportIDProperty = 'edgeID'; // Incrementing ID number for edges
const egoProperty = 'networkCanvasEgoUUID';
const ncTypeProperty = 'networkCanvasType';
const ncProtocolNameProperty = 'networkCanvasProtocolName';
const ncCaseProperty = 'networkCanvasCaseID';
const ncSessionProperty = 'networkCanvasSessionID';
const ncUUIDProperty = 'networkCanvasUUID';
const ncSourceUUID = 'networkCanvasSourceUUID';
const ncTargetUUID = 'networkCanvasTargetUUID';

module.exports = {
  caseProperty,
  edgeSourceProperty,
  edgeTargetProperty,
  egoProperty,
  entityAttributesProperty,
  entityPrimaryKeyProperty,
  nodeExportIDProperty,
  edgeExportIDProperty,
  ncCaseProperty,
  ncProtocolNameProperty,
  ncSessionProperty,
  ncSourceUUID,
  ncTargetUUID,
  ncTypeProperty,
  ncUUIDProperty,
  protocolName,
  protocolProperty,
  sessionExportTimeProperty,
  sessionFinishTimeProperty,
  sessionProperty,
  sessionStartTimeProperty,
  codebookHashProperty,
};
