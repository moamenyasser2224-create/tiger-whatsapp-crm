import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AttendancePage } from '../AttendancePage.js';
import { AuthProvider } from '../../contexts/AuthContext.js';
import { ThemeProvider } from '../../contexts/ThemeContext.js';
import { SocketProvider } from '../../contexts/SocketContext.js';
import { ToastProvider } from '../../components/motion/Toast.js';

vi.mock('../../lib/api.js', () => ({
  api: {
    get: vi.fn((url: string) => {
      if (url.includes('/attendance/my-status')) {
        return Promise.resolve({ data: { success: true, data: null } });
      }
      if (url.includes('/attendance/today')) {
        return Promise.resolve({ data: { success: true, data: [] } });
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

describe('AttendancePage Component', () => {
  it('renders attendance page title, check-in button, and team table', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <SocketProvider>
                <ToastProvider>
                  <AttendancePage />
                </ToastProvider>
              </SocketProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/نظام الحضور والانصراف/)).toBeInTheDocument();
    expect(screen.getByText('تسجيل حضور الآن')).toBeInTheDocument();
    expect(screen.getByText('تسجيل انصراف الآن')).toBeInTheDocument();
    expect(screen.getByText('حالة تواجد أعضاء الفريق اليوم (مباشر)')).toBeInTheDocument();
  });
});
