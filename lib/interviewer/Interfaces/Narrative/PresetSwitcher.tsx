import { Accordion } from '@base-ui/react/accordion';
import { Popover } from '@base-ui/react/popover';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { type Stage } from '@codaco/protocol-validation';
import { createSelector } from '@reduxjs/toolkit';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import {
  type ReactNode,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useSelector } from 'react-redux';
import { MotionSurface } from '~/components/layout/Surface';
import { RenderMarkdown } from '~/components/RenderMarkdown';
import Heading from '~/components/typography/Heading';
import { IconButton } from '~/components/ui/Button';
import { getCodebook } from '~/lib/interviewer/ducks/modules/protocol';
import { getSubjectType } from '~/lib/interviewer/selectors/session';

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

const presetLabelVariants = {
  enter: (backwards: boolean) => ({ y: backwards ? -8 : 8, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (backwards: boolean) => ({ y: backwards ? 8 : -8, opacity: 0 }),
};

const presetContentVariants = {
  enter: (backwards: boolean) => ({ x: backwards ? -20 : 20, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (backwards: boolean) => ({ x: backwards ? 20 : -20, opacity: 0 }),
};

function AnimatedPanel({ children }: { children: ReactNode }) {
  return (
    <Accordion.Panel
      keepMounted
      render={(props, state) => (
        <motion.div
          {...props}
          onDrag={undefined}
          onDragEnd={undefined}
          onDragStart={undefined}
          onAnimationStart={undefined}
          hidden={undefined}
          aria-hidden={!state.open}
          animate={{
            height: state.open ? 'auto' : 0,
            opacity: state.open ? 1 : 0,
          }}
          initial={false}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          style={{ ...props.style, overflow: 'hidden' }}
        >
          {props.children}
        </motion.div>
      )}
    >
      {children}
    </Accordion.Panel>
  );
}

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

  const selector = useMemo(
    () =>
      createSelector(getCodebook, getSubjectType, (codebook, subjectType) => {
        const highlightLabels = (currentPreset?.highlight ?? []).map(
          (variableId: string) =>
            (subjectType &&
              codebook?.node?.[subjectType]?.variables?.[variableId]?.name) ??
            '',
        );

        const edges = (currentPreset?.edges?.display ?? []).map(
          (type: string) => ({
            label: codebook?.edge?.[type]?.name ?? '',
            color: codebook?.edge?.[type]?.color ?? 'edge-color-seq-1',
          }),
        );

        const groupVariable = currentPreset?.groupVariable;
        let categoricalOptions: { label: string; value: number }[] | undefined;
        if (subjectType && groupVariable) {
          const variable =
            codebook?.node?.[subjectType]?.variables?.[groupVariable];
          categoricalOptions =
            variable && 'options' in variable
              ? (variable.options as { label: string; value: number }[])
              : undefined;
        }

        return { categoricalOptions, edges, highlightLabels };
      }),
    [currentPreset],
  );

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

  const [popoverOpen, setPopoverOpen] = useState(true);

  const prevPresetRef = useRef(activePreset);
  const backwards = activePreset < prevPresetRef.current;

  useEffect(() => {
    prevPresetRef.current = activePreset;

    // Close then reopen on preset change
    setPopoverOpen(false);
    const timeout = setTimeout(() => setPopoverOpen(true), 300);
    return () => clearTimeout(timeout);
  }, [activePreset]);

  if (!currentPreset) return null;

  return (
    <LayoutGroup>
      <Popover.Root
        open={popoverOpen}
        onOpenChange={(open, event) => {
          if (!open && event.reason === 'outside-press') return;
          setPopoverOpen(open);
        }}
      >
        <Popover.Trigger
          nativeButton={false}
          render={
            <MotionSurface
              noContainer
              className="bg-surface/80 absolute right-10 bottom-10 z-10 flex min-w-3xs cursor-move items-center gap-4 rounded-2xl backdrop-blur-md"
              spacing="none"
              drag
              dragConstraints={dragConstraints}
              layout
            />
          }
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
          <AnimatePresence mode="wait" custom={backwards}>
            <motion.div
              key={activePreset}
              custom={backwards}
              variants={presetLabelVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.15 }}
              className="grow text-center"
            >
              <Heading level="label" margin="none">
                {currentPreset.label}
              </Heading>
            </motion.div>
          </AnimatePresence>
          <IconButton
            icon={<ChevronRight />}
            aria-label="Next preset"
            disabled={activePreset + 1 === presets.length}
            onClick={() => onChangePreset(activePreset + 1)}
            variant="text"
            size="lg"
            className="rounded-none outline-offset-0"
          />
        </Popover.Trigger>
        <Popover.Portal keepMounted>
          <AnimatePresence>
            {popoverOpen && (
              <Popover.Positioner align="center" sideOffset={14}>
                <Popover.Popup
                  className="max-w-sm min-w-3xs overflow-visible"
                  render={
                    <MotionSurface
                      noContainer
                      className="bg-surface/80 rounded-lg shadow-xl backdrop-blur-md"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ type: 'spring', duration: 0.5 }}
                    />
                  }
                >
                  <Popover.Arrow className="data-[side=bottom]:top-[-10px] data-[side=left]:right-[-15px] data-[side=left]:rotate-90 data-[side=right]:left-[-15px] data-[side=right]:rotate-270 data-[side=top]:bottom-[-10px] data-[side=top]:rotate-180">
                    <ArrowSvg />
                  </Popover.Arrow>
                  <AnimatePresence mode="wait" custom={backwards}>
                    <motion.div
                      key={activePreset}
                      custom={backwards}
                      variants={presetContentVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        x: { type: 'spring', stiffness: 600, damping: 35 },
                        opacity: { duration: 0.15 },
                      }}
                    >
                      <Accordion.Root
                        multiple
                        value={accordionValue}
                        onValueChange={handleAccordionValueChange}
                        className="flex flex-col gap-4"
                      >
                        {hasHighlights && (
                          <Accordion.Item value={SECTION_ATTRIBUTES}>
                            <Accordion.Header className="mb-2">
                              <Accordion.Trigger className="focusable flex w-full items-center gap-4">
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
                            <AnimatedPanel>
                              <RadioGroup
                                value={String(highlightIndex)}
                                onValueChange={(v) =>
                                  onChangeHighlightIndex(Number(v))
                                }
                                className="flex flex-col gap-2"
                              >
                                {highlightLabels.map((label, index) => (
                                  <label
                                    key={index}
                                    className="flex cursor-pointer items-center gap-4 text-sm"
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
                            </AnimatedPanel>
                          </Accordion.Item>
                        )}

                        {hasEdges && (
                          <Accordion.Item value={SECTION_LINKS}>
                            <Accordion.Header className="mb-2">
                              <Accordion.Trigger className="focusable flex w-full items-center gap-4">
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
                            <AnimatedPanel>
                              <div className="flex flex-col gap-2">
                                {edges.map((edge, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-4 text-sm"
                                  >
                                    <EdgeSwatch color={edge.color} />
                                    {edge.label}
                                  </div>
                                ))}
                              </div>
                            </AnimatedPanel>
                          </Accordion.Item>
                        )}

                        {hasGroups && (
                          <Accordion.Item value={SECTION_GROUPS}>
                            <Accordion.Header className="mb-2">
                              <Accordion.Trigger className="focusable flex w-full items-center gap-4">
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
                            <AnimatedPanel>
                              <div className="flex flex-col gap-2">
                                {categoricalOptions.map((option, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center gap-4 text-sm"
                                  >
                                    <span
                                      className="inline-block size-3 rounded-full"
                                      style={{
                                        backgroundColor: `var(--color-cat-${index + 1})`,
                                      }}
                                    />
                                    <RenderMarkdown>
                                      {option.label}
                                    </RenderMarkdown>
                                  </div>
                                ))}
                              </div>
                            </AnimatedPanel>
                          </Accordion.Item>
                        )}
                      </Accordion.Root>
                    </motion.div>
                  </AnimatePresence>
                </Popover.Popup>
              </Popover.Positioner>
            )}
          </AnimatePresence>
        </Popover.Portal>
      </Popover.Root>
    </LayoutGroup>
  );
}

function ArrowSvg(props: React.ComponentProps<'svg'>) {
  return (
    <svg width="20" height="12" viewBox="0 0 30 15" fill="none" {...props}>
      <path
        d="M0 15 L12 3 Q15 0 18 3 L30 15Z"
        className="fill-surface/80 backdrop-blur-md"
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
