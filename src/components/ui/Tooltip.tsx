import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  shortcut?: string;
  children: React.ReactElement;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  shortcut,
  children,
  side = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[side];

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          className={`absolute ${sideClasses} z-50 pointer-events-none whitespace-nowrap rounded px-2 py-1 text-xs font-medium shadow-sm transition-opacity bg-neutral-900 text-neutral-100 dark:bg-neutral-100 dark:text-neutral-900 border border-neutral-700/40 dark:border-neutral-300/40`}
        >
          <span>{content}</span>
          {shortcut && (
            <kbd className="ml-1.5 px-1 py-0.5 text-[10px] rounded bg-neutral-800 text-neutral-300 dark:bg-neutral-200 dark:text-neutral-700 font-mono">
              {shortcut}
            </kbd>
          )}
        </div>
      )}
    </div>
  );
};
