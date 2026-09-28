import React, { useState, useEffect } from 'react';

interface DigitProps {
  digit: string;
}

const RollingDigit: React.FC<DigitProps> = ({ digit }) => {
  return (
    <span className="inline-block relative overflow-hidden h-[1.3em] w-[0.62em] align-middle text-center tabular-nums">
      <span
        className="block transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(-${parseInt(digit, 10) * 10}%)`,
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <span key={n} className="block h-[1.3em] leading-[1.3em]">
            {n}
          </span>
        ))}
      </span>
    </span>
  );
};

export const OdometerClock: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const hours = pad(time.getHours());
  const minutes = pad(time.getMinutes());
  const seconds = pad(time.getSeconds());

  return (
    <div
      className={`inline-flex items-center font-mono font-bold tracking-wider tabular-nums px-3 py-1 border-2 border-current bg-paper-sheet ${className}`}
      dir="ltr"
    >
      <RollingDigit digit={hours[0]} />
      <RollingDigit digit={hours[1]} />
      <span className="opacity-60 px-0.5 animate-pulse">:</span>
      <RollingDigit digit={minutes[0]} />
      <RollingDigit digit={minutes[1]} />
      <span className="opacity-60 px-0.5 animate-pulse">:</span>
      <RollingDigit digit={seconds[0]} />
      <RollingDigit digit={seconds[1]} />
    </div>
  );
};
