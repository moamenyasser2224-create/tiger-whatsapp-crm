import React from 'react';

export type LedgerIconName =
  | 'ledger-book'
  | 'users'
  | 'clock'
  | 'receipt'
  | 'chat'
  | 'dashboard'
  | 'template'
  | 'settings'
  | 'punch-card'
  | 'stamp'
  | 'plus'
  | 'check'
  | 'x'
  | 'search'
  | 'filter'
  | 'sort'
  | 'calendar'
  | 'printer'
  | 'download'
  | 'upload'
  | 'lock'
  | 'unlock'
  | 'eye'
  | 'eye-off'
  | 'trash'
  | 'edit'
  | 'bell'
  | 'paperclip'
  | 'qr-code'
  | 'arrow-right'
  | 'arrow-left'
  | 'chevron-down'
  | 'chevron-up'
  | 'phone'
  | 'briefcase'
  | 'alert-triangle'
  | 'shield'
  | 'kanban'
  | 'table'
  | 'cards'
  | 'timeline'
  | 'dollar'
  | 'camera'
  | 'sound-on'
  | 'sound-off'
  | 'help'
  | 'more-horizontal';

interface LedgerIconProps extends React.SVGProps<SVGSVGElement> {
  name: LedgerIconName;
  size?: number | string;
  className?: string;
}

/**
 * Hand-drawn 24px grid monochrome icons with 2px stroke and square caps/joints.
 * Strictly avoids third-party icons (Lucide, Heroicons, FontAwesome).
 */
export const LedgerIcon: React.FC<LedgerIconProps> = ({
  name,
  size = 20,
  className = '',
  ...props
}) => {
  const renderPath = () => {
    switch (name) {
      case 'ledger-book':
        return (
          <>
            <rect x="4" y="3" width="16" height="18" />
            <line x1="8" y1="3" x2="8" y2="21" />
            <line x1="12" y1="7" x2="16" y2="7" />
            <line x1="12" y1="11" x2="16" y2="11" />
            <line x1="12" y1="15" x2="16" y2="15" />
          </>
        );
      case 'users':
        return (
          <>
            <rect x="7" y="4" width="6" height="6" />
            <path d="M4 18v-2a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v2" />
            <rect x="15" y="4" width="5" height="5" />
            <path d="M17 13h1a3 3 0 0 1 3 3v2" />
          </>
        );
      case 'clock':
        return (
          <>
            <rect x="3" y="3" width="18" height="18" />
            <line x1="12" y1="7" x2="12" y2="12" />
            <line x1="12" y1="12" x2="16" y2="12" />
          </>
        );
      case 'receipt':
        return (
          <>
            <path d="M4 2v20l3-2 3 2 3-2 3 2 3-2 3 2V2H4z" />
            <line x1="8" y1="7" x2="16" y2="7" />
            <line x1="8" y1="11" x2="16" y2="11" />
            <line x1="8" y1="15" x2="13" y2="15" />
          </>
        );
      case 'chat':
        return (
          <>
            <polygon points="3 4 21 4 21 16 9 16 5 20 5 16 3 16 3 4" />
            <line x1="7" y1="9" x2="17" y2="9" />
            <line x1="7" y1="12" x2="13" y2="12" />
          </>
        );
      case 'dashboard':
        return (
          <>
            <rect x="3" y="3" width="8" height="8" />
            <rect x="13" y="3" width="8" height="5" />
            <rect x="13" y="11" width="8" height="10" />
            <rect x="3" y="14" width="8" height="7" />
          </>
        );
      case 'template':
        return (
          <>
            <rect x="4" y="3" width="16" height="18" />
            <line x1="8" y1="8" x2="16" y2="8" />
            <line x1="8" y1="12" x2="14" y2="12" />
            <rect x="8" y="15" width="4" height="2" />
          </>
        );
      case 'settings':
        return (
          <>
            <rect x="8" y="8" width="8" height="8" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
            <line x1="5" y1="5" x2="8" y2="8" />
            <line x1="16" y1="16" x2="19" y2="19" />
            <line x1="19" y1="5" x2="16" y2="8" />
            <line x1="8" y1="16" x2="5" y2="19" />
          </>
        );
      case 'punch-card':
        return (
          <>
            <path d="M4 3h16v18H4z" />
            <circle cx="7" cy="8" r="1.5" fill="currentColor" />
            <circle cx="7" cy="12" r="1.5" fill="currentColor" />
            <circle cx="7" cy="16" r="1.5" fill="currentColor" />
            <line x1="12" y1="8" x2="18" y2="8" />
            <line x1="12" y1="12" x2="18" y2="12" />
            <line x1="12" y1="16" x2="16" y2="16" />
          </>
        );
      case 'stamp':
        return (
          <>
            <rect x="8" y="3" width="8" height="5" />
            <line x1="12" y1="8" x2="12" y2="13" />
            <path d="M5 13h14v4H5z" />
            <line x1="3" y1="20" x2="21" y2="20" />
          </>
        );
      case 'plus':
        return (
          <>
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="4" y1="12" x2="20" y2="12" />
          </>
        );
      case 'check':
        return (
          <>
            <polyline points="4 12 9 17 20 6" />
          </>
        );
      case 'x':
        return (
          <>
            <line x1="5" y1="5" x2="19" y2="19" />
            <line x1="19" y1="5" x2="5" y2="19" />
          </>
        );
      case 'search':
        return (
          <>
            <rect x="4" y="4" width="11" height="11" />
            <line x1="13" y1="13" x2="20" y2="20" />
          </>
        );
      case 'filter':
        return (
          <>
            <polygon points="3 4 21 4 14 12 14 19 10 21 10 12 3 4" />
          </>
        );
      case 'sort':
        return (
          <>
            <line x1="6" y1="4" x2="6" y2="20" />
            <polyline points="3 8 6 4 9 8" />
            <line x1="18" y1="4" x2="18" y2="20" />
            <polyline points="15 16 18 20 21 16" />
          </>
        );
      case 'calendar':
        return (
          <>
            <rect x="3" y="4" width="18" height="17" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <rect x="7" y="12" width="2" height="2" />
            <rect x="11" y="12" width="2" height="2" />
            <rect x="15" y="12" width="2" height="2" />
            <rect x="7" y="15" width="2" height="2" />
            <rect x="11" y="15" width="2" height="2" />
          </>
        );
      case 'printer':
        return (
          <>
            <rect x="6" y="3" width="12" height="6" />
            <path d="M4 9h16v8H4z" />
            <rect x="6" y="14" width="12" height="7" />
            <line x1="8" y1="17" x2="14" y2="17" />
          </>
        );
      case 'download':
        return (
          <>
            <line x1="12" y1="4" x2="12" y2="16" />
            <polyline points="7 11 12 16 17 11" />
            <line x1="4" y1="20" x2="20" y2="20" />
          </>
        );
      case 'upload':
        return (
          <>
            <line x1="12" y1="16" x2="12" y2="4" />
            <polyline points="7 9 12 4 17 9" />
            <line x1="4" y1="20" x2="20" y2="20" />
          </>
        );
      case 'lock':
        return (
          <>
            <rect x="5" y="10" width="14" height="11" />
            <path d="M8 10V6a4 4 0 0 1 8 0v4" />
          </>
        );
      case 'unlock':
        return (
          <>
            <rect x="5" y="10" width="14" height="11" />
            <path d="M8 10V6a4 4 0 0 1 8 0" />
          </>
        );
      case 'eye':
        return (
          <>
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10 7-10-7z" />
            <rect x="10" y="10" width="4" height="4" />
          </>
        );
      case 'eye-off':
        return (
          <>
            <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10 7-10-7z" />
            <line x1="3" y1="3" x2="21" y2="21" />
          </>
        );
      case 'trash':
        return (
          <>
            <polyline points="3 6 5 6 21 6" />
            <path d="M6 6v14h12V6" />
            <line x1="10" y1="10" x2="10" y2="16" />
            <line x1="14" y1="10" x2="14" y2="16" />
          </>
        );
      case 'edit':
        return (
          <>
            <path d="M16 3l5 5L7 22H2v-5L16 3z" />
            <line x1="13" y1="6" x2="18" y2="11" />
          </>
        );
      case 'bell':
        return (
          <>
            <path d="M18 16v-6a6 6 0 0 0-12 0v6l-2 3h16l-2-3z" />
            <rect x="10" y="20" width="4" height="2" />
          </>
        );
      case 'paperclip':
        return (
          <>
            <path d="M16 7v9a4 4 0 0 1-8 0V5a2 2 0 0 1 4 0v10" />
          </>
        );
      case 'qr-code':
        return (
          <>
            <rect x="3" y="3" width="7" height="7" />
            <rect x="5" y="5" width="3" height="3" fill="currentColor" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="16" y="5" width="3" height="3" fill="currentColor" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="5" y="16" width="3" height="3" fill="currentColor" />
            <line x1="14" y1="14" x2="17" y2="14" />
            <line x1="14" y1="18" x2="14" y2="21" />
            <line x1="17" y1="18" x2="21" y2="18" />
            <line x1="20" y1="14" x2="20" y2="17" />
          </>
        );
      case 'arrow-right':
        return (
          <>
            <line x1="4" y1="12" x2="20" y2="12" />
            <polyline points="14 6 20 12 14 18" />
          </>
        );
      case 'arrow-left':
        return (
          <>
            <line x1="20" y1="12" x2="4" y2="12" />
            <polyline points="10 6 4 12 10 18" />
          </>
        );
      case 'chevron-down':
        return (
          <>
            <polyline points="6 9 12 15 18 9" />
          </>
        );
      case 'chevron-up':
        return (
          <>
            <polyline points="6 15 12 9 18 15" />
          </>
        );
      case 'phone':
        return (
          <>
            <path d="M4 3h6l2 4-3 2a12 12 0 0 0 6 6l2-3 4 2v6c-11 0-17-6-17-17z" />
          </>
        );
      case 'briefcase':
        return (
          <>
            <rect x="3" y="7" width="18" height="14" />
            <path d="M8 7V4h8v3" />
            <line x1="3" y1="12" x2="21" y2="12" />
          </>
        );
      case 'alert-triangle':
        return (
          <>
            <polygon points="12 3 22 21 2 21 12 3" />
            <line x1="12" y1="9" x2="12" y2="14" />
            <rect x="11" y="16" width="2" height="2" fill="currentColor" />
          </>
        );
      case 'shield':
        return (
          <>
            <path d="M12 2L4 5v7c0 6 8 10 8 10s8-4 8-10V5l-8-3z" />
            <line x1="12" y1="8" x2="12" y2="15" />
          </>
        );
      case 'kanban':
        return (
          <>
            <rect x="3" y="4" width="5" height="16" />
            <rect x="10" y="4" width="5" height="11" />
            <rect x="17" y="4" width="5" height="14" />
          </>
        );
      case 'table':
        return (
          <>
            <rect x="3" y="4" width="18" height="16" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="9" x2="9" y2="20" />
            <line x1="15" y1="9" x2="15" y2="20" />
          </>
        );
      case 'cards':
        return (
          <>
            <rect x="3" y="7" width="14" height="14" />
            <path d="M7 7V3h14v14h-4" />
          </>
        );
      case 'timeline':
        return (
          <>
            <line x1="6" y1="3" x2="6" y2="21" />
            <rect x="4" y="6" width="4" height="4" fill="currentColor" />
            <rect x="4" y="14" width="4" height="4" fill="currentColor" />
            <line x1="11" y1="8" x2="20" y2="8" />
            <line x1="11" y1="16" x2="20" y2="16" />
          </>
        );
      case 'dollar':
        return (
          <>
            <rect x="3" y="6" width="18" height="12" />
            <circle cx="12" cy="12" r="3" />
            <line x1="7" y1="12" x2="7" y2="12.01" />
            <line x1="17" y1="12" x2="17" y2="12.01" />
          </>
        );
      case 'camera':
        return (
          <>
            <path d="M4 7h4l2-3h4l2 3h4v13H4z" />
            <rect x="9" y="10" width="6" height="6" />
          </>
        );
      case 'sound-on':
        return (
          <>
            <polygon points="4 8 8 8 13 4 13 20 8 16 4 16 4 8" />
            <path d="M16 8a4 4 0 0 1 0 8" />
            <path d="M19 5a8 8 0 0 1 0 14" />
          </>
        );
      case 'sound-off':
        return (
          <>
            <polygon points="4 8 8 8 13 4 13 20 8 16 4 16 4 8" />
            <line x1="17" y1="9" x2="21" y2="13" />
            <line x1="21" y1="9" x2="17" y2="13" />
          </>
        );
      case 'help':
        return (
          <>
            <rect x="3" y="3" width="18" height="18" />
            <path d="M9 9a3 3 0 0 1 5.2 2c0 1.5-1.7 2-1.7 3" />
            <rect x="11.5" y="16" width="1" height="1" fill="currentColor" />
          </>
        );
      case 'more-horizontal':
        return (
          <>
            <circle cx="6" cy="12" r="1.5" fill="currentColor" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <circle cx="18" cy="12" r="1.5" fill="currentColor" />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={`shrink-0 inline-block align-middle ${className}`}
      {...props}
    >
      {renderPath()}
    </svg>
  );
};
