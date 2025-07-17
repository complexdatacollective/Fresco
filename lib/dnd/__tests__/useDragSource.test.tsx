import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useDragSource } from '../useDragSource';
import { useDndStore } from '../store';

// Mock the store
vi.mock('../store', () => ({
  useDndStore: vi.fn(),
}));

const mockStore = {
  startDrag: vi.fn(),
  updateDragPosition: vi.fn(),
  endDrag: vi.fn(),
  activeDropTargetId: null,
  getState: vi.fn(),
};

function TestComponent({ metadata = { type: 'test' }, disabled = false }) {
  const { dragProps, isDragging } = useDragSource({
    metadata,
    disabled,
  });

  return (
    <div {...dragProps} data-testid="draggable">
      {isDragging ? 'Dragging' : 'Not dragging'}
    </div>
  );
}

describe('useDragSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useDndStore as any).mockReturnValue(mockStore);
    mockStore.getState.mockReturnValue({ activeDropTargetId: null });
  });

  it('should render draggable element', () => {
    render(<TestComponent />);

    const draggable = screen.getByTestId('draggable');
    expect(draggable).toBeInTheDocument();
    expect(draggable).toHaveAttribute('role', 'button');
    expect(draggable).toHaveAttribute('tabIndex', '0');
  });

  it('should handle pointer down event', () => {
    render(<TestComponent />);

    const draggable = screen.getByTestId('draggable');

    // Mock getBoundingClientRect
    vi.spyOn(draggable, 'getBoundingClientRect').mockReturnValue({
      width: 100,
      height: 50,
      top: 0,
      left: 0,
      bottom: 50,
      right: 100,
    } as DOMRect);

    fireEvent.pointerDown(draggable, {
      button: 0,
      pageX: 100,
      pageY: 200,
      clientX: 100,
      clientY: 200,
    });

    expect(mockStore.startDrag).toHaveBeenCalledWith({
      id: expect.any(String),
      metadata: { type: 'test' },
      x: 100,
      y: 200,
      width: 100,
      height: 50,
    });
  });

  it('should not start drag when disabled', () => {
    render(<TestComponent disabled />);

    const draggable = screen.getByTestId('draggable');
    fireEvent.pointerDown(draggable, { button: 0 });

    expect(mockStore.startDrag).not.toHaveBeenCalled();
  });

  it('should not start drag on right click', () => {
    render(<TestComponent />);

    const draggable = screen.getByTestId('draggable');
    fireEvent.pointerDown(draggable, { button: 2 });

    expect(mockStore.startDrag).not.toHaveBeenCalled();
  });

  it('should set proper accessibility attributes', () => {
    render(<TestComponent />);

    const draggable = screen.getByTestId('draggable');
    expect(draggable).toHaveAttribute('aria-grabbed', 'false');
    expect(draggable).toHaveAttribute('aria-dropeffect', 'move');
    expect(draggable).toHaveAttribute('role', 'button');
  });

  it('should disable tabIndex when disabled', () => {
    render(<TestComponent disabled />);

    const draggable = screen.getByTestId('draggable');
    expect(draggable).toHaveAttribute('tabIndex', '-1');
  });

  it('should handle keyboard events', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    render(<TestComponent />);

    const draggable = screen.getByTestId('draggable');
    fireEvent.keyDown(draggable, { key: ' ' });

    expect(consoleSpy).toHaveBeenCalledWith(
      'Keyboard drag not yet implemented',
    );

    consoleSpy.mockRestore();
  });
});
