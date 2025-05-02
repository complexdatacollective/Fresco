import { get } from 'es-toolkit/compat';
import { connect } from 'react-redux';
import {
  compose,
  lifecycle,
  mapProps,
  withHandlers,
  withState,
} from 'recompose';
import { getVariableTypeReplacements } from '~/lib/network-exporters/utils/externalData';
import { getAssetManifest, getCodebook } from '../ducks/modules/protocol';
import loadExternalData, { makeVariableUUIDReplacer } from '../utils/loadExternalData';

const mapStateToProps = (state) => {
  const assetManifest = getAssetManifest(state);
  const protocolCodebook = getCodebook(state);

  return {
    assetManifest,
    protocolCodebook,
  };
};

/**
 * Creates a higher order component which can be used to load data from network assets in
 * the assetsManifest onto a component.
 *
 * @param {string} sourceProperty - prop containing the sourceId to load
 * @param {string} dataProperty - prop name to supply the data to the child component.
 *
 * Usage:
 *
 * ```
 * // in MyComponent.js
 * // print out the json data as a string.
 * const MyComponent = ({ myExternalData }) => (
 *   <div>{JSON.stringify(myExternalData}}</div>
 * );
 *
 * export default withExternalData('mySourceId', 'myExternalData')(MyComponent);
 *
 * // in jsx block:
 *
 * <MyComponent mySourceId="hivServices" />
 * ```
 */
const withExternalData = (sourceProperty, dataProperty) =>
  compose(
    connect(mapStateToProps),
    withState(
      dataProperty, // State name
      'setExternalData', // State updater name
      null, // initialState
    ),
    withState(
      `${dataProperty}__isLoading`, // State name
      'setExternalDataIsLoading', // State updater name
      false, // initialState
    ),
    withHandlers({
      loadExternalData:
        ({
          setExternalData,
          setExternalDataIsLoading,
          assetManifest,
          protocolCodebook,
        }) =>
        (sourceId, stageSubject) => {
          if (!sourceId) {
            return;
          }
          // This is where we could set the loading state for URL assets
          setExternalData(null);
          setExternalDataIsLoading(true);

          const { name, url } = assetManifest[sourceId];

          loadExternalData(name, url)
            .then((externalData) => {
              const variableUUIDReplacer = makeVariableUUIDReplacer(
                protocolCodebook,
                stageSubject.type,
              );
              return externalData.nodes.map(variableUUIDReplacer);
            })
            .then((uuidData) =>
              getVariableTypeReplacements(
                name,
                uuidData,
                protocolCodebook,
                stageSubject,
              ),
            )
            .then((nodes) => {
              setExternalDataIsLoading(false);
              setExternalData({ nodes });
            });
        },
    }),
    lifecycle({
      componentDidUpdate(prevProps) {
        const prevSource = get(prevProps, sourceProperty);
        const currentSource = get(this.props, sourceProperty);

        if (prevSource !== currentSource) {
          this.props.loadExternalData(currentSource, this.props.stage.subject);
        }
      },
      componentDidMount() {
        const source = get(this.props, sourceProperty);

        if (!source) {
          return;
        }
        this.props.loadExternalData(source, this.props.stage.subject);
      },
    }),
    mapProps(
      ({
        _setAbortController,
        _abortController,
        _setExternalData,
        loadExternalData: _, // shadows upper scope otherwise
        ...props
      }) => props,
    ),
  );

export default withExternalData;
