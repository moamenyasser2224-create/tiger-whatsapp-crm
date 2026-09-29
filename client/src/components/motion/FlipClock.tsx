import React, { useState, useEffect } from 'react';
import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion';

interface FlipClockProps {
  className?: string;
}

const FlipDigit: React.FC<{ value: string; label: string }> = ({ value, label }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-14 h-16 sm:w-16 sm:h-20 bg-black dark:bg-white text-white dark:text-black rounded-lg border border-neutral-800 dark:border-neutral-200 flex items-center justify-center overflow-hidden shadow-md">
        <AnimatePresence mode="popLayout" initial={false}>
          <m.span
            key={value}
            initial={{ y: -24, opacity: 0, rotateX: 45 }}
            animate={{ y: 0, opacity: 1, rotateX: 0 }}
            exit={{ y: 24, opacity: 0, rotateX: -45 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1.0] }}
            className="font-mono text-2xl sm:text-3xl font-black tracking-widest block"
          >
            {value}
          </m.span>
        </AnimatePresence>
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-neutral-800 dark:bg-neutral-300 opacity-50 pointer-events-none" />
      </div>
      <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 mt-1 uppercase">
        {label}
      </span>
    </div>
  );
};

export const FlipClock: React.FC<FlipClockProps> = ({ className = '' }) => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');
  const seconds = String(time.getSeconds()).padStart(2, '0');

  return (
    <LazyMotion features={domAnimation}>
      <div className={`flex items-center gap-2 sm:gap-3 ${className}`} dir="ltr">
        <FlipDigit value={hours} label="Hours" />
        <span className="text-xl font-black text-neutral-400 dark:text-neutral-600 mb-4 animate-pulse">:</span>
        <FlipDigit value={minutes} label="Mins" />
        <span className="text-xl font-black text-neutral-400 dark:text-neutral-600 mb-4 animate-pulse">:</span>
        <FlipDigit value={seconds} label="Secs" />
      </div>
    </LazyMotion>
  );
};
