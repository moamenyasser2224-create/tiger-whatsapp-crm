import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api.js';
import { useTheme } from '../../contexts/ThemeContext.js';
import { LedgerIcon } from '../icons/LedgerIcons.js';
import { matchesArabicSearch, getStatusLabel } from '../../lib/utils.js';
import type { Customer } from '../../types/index.js';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenShortcuts?: () => void;
}

interface PaletteAction {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  icon: any;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenShortcuts,
}) => {
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch customers for search
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ['customers', 'all-palette'],
    queryFn: async () => {
      const res = await api.get('/customers?limit=60');
      return res.data.data?.items || [];
    },
    enabled: isOpen,
    staleTime: 60000,
  });

  // Base Quick Actions
  const staticActions: PaletteAction[] = [
    {
      id: 'action-attendance',
      category: 'Quick Actions',
      title: 'Time Clock & Punch Card',
      subtitle: 'Stamp clock in or clock out for today',
      icon: 'punch-card',
      action: () => {
        navigate('/attendance');
        onClose();
      },
    },
    {
      id: 'action-add-customer',
      category: 'Quick Actions',
      title: 'Create New Customer Record',
      subtitle: 'Open customers ledger and add entry',
      icon: 'plus',
      action: () => {
        navigate('/customers');
        onClose();
      },
    },
    {
      id: 'action-payroll',
      category: 'Quick Actions',
      title: 'Payroll, Deductions & Slips',
      subtitle: 'Review monthly payslips and wage breakdown',
      icon: 'receipt',
      action: () => {
        navigate('/deductions');
        onClose();
      },
    },
    {
      id: 'action-chat',
      category: 'Quick Actions',
      title: 'Open Team Chat',
      subtitle: 'Instant channels and direct workplace messaging',
      icon: 'chat',
      action: () => {
        navigate('/chat');
        onClose();
      },
    },
    {
      id: 'action-company',
      category: 'Navigation',
      title: 'Tiger Company Profile & Videos',
      subtitle: 'Industrial showcase, Flow video, and partner network',
      icon: 'building',
      action: () => {
        navigate('/');
        onClose();
      },
    },
    {
      id: 'action-theme',
      category: 'Display',
      title: 'Toggle Color Theme (Dark / Light)',
      subtitle: 'Switch interface contrast modes',
      icon: 'eye',
      action: () => {
        toggleTheme();
        onClose();
      },
    },
    {
      id: 'action-shortcuts',
      category: 'Help',
      title: 'Keyboard Shortcuts Reference',
      subtitle: 'Inspect mechanical hotkeys [?]',
      icon: 'help',
      action: () => {
        onClose();
        if (onOpenShortcuts) onOpenShortcuts();
      },
    },
  ];

  // Dynamic Customer Search Results
  const customerActions: PaletteAction[] = customers.map((c) => ({
    id: `cust-${c.id}`,
    category: 'Customers',
    title: c.name,
    subtitle: `${c.company ? `${c.company} • ` : ''}${c.phone} • [${getStatusLabel(c.status)}]`,
    icon: 'users',
    action: () => {
      navigate('/customers');
      onClose();
    },
  }));

  const allItems = [...staticActions, ...customerActions];

  // Filter
  const filteredItems = allItems.filter((item) => {
    if (!query.trim()) return true;
    return (
      matchesArabicSearch(item.title, query) ||
      matchesArabicSearch(item.subtitle || '', query) ||
      matchesArabicSearch(item.category, query)
    );
  });

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredItems.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-diagonal-hatch bg-black/60"
      onClick={onClose}
      dir="ltr"
    >
      <div
        className="w-full max-w-xl border-2 border-neutral-900 dark:border-white bg-[#ffffff] dark:bg-[#121212] shadow-solid flex flex-col font-sans overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 border-b-2 border-neutral-900 dark:border-white px-4 py-3 bg-[#faf9f5] dark:bg-[#181818]">
          <LedgerIcon name="search" size={18} className="text-neutral-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, customer records, time clock, or hotkeys..."
            className="w-full bg-transparent text-sm font-bold text-neutral-950 dark:text-white outline-none placeholder:text-neutral-400 placeholder:font-normal"
          />
          <span className="text-[10px] font-mono border border-neutral-400 dark:border-neutral-600 px-1.5 py-0.5 text-neutral-500">
            ESC to close
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800 p-2">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-neutral-500">
              No matching records or actions found for "{query}".
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-2.5 cursor-pointer text-xs select-none transition-colors ${
                    isSelected
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-black font-bold'
                      : 'text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LedgerIcon name={item.icon} size={16} />
                    <div>
                      <div className="font-bold">{item.title}</div>
                      {item.subtitle && (
                        <div
                          className={`text-[11px] font-mono mt-0.5 ${
                            isSelected ? 'opacity-80' : 'text-neutral-500 dark:text-neutral-400'
                          }`}
                        >
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono border px-1.5 py-0.5 ${
                      isSelected
                        ? 'border-white text-white dark:border-black dark:text-black'
                        : 'border-neutral-300 dark:border-neutral-700 text-neutral-500'
                    }`}
                  >
                    {item.category}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="border-t-2 border-neutral-900 dark:border-white px-3 py-2 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-between text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>Tiger Quick Command Engine</span>
        </div>
      </div>
    </div>
  );
};
