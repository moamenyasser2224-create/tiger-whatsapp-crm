import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DeductionsPage } from '../DeductionsPage.js';
import { AuthProvider } from '../../contexts/AuthContext.js';
import { ThemeProvider } from '../../contexts/ThemeContext.js';
import { ToastProvider } from '../../components/motion/Toast.js';

vi.mock('../../lib/api.js', () => ({
  api: {
    get: vi.fn((url: string) => {
      if (url.includes('/deductions/salary')) {
        return Promise.resolve({ data: { success: true, data: { monthlySalary: 5000, currency: 'SAR', dayWage: 166.67 } } });
      }
      if (url.includes('/deductions/my')) {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
      if (url.includes('/deductions/my-adjustments')) {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
      if (url.includes('/deductions/period-status')) {
        return Promise.resolve({ data: { success: true, data: { status: 'open' } } });
      }
      return Promise.resolve({ data: { success: true, data: null } });
    }),
    post: vi.fn(() => Promise.resolve({ data: { success: true } })),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
  getAccessToken: vi.fn(() => 'mock-token'),
  setAccessToken: vi.fn(),
}));

describe('DeductionsPage Component', () => {
  it('renders deductions page headers and summary cards', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <ToastProvider>
                <DeductionsPage />
              </ToastProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Payroll, Deductions & Slips')).toBeInTheDocument();
    expect(screen.getByText('Gross Base Salary')).toBeInTheDocument();
    expect(screen.getByText('Total Deductions & Lateness (-)')).toBeInTheDocument();
    expect(screen.getByText('Bonuses & Incentives (+)')).toBeInTheDocument();
    expect(screen.getByText('Net Payable Wage')).toBeInTheDocument();
  });
});
