import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChatPage } from '../ChatPage.js';
import { AuthProvider } from '../../contexts/AuthContext.js';
import { ThemeProvider } from '../../contexts/ThemeContext.js';
import { SocketProvider } from '../../contexts/SocketContext.js';

vi.mock('../../lib/api.js', () => ({
  api: {
    get: vi.fn((url: string) => {
      if (url.includes('/chat/messages')) {
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

describe('ChatPage Component', () => {
  it('renders team chat channel header, input area, and send button', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeProvider>
            <AuthProvider>
              <SocketProvider>
                <ChatPage />
              </SocketProvider>
            </AuthProvider>
          </ThemeProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );

    expect(screen.getAllByText(/General Workspace/i).length).toBeGreaterThan(0);
    expect(
      screen.getByPlaceholderText(/Write a message/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Send Message/i)).toBeInTheDocument();
  });
});
