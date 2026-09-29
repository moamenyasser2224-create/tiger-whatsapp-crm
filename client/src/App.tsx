import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext.js';
import { ThemeProvider } from './contexts/ThemeContext.js';
import { SocketProvider } from './contexts/SocketContext.js';
import { LedgerLayout } from './components/common/LedgerLayout.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { ToastProvider } from './components/motion/Toast.js';

// Lazy-loaded pages for lightning-fast initial load
const PromotCompanyPage = lazy(() =>
  import('./pages/PromotCompanyPage.js').then((m) => ({ default: m.PromotCompanyPage }))
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage.js').then((m) => ({ default: m.LoginPage }))
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage.js').then((m) => ({ default: m.RegisterPage }))
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage.js').then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage.js').then((m) => ({ default: m.ResetPasswordPage }))
);
const VerifyPayslipPage = lazy(() =>
  import('./pages/VerifyPayslipPage.js').then((m) => ({ default: m.VerifyPayslipPage }))
);

const DashboardPage = lazy(() =>
  import('./pages/DashboardPage.js').then((m) => ({ default: m.DashboardPage }))
);
const CustomersPage = lazy(() =>
  import('./pages/CustomersPage.js').then((m) => ({ default: m.CustomersPage }))
);
const AttendancePage = lazy(() =>
  import('./pages/AttendancePage.js').then((m) => ({ default: m.AttendancePage }))
);
const DeductionsPage = lazy(() =>
  import('./pages/DeductionsPage.js').then((m) => ({ default: m.DeductionsPage }))
);
const ChatPage = lazy(() =>
  import('./pages/ChatPage.js').then((m) => ({ default: m.ChatPage }))
);
const TemplatesPage = lazy(() =>
  import('./pages/TemplatesPage.js').then((m) => ({ default: m.TemplatesPage }))
);
const DesignLabPage = lazy(() =>
  import('./pages/DesignLabPage.js').then((m) => ({ default: m.DesignLabPage }))
);
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage.js').then((m) => ({ default: m.SettingsPage }))
);

const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center space-y-4">
    <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    <span className="text-xs uppercase tracking-widest text-neutral-400 font-mono">Tiger Loading...</span>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    {/* Public Corporate Promot-Automation Style Showcase with Videos */}
                    <Route path="/" element={<PromotCompanyPage />} />
                    <Route path="/company" element={<PromotCompanyPage />} />
                    <Route path="/about" element={<PromotCompanyPage />} />

                    {/* Public Auth & Verification Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/verify-payslip" element={<VerifyPayslipPage />} />

                    {/* Protected App Routes with Company Ledger Layout */}
                    <Route element={<ProtectedRoute />}>
                      <Route element={<LedgerLayout />}>
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/customers" element={<CustomersPage />} />
                        <Route path="/attendance" element={<AttendancePage />} />
                        <Route path="/deductions" element={<DeductionsPage />} />
                        <Route path="/chat" element={<ChatPage />} />
                        <Route path="/templates" element={<TemplatesPage />} />
                        <Route path="/design-lab" element={<DesignLabPage />} />
                        <Route path="/settings" element={<SettingsPage />} />
                      </Route>
                    </Route>

                    {/* Catch-all */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
