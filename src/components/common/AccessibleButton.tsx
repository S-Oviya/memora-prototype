import React from 'react';
import { audioService } from '../../services/audioService';

interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  children: React.ReactNode;
  enableSound?: boolean;
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  variant = 'primary',
  size = 'lg',
  icon,
  children,
  enableSound = true,
  className = '',
  onClick,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (enableSound) {
      audioService.playTapSound();
    }
    if (onClick) {
      onClick(e);
    }
  };

  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-wide rounded-2xl transition-all duration-200 active:scale-95 select-none focus:outline-none focus:ring-4 focus:ring-sage-300 disabled:opacity-50 disabled:pointer-events-none shadow-sm';

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm gap-2 min-h-[44px]',
    md: 'px-5 py-3 text-base gap-2.5 min-h-[52px]',
    lg: 'px-6 py-4 text-elderly-base gap-3 min-h-[64px]',
    xl: 'px-8 py-5 text-elderly-lg gap-4 min-h-[72px]',
  };

  const variantStyles = {
    primary: 'bg-sage-600 hover:bg-sage-700 text-white shadow-sage-800/10 hover:shadow-md active:bg-sage-800 border-2 border-sage-700',
    secondary: 'bg-warm-100 hover:bg-warm-200 text-warm-900 border-2 border-warm-300 active:bg-warm-300',
    accent: 'bg-terracotta-600 hover:bg-terracotta-700 text-white shadow-terracotta-900/15 active:bg-terracotta-800 border-2 border-terracotta-700',
    outline: 'bg-white hover:bg-sage-50 text-sage-800 border-2 border-sage-300 active:bg-sage-100',
    ghost: 'bg-transparent hover:bg-black/5 text-gray-700 border-2 border-transparent',
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
    </button>
  );
};
