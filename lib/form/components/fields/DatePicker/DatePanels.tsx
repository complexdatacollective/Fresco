'use client';

import { AnimatePresence, LayoutGroup, motion } from 'motion/react';
import React from 'react';
import { useDatePicker } from './DatePickerContext';
import { DayPicker } from './DayPicker';
import { MonthPicker } from './MonthPicker';
import { YearPicker } from './YearPicker';

type PanelProps = {
  children: React.ReactNode;
  type: 'year' | 'month' | 'day';
  isActive: boolean;
  isComplete: boolean;
};

function Panel({ children, type, isActive }: PanelProps) {
  if (!isActive) return null;

  return (
    <motion.div
      key={type}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="w-full"
      role="group"
      aria-label={`Select ${type}`}
    >
      {children}
    </motion.div>
  );
}

export function DatePanels() {
  const { date, type } = useDatePicker();

  const canSetMonth = ['full', 'month'].includes(type);
  const canSetDay = type === 'full';

  // Progressive panel logic - show only one panel at a time
  const isYearActive = date.year === null; // Show year picker when no year selected
  const isYearComplete = date.year !== null;
  
  // Show month panel only when year is set but month is not (and month selection is allowed)
  const isMonthActive = canSetMonth && date.year !== null && date.month === null;
  const isMonthComplete = date.month !== null;
  
  // Show day panel only when year and month are set but day is not (and day selection is allowed)
  const isDayActive = canSetDay && date.year !== null && date.month !== null && date.day === null;
  const isDayComplete = date.day !== null;

  // console.log('DatePanels: date:', date, 'type:', type);
  // console.log('DatePanels: isYearActive:', isYearActive, 'isMonthActive:', isMonthActive, 'isDayActive:', isDayActive);

  return (
    <LayoutGroup id="datePanels">
      <div className="w-full min-h-[320px] p-3">
        <AnimatePresence mode="wait">
          {isYearActive && (
            <Panel
              type="year"
              isActive={isYearActive}
              isComplete={isYearComplete}
            >
              <YearPicker />
            </Panel>
          )}
          {canSetMonth && isMonthActive && (
            <Panel
              type="month"
              isActive={isMonthActive}
              isComplete={isMonthComplete}
            >
              <MonthPicker />
            </Panel>
          )}
          {canSetDay && isDayActive && (
            <Panel type="day" isActive={isDayActive} isComplete={isDayComplete}>
              <DayPicker />
            </Panel>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
