import { type Stage } from '@codaco/protocol-validation';
import { Accordion } from '@base-ui/react/accordion';
import { Popover } from '@base-ui/react/popover';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Toggle } from '@base-ui/react/toggle';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Snowflake,
  RotateCcw,
} from 'lucide-react';
import { motion } from 'motion/react';
import { type RefObject, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { cx } from '~/utils/cva';
import {
  getEdgeColorForType,
  makeGetCategoricalOptions,
  makeGetEdgeLabel,
  makeGetNodeAttributeLabel,
} from '~/lib/interviewer/selectors/session';
import { type RootState } from '~/lib/interviewer/store';

type NarrativeStage = Extract<Stage, { type: 'Narrative' }>;
type Preset = NarrativeStage['presets'][number];

type PresetSwitcherProps = {
  presets: Preset[];
  activePreset: number;
  highlightIndex: number;
  isFrozen: boolean;
  shouldShowResetButton: boolean;
  shouldShowFreezeButton: boolean;
  onResetInteractions: () => void;
  onChangePreset: (index: number) => void;
  onToggleFreeze: () => void;
  onToggleHulls: () => void;
  onToggleEdges: () => void;
  onChangeHighlightIndex: (index: number) => void;
  onToggleHighlighting: () => void;
  dragConstraints: RefObject<HTMLElement | null>;
};

export default function PresetSwitcher({
  presets,
  activePreset,
  highlightIndex,
  isFrozen,
  shouldShowResetButton,
  shouldShowFreezeButton,
  onResetInteractions,
  onChangePreset,
  onToggleFreeze,
  onToggleHulls,
  onToggleEdges,
  onChangeHighlightIndex,
  onToggleHighlighting,
  dragConstraints,
}: PresetSwitcherProps) {
  const currentPreset = presets[activePreset];

  const selector = useMemo(() => {
    const getEdgeLabel = makeGetEdgeLabel();
    const getNodeAttributeLabel = makeGetNodeAttributeLabel();
    const getCategoricalOptions = makeGetCategoricalOptions();

    return (state: RootState) => {
      const labels = (currentPreset?.highlight ?? []).map((variable: string) =>
        getNodeAttributeLabel(state, {
          variableId: variable,
        }),
      );
      const edgeList = (currentPreset?.edges?.display ?? []).map(
        (type: string) => ({
          label: getEdgeLabel(state, { type }),
          color: getEdgeColorForType(type)(state),
        }),
      );
      const catOptions = getCategoricalOptions(state, {
        variableId: currentPreset?.groupVariable ?? '',
      });

      return {
        categoricalOptions: catOptions as
          | { label: string; value: number }[]
          | undefined,
        edges: edgeList as { label: string; color: string }[],
        highlightLabels: labels as string[],
      };
    };
  }, [currentPreset]);

  const { categoricalOptions, edges, highlightLabels } = useSelector(selector);

  const hasHighlights = highlightLabels.length > 0;
  const hasEdges = edges.length > 0;
  const hasGroups = categoricalOptions && categoricalOptions.length > 0;
  const hasLegendContent = hasHighlights || hasEdges || hasGroups;

  if (!currentPreset) return null;

  return (
    <motion.div
      className="bg-surface/80 absolute right-10 bottom-10 z-10 flex min-w-64 cursor-move flex-col rounded-lg shadow-lg backdrop-blur-md"
      drag
      dragConstraints={dragConstraints}
    >
      {/* Preset navigation */}
      <div className="flex items-center gap-1 p-2">
        <button
          type="button"
          className="rounded p-1 transition-opacity hover:bg-white/10 disabled:opacity-30"
          disabled={activePreset === 0}
          onClick={() => onChangePreset(activePreset - 1)}
          aria-label="Previous preset"
        >
          <ChevronLeft size={16} />
        </button>

        {hasLegendContent ? (
          <Popover.Root>
            <Popover.Trigger className="flex-1 cursor-pointer text-center text-sm font-medium hover:underline">
              {currentPreset.label}
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner sideOffset={8} side="top" align="center">
                <Popover.Popup className="bg-surface/95 w-72 rounded-lg shadow-xl backdrop-blur-md">
                  <Popover.Arrow className="data-[side=bottom]:top-[-15px] data-[side=top]:bottom-[-14px] data-[side=top]:rotate-180">
                    <ArrowSvg />
                  </Popover.Arrow>
                  <Accordion.Root multiple className="flex flex-col">
                    {hasHighlights && (
                      <Accordion.Item>
                        <Accordion.Header className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                          <Accordion.Trigger className="flex flex-1 items-center gap-2 text-xs font-medium tracking-wider uppercase opacity-60 hover:opacity-100">
                            Attributes
                            <ChevronDown
                              size={12}
                              className="transition-transform [[data-panel-open]>&]:rotate-180"
                            />
                          </Accordion.Trigger>
                          <Toggle
                            pressed={true}
                            onPressedChange={onToggleHighlighting}
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground rounded p-0.5 text-xs hover:bg-white/10"
                            aria-label="Toggle attributes"
                          >
                            <span className="text-[10px]">On</span>
                          </Toggle>
                        </Accordion.Header>
                        <Accordion.Panel className="px-3 py-2">
                          <RadioGroup
                            value={String(highlightIndex)}
                            onValueChange={(v) =>
                              onChangeHighlightIndex(Number(v))
                            }
                            className="flex flex-col gap-1"
                          >
                            {highlightLabels.map((label, index) => (
                              <label
                                key={index}
                                className="flex cursor-pointer items-center gap-2 text-sm"
                              >
                                <Radio.Root
                                  value={String(index)}
                                  className="border-muted-foreground flex size-4 items-center justify-center rounded-full border"
                                >
                                  <Radio.Indicator className="bg-primary size-2 rounded-full" />
                                </Radio.Root>
                                {label}
                              </label>
                            ))}
                          </RadioGroup>
                        </Accordion.Panel>
                      </Accordion.Item>
                    )}

                    {hasEdges && (
                      <Accordion.Item>
                        <Accordion.Header className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                          <Accordion.Trigger className="flex flex-1 items-center gap-2 text-xs font-medium tracking-wider uppercase opacity-60 hover:opacity-100">
                            Links
                            <ChevronDown
                              size={12}
                              className="transition-transform [[data-panel-open]>&]:rotate-180"
                            />
                          </Accordion.Trigger>
                          <Toggle
                            pressed={true}
                            onPressedChange={onToggleEdges}
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground rounded p-0.5 text-xs hover:bg-white/10"
                            aria-label="Toggle links"
                          >
                            <span className="text-[10px]">On</span>
                          </Toggle>
                        </Accordion.Header>
                        <Accordion.Panel className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            {edges.map((edge, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-sm"
                              >
                                <EdgeSwatch color={edge.color} />
                                {edge.label}
                              </div>
                            ))}
                          </div>
                        </Accordion.Panel>
                      </Accordion.Item>
                    )}

                    {hasGroups && (
                      <Accordion.Item>
                        <Accordion.Header className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                          <Accordion.Trigger className="flex flex-1 items-center gap-2 text-xs font-medium tracking-wider uppercase opacity-60 hover:opacity-100">
                            Groups
                            <ChevronDown
                              size={12}
                              className="transition-transform [[data-panel-open]>&]:rotate-180"
                            />
                          </Accordion.Trigger>
                          <Toggle
                            pressed={true}
                            onPressedChange={onToggleHulls}
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground rounded p-0.5 text-xs hover:bg-white/10"
                            aria-label="Toggle groups"
                          >
                            <span className="text-[10px]">On</span>
                          </Toggle>
                        </Accordion.Header>
                        <Accordion.Panel className="px-3 py-2">
                          <div className="flex flex-col gap-1">
                            {categoricalOptions.map((option, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-2 text-sm"
                              >
                                <span
                                  className="inline-block size-3 rounded-full"
                                  style={{
                                    backgroundColor: `var(--color-cat-${index + 1})`,
                                  }}
                                />
                                {option.label}
                              </div>
                            ))}
                          </div>
                        </Accordion.Panel>
                      </Accordion.Item>
                    )}
                  </Accordion.Root>
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        ) : (
          <span className="flex-1 text-center text-sm font-medium">
            {currentPreset.label}
          </span>
        )}

        <button
          type="button"
          className="rounded p-1 transition-opacity hover:bg-white/10 disabled:opacity-30"
          disabled={activePreset + 1 === presets.length}
          onClick={() => onChangePreset(activePreset + 1)}
          aria-label="Next preset"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Action bar */}
      {(shouldShowFreezeButton || shouldShowResetButton) && (
        <div className="flex items-center justify-end gap-1 border-t border-white/10 px-2 py-1.5">
          {shouldShowFreezeButton && (
            <Toggle
              pressed={isFrozen}
              onPressedChange={onToggleFreeze}
              className={cx(
                'rounded p-1.5 transition-colors',
                isFrozen
                  ? 'bg-primary/20 text-primary'
                  : 'text-muted-foreground hover:bg-white/10',
              )}
              aria-label={
                isFrozen ? 'Unfreeze annotations' : 'Freeze annotations'
              }
            >
              <Snowflake size={16} />
            </Toggle>
          )}
          {shouldShowResetButton && (
            <button
              type="button"
              onClick={onResetInteractions}
              className="text-muted-foreground rounded p-1.5 hover:bg-white/10"
              aria-label="Reset interactions"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="30" height="20" viewBox="0 0 20 10" fill="none" {...props}>
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H18.5349C17.5468 8 16.5936 7.63423 15.8591 6.97318L11.0023 2.60207C10.622 2.2598 10.0447 2.25979 9.66437 2.60207Z"
        className="fill-surface"
      />
    </svg>
  );
}

function EdgeSwatch({ color }: { color: string }) {
  // Codebook stores 'edge-color-seq-N', CSS variable is '--color-edge-N'
  const n = /\d+$/.exec(color)?.[0] ?? '1';
  return (
    <span
      className="inline-block h-0.5 w-4 rounded-full"
      style={{ backgroundColor: `var(--color-edge-${n})` }}
    />
  );
}
