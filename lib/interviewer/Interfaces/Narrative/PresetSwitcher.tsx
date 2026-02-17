import { type Stage } from '@codaco/protocol-validation';
import { Collapsible } from '@base-ui/react/collapsible';
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
import { type RefObject, useMemo, useState } from 'react';
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
  const [legendOpen, setLegendOpen] = useState(false);
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
      <div className="flex items-center gap-1 border-b border-white/10 px-2 py-2">
        <button
          type="button"
          className="rounded p-1 transition-opacity hover:bg-white/10 disabled:opacity-30"
          disabled={activePreset === 0}
          onClick={() => onChangePreset(activePreset - 1)}
          aria-label="Previous preset"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="flex-1 text-center text-sm font-medium">
          {currentPreset.label}
        </span>
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

      {/* Collapsible legend */}
      {hasLegendContent && (
        <Collapsible.Root open={legendOpen} onOpenChange={setLegendOpen}>
          <Collapsible.Trigger className="flex w-full items-center justify-between px-3 py-2 text-xs tracking-wider uppercase opacity-60 hover:opacity-100">
            Legend
            <ChevronDown
              size={14}
              className={cx('transition-transform', legendOpen && 'rotate-180')}
            />
          </Collapsible.Trigger>
          <Collapsible.Panel>
            <div className="flex flex-col gap-3 px-3 pb-3">
              {/* Attributes (highlight variables) */}
              {hasHighlights && (
                <LegendSection
                  label="Attributes"
                  onToggle={onToggleHighlighting}
                >
                  <RadioGroup
                    value={String(highlightIndex)}
                    onValueChange={(v) => onChangeHighlightIndex(Number(v))}
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
                </LegendSection>
              )}

              {/* Links (display edges) */}
              {hasEdges && (
                <LegendSection label="Links" onToggle={onToggleEdges}>
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
                </LegendSection>
              )}

              {/* Groups (convex hulls) */}
              {hasGroups && (
                <LegendSection label="Groups" onToggle={onToggleHulls}>
                  <div className="flex flex-col gap-1">
                    {categoricalOptions.map((option, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 text-sm"
                      >
                        <span
                          className="inline-block size-3 rounded-full"
                          style={{
                            backgroundColor: `var(--color-cat-color-seq-${index + 1})`,
                          }}
                        />
                        {option.label}
                      </div>
                    ))}
                  </div>
                </LegendSection>
              )}
            </div>
          </Collapsible.Panel>
        </Collapsible.Root>
      )}

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

function LegendSection({
  label,
  onToggle,
  children,
}: {
  label: string;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wider uppercase opacity-60">
          {label}
        </span>
        <Toggle
          pressed={true}
          onPressedChange={onToggle}
          className="text-muted-foreground rounded p-0.5 text-xs hover:bg-white/10"
          aria-label={`Toggle ${label.toLowerCase()}`}
        >
          <span className="text-[10px]">On</span>
        </Toggle>
      </div>
      {children}
    </div>
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
