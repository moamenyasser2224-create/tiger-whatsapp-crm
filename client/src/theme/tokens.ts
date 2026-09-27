/**
 * TIGER WORKSPACE CRM - CENTRAL DESIGN TOKENS & MOTION SYSTEM
 * Strict Monochrome SaaS Palette (Linear / Vercel style)
 * 100% Black & White with subtle neutral grays, 1px borders, smooth shadows, and WCAG AA contrast.
 */

export const tokens = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
  radius: {
    none: '0px',
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '20px',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.08)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  },
  typography: {
    fontFamily: '"Cairo", "IBM Plex Sans Arabic", -apple-system, BlinkMacSystemFont, sans-serif',
    weights: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 900,
    },
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',      // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem',// 30px
    },
  },
  motion: {
    durations: {
      fast: 0.15, // 150ms
      base: 0.25, // 250ms
      slow: 0.4,  // 400ms
    },
    easing: [0.25, 0.1, 0.25, 1.0] as [number, number, number, number],
    spring: {
      gentle: { type: 'spring', stiffness: 300, damping: 25 },
      bouncy: { type: 'spring', stiffness: 400, damping: 15 },
      stiff: { type: 'spring', stiffness: 500, damping: 30 },
    },
  },
} as const;

/**
 * Standard Framer Motion variants for consistent, smooth transitions
 * All animated properties use transform and opacity only (60fps guaranteed)
 */
export const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: tokens.motion.durations.base,
      ease: tokens.motion.easing,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: tokens.motion.durations.fast,
      ease: tokens.motion.easing,
    },
  },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: tokens.motion.durations.base,
      ease: tokens.motion.easing,
    },
  },
};

export const modalVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: tokens.motion.spring.gentle,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: { duration: tokens.motion.durations.fast, ease: tokens.motion.easing },
  },
};

export const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: tokens.motion.durations.base } },
  exit: { opacity: 0, transition: { duration: tokens.motion.durations.fast } },
};
