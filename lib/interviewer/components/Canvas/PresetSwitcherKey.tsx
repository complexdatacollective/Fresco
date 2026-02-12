/* eslint-disable @typescript-eslint/no-unsafe-argument */
'use client';

import cx from 'classnames';
import { get, isEmpty } from 'es-toolkit/compat';
import { useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Icon from '~/lib/legacy-ui/components/Icon';
import {
  getCurrentStage,
  getEdgeColorForType,
  makeGetCategoricalOptions,
  makeGetEdgeLabel,
  makeGetNodeAttributeLabel,
} from '../../selectors/session';
import Accordion from './Accordion';

type Preset = {
  id: string;
  highlight?: string[];
  edges?: {
    display?: string[];
  };
  groupVariable?: string;
};

type PresetSwitcherKeyProps = {
  preset: Preset;
  highlightIndex: number;
  changeHighlightIndex: (index: number) => void;
  toggleHighlighting: () => void;
  toggleEdges: () => void;
  toggleHulls: () => void;
  isOpen: boolean;
};

const PresetSwitcherKey = ({
  preset,
  highlightIndex,
  changeHighlightIndex,
  toggleHighlighting,
  toggleEdges,
  toggleHulls,
  isOpen,
}: PresetSwitcherKeyProps) => {
  const panel = useRef<HTMLDivElement>(null);

  const selector = useMemo(() => {
    const getEdgeLabel = makeGetEdgeLabel();
    const getNodeAttributeLabel = makeGetNodeAttributeLabel();
    const getCategoricalOptions = makeGetCategoricalOptions();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (state: any) => {
      const stage = getCurrentStage(state);
      const labels = get(preset, 'highlight', []).map((variable: string) =>
        getNodeAttributeLabel(state, {
          stage,
          variableId: variable,
        }),
      );
      const edgeList = get(preset, 'edges.display', []).map((type: string) => ({
        label: getEdgeLabel(state, { type }),
        color: getEdgeColorForType(type)(state),
      }));
      const catOptions = getCategoricalOptions(state, {
        stage: getCurrentStage(state),
        variableId: preset.groupVariable,
      });

      return {
        convexOptions: catOptions as { label: string }[] | undefined,
        edges: edgeList as { label: string; color: string }[],
        highlightLabels: labels as string[],
      };
    };
  }, [preset]);

  const { convexOptions, edges, highlightLabels } = useSelector(selector);

  const classNames = cx('preset-switcher-key', {
    'preset-switcher-key--open': isOpen,
  });

  return createPortal(
    <div className={classNames} ref={panel}>
      <div className="preset-switcher-key__content">
        {!isEmpty(highlightLabels) && (
          <Accordion label="Attributes" onAccordionToggle={toggleHighlighting}>
            {highlightLabels.map((highlight, index) => (
              <label
                className="accordion-item"
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  changeHighlightIndex(index);
                }}
              >
                <input
                  type="radio"
                  name="highlight"
                  value={index}
                  checked={index === highlightIndex}
                  readOnly
                />
                {highlight}
              </label>
            ))}
          </Accordion>
        )}
        {!isEmpty(edges) && (
          <Accordion label="Links" onAccordionToggle={toggleEdges}>
            {edges.map((edge, index) => (
              <div className="accordion-item" key={index}>
                <Icon name="links" color={edge.color} />
                {edge.label}
              </div>
            ))}
          </Accordion>
        )}
        {convexOptions && !isEmpty(convexOptions) && (
          <Accordion label="Groups" onAccordionToggle={toggleHulls}>
            {convexOptions.map((option, index) => (
              <div className="accordion-item" key={index}>
                <Icon name="contexts" color={`nc-cat-color-seq-${index + 1}`} />
                <RenderMarkdown>{option.label}</RenderMarkdown>
              </div>
            ))}
          </Accordion>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default PresetSwitcherKey;
