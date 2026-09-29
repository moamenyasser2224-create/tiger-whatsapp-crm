import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage.js';
import { AuthProvider } from '../../contexts/AuthContext.js';
import { ThemeProvider } from '../../contexts/ThemeContext.js';

describe('LoginPage Component', () => {
  it('renders login form with email, password fields and submit button', () => {
    render(
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In to Account/i })).toBeInTheDocument();
  });
});
