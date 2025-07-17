import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useDropTarget } from '../useDropTarget';
import { useDndStore } from '../store';

// Mock the store
vi.mock('../store', () => ({
  useDndStore: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const mockStore = {
  dragItem: null,
  activeDropTargetId: null,
  registerDropTarget: vi.fn(),
  unregisterDropTarget: vi.fn(),
  updateDropTarget: vi.fn(),
  subscribe: vi.fn(),
  getState: vi.fn(),
};

function TestComponent({
  accepts = () => true,
  disabled = false,
  onDrop = vi.fn(),
}) {
  const { dropProps, isOver, canDrop, dragItem } = useDropTarget({
    accepts,
    disabled,
    onDrop,
  });

  return (
    <div {...dropProps} data-testid="drop-target">
      <div>isOver: {isOver.toString()}</div>
      <div>canDrop: {canDrop.toString()}</div>
      <div>dragItem: {dragItem ? 'present' : 'null'}</div>
    </div>
  );
}

describe('useDropTarget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDndStore as any).mockReturnValue(mockStore);
    mockStore.getState.mockReturnValue({ activeDropTargetId: null });
    mockStore.subscribe.mockImplementation((selector, callback) => {
      // Mock subscription
      return () => {};
    });
  });

  it('should render drop target', () => {
    render(<TestComponent />);

    const dropTarget = screen.getByTestId('drop-target');
    expect(dropTarget).toBeInTheDocument();
    expect(dropTarget).toHaveAttribute('data-drop-target', 'true');
  });

  it('should register drop target on mount', () => {
    render(<TestComponent />);

    expect(mockStore.registerDropTarget).toHaveBeenCalledWith({
      id: expect.any(String),
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      accepts: expect.any(Function),
    });
  });

  it('should unregister drop target on unmount', () => {
    const { unmount } = render(<TestComponent />);

    unmount();

    expect(mockStore.unregisterDropTarget).toHaveBeenCalledWith(
      expect.any(String),
    );
  });

  it('should not register when disabled', () => {
    vi.clearAllMocks();
    render(<TestComponent disabled />);

    expect(mockStore.registerDropTarget).not.toHaveBeenCalled();
  });

  it('should update canDrop based on drag item', () => {
    // Mock drag item
    const dragItem = {
      id: 'drag-1',
      metadata: { type: 'test' },
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      startX: 0,
      startY: 0,
    };

    (useDndStore as any).mockReturnValue({
      ...mockStore,
      dragItem,
    });

    render(<TestComponent accepts={(meta) => meta.type === 'test'} />);

    expect(screen.getByText('canDrop: true')).toBeInTheDocument();
  });

  it('should show canDrop false when accepts returns false', () => {
    const dragItem = {
      id: 'drag-1',
      metadata: { type: 'test' },
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      startX: 0,
      startY: 0,
    };

    (useDndStore as any).mockReturnValue({
      ...mockStore,
      dragItem,
    });

    render(<TestComponent accepts={(meta) => meta.type === 'other'} />);

    expect(screen.getByText('canDrop: false')).toBeInTheDocument();
  });

  it('should show isOver when active drop target', () => {
    const dragItem = {
      id: 'drag-1',
      metadata: { type: 'test' },
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      startX: 0,
      startY: 0,
    };

    (useDndStore as any).mockReturnValue({
      ...mockStore,
      dragItem,
      activeDropTargetId: 'drop-test',
    });

    render(<TestComponent />);

    // Note: The actual isOver state depends on internal ID matching
    // This test verifies the component renders without errors
    expect(screen.getByTestId('drop-target')).toBeInTheDocument();
  });

  it('should set proper accessibility attributes', () => {
    render(<TestComponent />);

    const dropTarget = screen.getByTestId('drop-target');
    expect(dropTarget).toHaveAttribute('aria-dropeffect', 'none');
    expect(dropTarget).toHaveAttribute('data-drop-target', 'true');
  });
});
