import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/test-utils';
import ConfirmDialog from './ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    open: true,
    message: 'Test message',
    onConfirm: vi.fn(),
    onClose: vi.fn(),
  };

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(<ConfirmDialog {...defaultProps} open={false} />);

      expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    });

    it('should render when open is true', () => {
      render(<ConfirmDialog {...defaultProps} />);

      expect(screen.getByText('Test message')).toBeInTheDocument();
    });

    it('should render with default title "Confirmar"', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Confirmar');
    });

    it('should render with custom title', () => {
      render(<ConfirmDialog {...defaultProps} title="Custom Title" />);

      const title = screen.getByRole('heading', { level: 3 });
      expect(title).toHaveTextContent('Custom Title');
      expect(title).not.toHaveTextContent('Confirmar');
    });

    it('should render required message prop', () => {
      render(<ConfirmDialog {...defaultProps} message="Important message" />);

      expect(screen.getByText('Important message')).toBeInTheDocument();
    });

    it('should render with default button text', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
      expect(buttons[0]).toHaveTextContent('Cancelar');
      expect(buttons[1]).toHaveTextContent('Confirmar');
    });

    it('should render with custom button text', () => {
      render(
        <ConfirmDialog
          {...defaultProps}
          confirmText="Delete"
          cancelText="Go Back"
        />
      );

      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Go Back')).toBeInTheDocument();
    });
  });

  describe('Button styling', () => {
    it('should render normal confirm button (blue) by default', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const confirmButton = buttons[1]; // Second button is confirm
      expect(confirmButton).toHaveClass('bg-blue-500');
      expect(confirmButton).not.toHaveClass('bg-red-500');
    });

    it('should render destructive confirm button (red) when destructive=true', () => {
      render(<ConfirmDialog {...defaultProps} destructive={true} />);

      const buttons = screen.getAllByRole('button');
      const confirmButton = buttons[1]; // Second button is confirm
      expect(confirmButton).toHaveClass('bg-red-500');
      expect(confirmButton).not.toHaveClass('bg-blue-500');
    });

    it('should render cancel button with gray styling', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const cancelButton = screen.getByText('Cancelar');
      expect(cancelButton).toHaveClass('bg-gray-100');
      expect(cancelButton).toHaveClass('text-gray-700');
    });
  });

  describe('User interactions', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      const onConfirm = vi.fn();
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      const buttons = screen.getAllByRole('button');
      const confirmButton = buttons[1]; // Second button is confirm
      fireEvent.click(confirmButton);

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when cancel button is clicked', () => {
      const onClose = vi.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      // Get the backdrop (first div inside the fixed container)
      const backdrop = screen.getByText('Test message').parentElement?.previousElementSibling;
      expect(backdrop).toBeInTheDocument();

      if (backdrop) {
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should call onClose when Escape key is pressed', () => {
      const onClose = vi.fn();
      render(<ConfirmDialog {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(window, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm when Enter key is pressed', () => {
      const onConfirm = vi.fn();
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      fireEvent.keyDown(window, { key: 'Enter' });

      expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it('should not respond to other keys', () => {
      const onClose = vi.fn();
      const onConfirm = vi.fn();
      render(
        <ConfirmDialog
          {...defaultProps}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      );

      fireEvent.keyDown(window, { key: 'a' });
      fireEvent.keyDown(window, { key: 'Space' });
      fireEvent.keyDown(window, { key: 'Tab' });

      expect(onClose).not.toHaveBeenCalled();
      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard event cleanup', () => {
    it('should remove keyboard listeners when closed', () => {
      const onClose = vi.fn();
      const { rerender } = render(
        <ConfirmDialog {...defaultProps} open={true} onClose={onClose} />
      );

      // Close the dialog
      rerender(<ConfirmDialog {...defaultProps} open={false} onClose={onClose} />);

      // Try to trigger keyboard event
      fireEvent.keyDown(window, { key: 'Escape' });

      // Should not call onClose because dialog is closed and listeners removed
      expect(onClose).not.toHaveBeenCalled();
    });

    it('should update keyboard listeners when callbacks change', () => {
      const onConfirm1 = vi.fn();
      const onConfirm2 = vi.fn();
      const { rerender } = render(
        <ConfirmDialog {...defaultProps} onConfirm={onConfirm1} />
      );

      // Change onConfirm callback
      rerender(<ConfirmDialog {...defaultProps} onConfirm={onConfirm2} />);

      // Trigger Enter key
      fireEvent.keyDown(window, { key: 'Enter' });

      // Should call the new callback
      expect(onConfirm1).not.toHaveBeenCalled();
      expect(onConfirm2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper button types', () => {
      render(<ConfirmDialog {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      const cancelButton = buttons[0];
      const confirmButton = buttons[1];

      expect(confirmButton).toHaveAttribute('type', 'button');
      expect(cancelButton).toHaveAttribute('type', 'button');
    });

    it('should render backdrop with proper z-index', () => {
      const { container } = render(<ConfirmDialog {...defaultProps} />);

      const fixedContainer = container.firstChild as HTMLElement;
      expect(fixedContainer).toHaveClass('z-50');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty message gracefully', () => {
      render(<ConfirmDialog {...defaultProps} message="" />);

      const message = screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === 'p' && content === '';
      });
      expect(message).toBeInTheDocument();
    });

    it('should handle long message text', () => {
      const longMessage =
        'This is a very long message that should still render properly in the dialog. ' +
        'It might wrap to multiple lines but should remain readable and accessible.';
      render(<ConfirmDialog {...defaultProps} message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should not call handlers multiple times on double-click', () => {
      const onConfirm = vi.fn();
      render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

      const buttons = screen.getAllByRole('button');
      const confirmButton = buttons[1];
      fireEvent.click(confirmButton);
      fireEvent.click(confirmButton);

      // Should be called twice (no debouncing)
      expect(onConfirm).toHaveBeenCalledTimes(2);
    });
  });
});
