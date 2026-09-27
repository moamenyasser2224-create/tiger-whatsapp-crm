import React from 'react';
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { pageVariants } from '../../theme/tokens.js';

interface MotionPageProps {
  children: React.ReactNode;
  className?: string;
}

export const MotionPage: React.FC<MotionPageProps> = ({ children, className = '' }) => {
  const shouldReduceMotion = useReducedMotion();

  const activeVariants = shouldReduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.15 } },
        exit: { opacity: 0, transition: { duration: 0.1 } },
      }
    : pageVariants;

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        variants={activeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className={`w-full ${className}`}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
};
