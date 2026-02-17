import { entityPrimaryKeyProperty, type NcNode } from '@codaco/shared-consts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import DrawerNode from './DrawerNode';

type NodeDrawerProps = {
  nodes: NcNode[];
};

export default function NodeDrawer({ nodes }: NodeDrawerProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (nodes.length === 0) return null;

  return (
    <div className="absolute right-0 bottom-0 left-0 z-10">
      {/* Toggle button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="bg-surface/80 flex items-center gap-1 rounded-t-lg px-4 py-1 text-sm backdrop-blur-md"
          aria-label={
            isExpanded ? 'Collapse node drawer' : 'Expand node drawer'
          }
          aria-expanded={isExpanded}
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          {nodes.length} unplaced {nodes.length === 1 ? 'node' : 'nodes'}
        </button>
      </div>

      {/* Drawer content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-surface/80 overflow-hidden backdrop-blur-md"
          >
            <div className="flex gap-4 overflow-x-auto p-4">
              {nodes.map((node) => (
                <DrawerNode key={node[entityPrimaryKeyProperty]} node={node} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
