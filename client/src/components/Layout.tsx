import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar.js';
import { Sidebar } from './Sidebar.js';
import { ForceChangePasswordModal } from './ForceChangePasswordModal.js';
import { AnimatePresence } from 'framer-motion';

export const Layout: React.FC = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      <ForceChangePasswordModal />
      <Navbar />
      <div className="flex flex-1 w-full">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <React.Fragment key={location.pathname}>
              <Outlet />
            </React.Fragment>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};
