import { Accordion } from '@base-ui/react/accordion';
import { Popover } from '@base-ui/react/popover';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { type Stage } from '@codaco/protocol-validation';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { type RefObject, useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Surface, { MotionSurface } from '~/components/layout/Surface';
import Heading from '~/components/typography/Heading';
import { IconButton } from '~/components/ui/Button';
import {
  getEdgeColorForType,
  makeGetCategoricalOptions,
  makeGetEdgeLabel,
  makeGetNodeAttributeLabel,
} from '~/lib/interviewer/selectors/session';
import { type RootState } from '~/lib/interviewer/store';

type NarrativeStage = Extract<Stage, { type: 'Narrative' }>;
type Preset = NarrativeStage['presets'][number];

const SECTION_ATTRIBUTES = 'attributes';
const SECTION_LINKS = 'links';
const SECTION_GROUPS = 'groups';

type PresetSwitcherProps = {
  presets: Preset[];
  activePreset: number;
  highlightIndex: number;
  showHighlighting: boolean;
  showEdges: boolean;
  showHulls: boolean;
  onChangePreset: (index: number) => void;
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
  showHighlighting,
  showEdges,
  showHulls,
  onChangePreset,
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

  // Controlled accordion: open sections correspond to enabled features
  const accordionValue = useMemo(() => {
    const value: string[] = [];
    if (showHighlighting) value.push(SECTION_ATTRIBUTES);
    if (showEdges) value.push(SECTION_LINKS);
    if (showHulls) value.push(SECTION_GROUPS);
    return value;
  }, [showHighlighting, showEdges, showHulls]);

  const handleAccordionValueChange = useCallback(
    (newValue: unknown[]) => {
      const next = new Set(newValue);
      const prev = new Set(accordionValue);

      // Toggle whichever section changed
      if (prev.has(SECTION_ATTRIBUTES) !== next.has(SECTION_ATTRIBUTES)) {
        onToggleHighlighting();
      }
      if (prev.has(SECTION_LINKS) !== next.has(SECTION_LINKS)) {
        onToggleEdges();
      }
      if (prev.has(SECTION_GROUPS) !== next.has(SECTION_GROUPS)) {
        onToggleHulls();
      }
    },
    [accordionValue, onToggleHighlighting, onToggleEdges, onToggleHulls],
  );

  const [popoverOpen, setPopoverOpen] = useState(false);

  if (!currentPreset) return null;

  return (

      <Popover.Root
        open={popoverOpen}
        onOpenChange={(open, event) => {
          if (!open && event.reason === 'outside-press') return;
          setPopoverOpen(open);
        }}
      >
        <Popover.Trigger
          className="flex-1 cursor-pointer"
        >
              <MotionSurface
      noContainer
      className="bg-surface/80 absolute right-10 bottom-10 z-10 flex cursor-move items-center gap-4 rounded-2xl backdrop-blur-md"
      spacing="none"
      drag
      dragConstraints={dragConstraints}
      layout
    >
      <IconButton
        disabled={activePreset === 0}
        onClick={() => onChangePreset(activePreset - 1)}
        aria-label="Previous preset"
        icon={<ChevronLeft />}
        variant="text"
        size="lg"
        className="rounded-none outline-offset-0"
      />
      <Heading level="label" margin="none" >
          {currentPreset.label}
      </Heading>
            <IconButton
        icon={<ChevronRight />}
        aria-label="Next preset"
        disabled={activePreset + 1 === presets.length}
        onClick={() => onChangePreset(activePreset + 1)}
        variant="text"
        size="lg"
        className="rounded-none outline-offset-0"
      />
    </MotionSurface>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={40} align="center">
            <Popover.Popup
              className="bg-surface/80 overflow-visible rounded-lg shadow-xl backdrop-blur-md"
              render={<Surface noContainer />}
            >
              <Popover.Arrow className="data-[side=bottom]:top-[-15px] data-[side=top]:bottom-[-14px] data-[side=top]:rotate-180">
                <ArrowSvg />
              </Popover.Arrow>
              <Accordion.Root
                multiple
                value={accordionValue}
                onValueChange={handleAccordionValueChange}
                className="flex flex-col"
              >
                {hasHighlights && (
                  <Accordion.Item value={SECTION_ATTRIBUTES}>
                    <Accordion.Header>
                      <Accordion.Trigger className="focusable flex w-full items-center gap-2">
                        <Heading
                          level="h4"
                          variant="all-caps"
                          margin="none"
                          className="flex-1 text-left text-xs opacity-60"
                        >
                          Attributes
                        </Heading>
                        <ChevronDown className="opacity-60 transition-transform [[data-panel-open]>&]:rotate-180" />
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Panel className="px-3 py-2">
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
                    </Accordion.Panel>
                  </Accordion.Item>
                )}

                {hasEdges && (
                  <Accordion.Item value={SECTION_LINKS}>
                    <Accordion.Header>
                      <Accordion.Trigger className="focusable flex w-full items-center gap-2">
                        <Heading
                          level="h4"
                          variant="all-caps"
                          margin="none"
                          className="flex-1 text-left text-xs opacity-60"
                        >
                          Links
                        </Heading>
                        <ChevronDown className="opacity-60 transition-transform [[data-panel-open]>&]:rotate-180" />
                      </Accordion.Trigger>
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
                  <Accordion.Item value={SECTION_GROUPS}>
                    <Accordion.Header>
                      <Accordion.Trigger className="focusable flex w-full items-center gap-2">
                        <Heading
                          level="h4"
                          variant="all-caps"
                          margin="none"
                          className="flex-1 text-left text-xs opacity-60"
                        >
                          Groups
                        </Heading>
                        <ChevronDown className="opacity-60 transition-transform [[data-panel-open]>&]:rotate-180" />
                      </Accordion.Trigger>
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
