import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import DatePicker from './DatePicker';

describe('DatePicker', () => {
  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    value: '2024-03-15',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  describe('Rendering', () => {
    it('should not render when open is false', () => {
      render(<DatePicker {...defaultProps} open={false} />);

      expect(screen.queryByText('Seleccionar fecha')).not.toBeInTheDocument();
    });

    it('should render when open is true', () => {
      render(<DatePicker {...defaultProps} />);

      expect(screen.getByText('Seleccionar fecha')).toBeInTheDocument();
    });

    it('should display formatted selected date in Spanish', () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      // Should show "Vie, Mar 15" format
      const headerText = screen.getByRole('heading', { level: 2 });
      expect(headerText.textContent).toMatch(/mar/i);
      expect(headerText.textContent).toContain('15');
    });

    it('should display current month and year', () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      expect(screen.getByText(/Marzo 2024/i)).toBeInTheDocument();
    });

    it('should render calendar grid with days of week headers', () => {
      render(<DatePicker {...defaultProps} />);

      // Spanish day abbreviations
      expect(screen.getByText('D')).toBeInTheDocument(); // Domingo
      expect(screen.getByText('L')).toBeInTheDocument(); // Lunes
      expect(screen.getByText('S')).toBeInTheDocument(); // Sábado
    });

    it('should render all action buttons', () => {
      render(<DatePicker {...defaultProps} />);

      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    it('should highlight selected date', () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      const dayButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '15');
      const selectedDay = dayButtons.find(btn => btn.className.includes('bg-emerald-500'));
      expect(selectedDay).toBeInTheDocument();
    });

    it('should use current date when value is empty', () => {
      const today = new Date();
      render(<DatePicker {...defaultProps} value="" />);

      const currentMonth = today.toLocaleString('es-CO', { month: 'long' });
      const currentYear = today.getFullYear();
      expect(screen.getByText(new RegExp(`${currentMonth} ${currentYear}`, 'i'))).toBeInTheDocument();
    });
  });

  describe('Month Navigation', () => {
    it('should navigate to previous month', async () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      await waitFor(() => {
        expect(screen.getByText(/marzo 2024/i)).toBeInTheDocument();
      });

      // Find prev month button - it's in a separate div after the month/year button
      const allButtons = screen.getAllByRole('button');
      const prevButton = allButtons.find(btn => {
        const icon = btn.querySelector('.lucide-chevron-left');
        // Make sure it's NOT the month/year toggle button (which contains text)
        return icon && !btn.textContent?.match(/202\d/);
      });

      if (prevButton) fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText(/febrero 2024/i)).toBeInTheDocument();
      });
    });

    it('should navigate to next month', () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      expect(screen.getByText(/Marzo 2024/i)).toBeInTheDocument();

      const nextButton = screen.getAllByRole('button').find(
        btn => btn.querySelector('.lucide-chevron-right')
      );
      if (nextButton) fireEvent.click(nextButton);

      expect(screen.getByText(/Abril 2024/i)).toBeInTheDocument();
    });

    it('should wrap year when navigating from January to December', async () => {
      render(<DatePicker {...defaultProps} value="2024-01-15" />);

      await waitFor(() => {
        expect(screen.getByText(/enero 2024/i)).toBeInTheDocument();
      });

      // Find prev month button
      const allButtons = screen.getAllByRole('button');
      const prevButton = allButtons.find(btn => {
        const icon = btn.querySelector('.lucide-chevron-left');
        return icon && !btn.textContent?.match(/202\d/);
      });

      if (prevButton) fireEvent.click(prevButton);

      await waitFor(() => {
        expect(screen.getByText(/diciembre 2023/i)).toBeInTheDocument();
      });
    });

    it('should wrap year when navigating from December to January', () => {
      render(<DatePicker {...defaultProps} value="2024-12-15" />);

      expect(screen.getByText(/Diciembre 2024/i)).toBeInTheDocument();

      const nextButton = screen.getAllByRole('button').find(
        btn => btn.querySelector('.lucide-chevron-right')
      );
      if (nextButton) fireEvent.click(nextButton);

      expect(screen.getByText(/Enero 2025/i)).toBeInTheDocument();
    });

    it('should hide month navigation buttons when year picker is open', async () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      await waitFor(() => {
        expect(screen.getByText(/marzo 2024/i)).toBeInTheDocument();
      });

      // Open year picker by clicking the month/year button
      const monthYearButton = screen.getByText(/marzo 2024/i);
      fireEvent.click(monthYearButton);

      await waitFor(() => {
        // When year picker is open, month navigation buttons should not be visible
        const buttons = screen.getAllByRole('button');
        const navButtons = buttons.filter(btn => {
          const icon = btn.querySelector('.lucide-chevron-left, .lucide-chevron-right');
          return icon && !btn.textContent?.match(/202\d/);
        });
        expect(navButtons.length).toBe(0);
      });
    });
  });

  describe('Day Selection', () => {
    it('should update selected date when clicking a day', () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      // Click on day 20
      const dayButtons = screen.getAllByRole('button').filter(btn => btn.textContent === '20');
      const dayButton = dayButtons.find(btn => !btn.className.includes('bg-emerald-500'));
      if (dayButton) fireEvent.click(dayButton);

      // Header should update to show new date
      const headerText = screen.getByRole('heading', { level: 2 });
      expect(headerText.textContent).toContain('20');
    });

    it('should handle clicking different days in sequence', () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      // Click day 10
      const day10 = screen.getAllByRole('button').find(
        btn => btn.textContent === '10' && btn.className.includes('rounded-full')
      );
      if (day10) fireEvent.click(day10);

      // Click day 25
      const day25 = screen.getAllByRole('button').find(
        btn => btn.textContent === '25' && btn.className.includes('rounded-full')
      );
      if (day25) fireEvent.click(day25);

      const headerText = screen.getByRole('heading', { level: 2 });
      expect(headerText.textContent).toContain('25');
    });

    it('should maintain selection when navigating months', () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      // Click day 20
      const day20 = screen.getAllByRole('button').find(
        btn => btn.textContent === '20' && btn.className.includes('rounded-full')
      );
      if (day20) fireEvent.click(day20);

      // Navigate to next month
      const nextButton = screen.getAllByRole('button').find(
        btn => btn.querySelector('.lucide-chevron-right')
      );
      if (nextButton) fireEvent.click(nextButton);

      // Selected date should still be March 20
      const headerText = screen.getByRole('heading', { level: 2 });
      expect(headerText.textContent).toMatch(/mar/i);
      expect(headerText.textContent).toContain('20');
    });
  });

  describe('Year Picker', () => {
    it('should toggle year picker when clicking month/year button', () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      const monthYearButton = screen.getByText(/Marzo 2024/i);
      fireEvent.click(monthYearButton);

      // Should show year grid
      expect(screen.getByText('2024')).toBeInTheDocument();
      expect(screen.getByText('2023')).toBeInTheDocument();
      expect(screen.getByText('2025')).toBeInTheDocument();
    });

    it('should close year picker when clicking month/year button again', () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      const monthYearButton = screen.getByText(/Marzo 2024/i);

      // Open
      fireEvent.click(monthYearButton);
      expect(screen.getByText('2023')).toBeInTheDocument();

      // Close
      fireEvent.click(monthYearButton);

      // Year grid should be hidden (calendar grid should be visible)
      const dayHeaders = screen.queryAllByText('D');
      expect(dayHeaders.length).toBeGreaterThan(0);
    });

    it('should select year and close year picker', () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      const monthYearButton = screen.getByText(/Marzo 2024/i);
      fireEvent.click(monthYearButton);

      // Click on 2023
      const year2023Button = screen.getByText('2023');
      fireEvent.click(year2023Button);

      // Should show Marzo 2023 and close year picker
      expect(screen.getByText(/Marzo 2023/i)).toBeInTheDocument();

      // Calendar grid should be visible again
      const dayHeaders = screen.queryAllByText('D');
      expect(dayHeaders.length).toBeGreaterThan(0);
    });

    it('should highlight selected year in year picker', () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      const monthYearButton = screen.getByText(/Marzo 2024/i);
      fireEvent.click(monthYearButton);

      const year2024Button = screen.getByText('2024');
      expect(year2024Button.className).toContain('bg-emerald-500');
    });

    it('should display range of years around current year', () => {
      const today = new Date();
      render(<DatePicker {...defaultProps} value="" />);

      const monthYearButton = screen.getAllByRole('button').find(
        btn => btn.textContent?.includes(today.getFullYear().toString())
      );
      if (monthYearButton) fireEvent.click(monthYearButton);

      // Should show current year and years around it (12 before, 11 after)
      const currentYear = today.getFullYear();
      expect(screen.getByText((currentYear - 12).toString())).toBeInTheDocument();
      expect(screen.getByText((currentYear + 11).toString())).toBeInTheDocument();
    });
  });

  describe('Confirm and Cancel Actions', () => {
    it('should call onChange with formatted date when OK is clicked', () => {
      const onChange = vi.fn();
      render(<DatePicker {...defaultProps} onChange={onChange} value="2024-03-15" />);

      // Click day 20
      const day20 = screen.getAllByRole('button').find(
        btn => btn.textContent === '20' && btn.className.includes('rounded-full')
      );
      if (day20) fireEvent.click(day20);

      // Click OK
      const okButton = screen.getByText('OK');
      fireEvent.click(okButton);

      expect(onChange).toHaveBeenCalledWith('2024-03-20');
    });

    it('should call onClose when OK is clicked', () => {
      const onClose = vi.fn();
      render(<DatePicker {...defaultProps} onClose={onClose} />);

      const okButton = screen.getByText('OK');
      fireEvent.click(okButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Cancel is clicked', () => {
      const onClose = vi.fn();
      render(<DatePicker {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onChange when Cancel is clicked', () => {
      const onChange = vi.fn();
      render(<DatePicker {...defaultProps} onChange={onChange} />);

      // Change selection
      const day20 = screen.getAllByRole('button').find(
        btn => btn.textContent === '20' && btn.className.includes('rounded-full')
      );
      if (day20) fireEvent.click(day20);

      // Click Cancel
      const cancelButton = screen.getByText('Cancelar');
      fireEvent.click(cancelButton);

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should call onClose when backdrop is clicked', () => {
      const onClose = vi.fn();
      render(<DatePicker {...defaultProps} onClose={onClose} />);

      // Find backdrop (button with aria-label="Cerrar")
      const backdrop = screen.getByLabelText('Cerrar');
      fireEvent.click(backdrop);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should format date with padded zeros for single digit day', () => {
      const onChange = vi.fn();
      render(<DatePicker {...defaultProps} onChange={onChange} value="2024-03-15" />);

      // Click day 5
      const day5 = screen.getAllByRole('button').find(
        btn => btn.textContent === '5' && btn.className.includes('rounded-full')
      );
      if (day5) fireEvent.click(day5);

      const okButton = screen.getByText('OK');
      fireEvent.click(okButton);

      expect(onChange).toHaveBeenCalledWith('2024-03-05');
    });

    it('should format date with padded zeros for single digit month', () => {
      const onChange = vi.fn();
      render(<DatePicker {...defaultProps} onChange={onChange} value="2024-01-15" />);

      const okButton = screen.getByText('OK');
      fireEvent.click(okButton);

      expect(onChange).toHaveBeenCalledWith('2024-01-15');
    });
  });

  describe('Date Formatting', () => {
    it('should format date in Spanish locale', () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      const headerText = screen.getByRole('heading', { level: 2 });
      expect(headerText.textContent).toMatch(/vie|sáb|dom|lun|mar|mié|jue/i);
    });

    it('should display abbreviated month names', () => {
      render(<DatePicker {...defaultProps} value="2024-03-15" />);

      const headerText = screen.getByRole('heading', { level: 2 });
      expect(headerText.textContent).toMatch(/ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic/i);
    });

    it('should format different dates correctly', () => {
      const { rerender } = render(<DatePicker {...defaultProps} value="2024-01-01" />);
      let headerText = screen.getByRole('heading', { level: 2 });
      expect(headerText.textContent).toContain('1');

      rerender(<DatePicker {...defaultProps} value="2024-12-31" />);
      headerText = screen.getByRole('heading', { level: 2 });
      expect(headerText.textContent).toContain('31');
    });
  });

  describe('Edge Cases', () => {
    it('should handle leap year February correctly', () => {
      render(<DatePicker {...defaultProps} value="2024-02-15" />);

      expect(screen.getByText(/Febrero 2024/i)).toBeInTheDocument();

      // Leap year has 29 days
      const day29 = screen.getAllByRole('button').find(
        btn => btn.textContent === '29' && btn.className.includes('rounded-full')
      );
      expect(day29).toBeInTheDocument();
    });

    it('should handle non-leap year February correctly', () => {
      render(<DatePicker {...defaultProps} value="2023-02-15" />);

      expect(screen.getByText(/Febrero 2023/i)).toBeInTheDocument();

      // Non-leap year has only 28 days
      const day29 = screen.queryAllByRole('button').find(
        btn => btn.textContent === '29' && btn.className.includes('rounded-full')
      );
      expect(day29).toBeUndefined();
    });

    it('should handle months with 30 days', () => {
      render(<DatePicker {...defaultProps} value="2024-04-15" />);

      expect(screen.getByText(/Abril 2024/i)).toBeInTheDocument();

      // April has 30 days
      const day30 = screen.getAllByRole('button').find(
        btn => btn.textContent === '30' && btn.className.includes('rounded-full')
      );
      expect(day30).toBeInTheDocument();

      const day31 = screen.queryAllByRole('button').find(
        btn => btn.textContent === '31' && btn.className.includes('rounded-full')
      );
      expect(day31).toBeUndefined();
    });

    it('should handle months with 31 days', () => {
      render(<DatePicker {...defaultProps} value="2024-01-15" />);

      expect(screen.getByText(/Enero 2024/i)).toBeInTheDocument();

      const day31 = screen.getAllByRole('button').find(
        btn => btn.textContent === '31' && btn.className.includes('rounded-full')
      );
      expect(day31).toBeInTheDocument();
    });

    it('should reset to initial date when reopened', () => {
      const { rerender } = render(<DatePicker {...defaultProps} value="2024-03-15" />);

      // Change to day 20
      const day20 = screen.getAllByRole('button').find(
        btn => btn.textContent === '20' && btn.className.includes('rounded-full')
      );
      if (day20) fireEvent.click(day20);

      // Close
      rerender(<DatePicker {...defaultProps} open={false} value="2024-03-15" />);

      // Reopen
      rerender(<DatePicker {...defaultProps} open={true} value="2024-03-15" />);

      // Should reset to 15
      const headerText = screen.getByRole('heading', { level: 2 });
      expect(headerText.textContent).toContain('15');
    });

    it('should close year picker when reopened', () => {
      const { rerender } = render(<DatePicker {...defaultProps} value="2024-03-15" />);

      // Open year picker
      const monthYearButton = screen.getByText(/Marzo 2024/i);
      fireEvent.click(monthYearButton);

      // Close dialog
      rerender(<DatePicker {...defaultProps} open={false} value="2024-03-15" />);

      // Reopen
      rerender(<DatePicker {...defaultProps} open={true} value="2024-03-15" />);

      // Year picker should be closed (calendar grid visible)
      const dayHeaders = screen.queryAllByText('D');
      expect(dayHeaders.length).toBeGreaterThan(0);
    });
  });

  describe('Body Scroll Locking', () => {
    it('should lock body scroll when open', () => {
      render(<DatePicker {...defaultProps} open={true} />);

      expect(document.body.style.overflow).toBe('hidden');
    });

    it('should unlock body scroll when closed', () => {
      const { rerender } = render(<DatePicker {...defaultProps} open={true} />);
      expect(document.body.style.overflow).toBe('hidden');

      rerender(<DatePicker {...defaultProps} open={false} />);

      // Wait for cleanup
      waitFor(() => {
        expect(document.body.style.overflow).toBe('');
      });
    });

    it('should restore body scroll on unmount', () => {
      const { unmount } = render(<DatePicker {...defaultProps} open={true} />);
      expect(document.body.style.overflow).toBe('hidden');

      unmount();
      expect(document.body.style.overflow).toBe('');
    });
  });

  describe('Accessibility', () => {
    it('should have proper button types', () => {
      render(<DatePicker {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('type', 'button');
      });
    });

    it('should have aria-label on backdrop', () => {
      render(<DatePicker {...defaultProps} />);

      const backdrop = screen.getByLabelText('Cerrar');
      expect(backdrop).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(<DatePicker {...defaultProps} />);

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
    });

    it('should have proper z-index for overlay', () => {
      const { container } = render(<DatePicker {...defaultProps} />);

      const overlay = container.firstChild as HTMLElement;
      expect(overlay).toHaveClass('z-[80]');
    });
  });
});
