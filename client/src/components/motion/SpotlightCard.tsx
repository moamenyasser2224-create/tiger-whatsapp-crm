import React, { useRef, useState } from 'react';
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = '',
  onClick,
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || shouldReduceMotion) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => {
    if (!shouldReduceMotion) setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        ref={divRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={onClick}
        whileHover={shouldReduceMotion ? {} : { y: -2 }}
        transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1.0] }}
        className={`relative overflow-hidden rounded-2xl border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-shadow hover:shadow-lg dark:hover:shadow-neutral-950/40 ${className}`}
      >
        {/* Subtle radial spotlight overlay */}
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            opacity,
            background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(120, 120, 120, 0.08), transparent 80%)`,
          }}
        />
        {children}
      </m.div>
    </LazyMotion>
  );
};
