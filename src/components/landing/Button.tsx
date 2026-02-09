import { useRef, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { useJitterEffect } from '../../hooks/useGSAP';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: ButtonProps) => {
  const { elementRef, startJitter, stopJitter } = useJitterEffect();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const baseStyles =
    'font-jetbrains font-black uppercase tracking-wider border-2 border-pure-black transition-all duration-150';

  const variants = {
    primary:
      'bg-safety-lime text-pure-black shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    secondary:
      'bg-cyan-accent text-pure-black shadow-brutal hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm active:translate-x-[4px] active:translate-y-[4px] active:shadow-none',
    outline:
      'bg-bg-white text-pure-black shadow-brutal hover:bg-pure-black hover:text-bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-brutal-sm',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };

  return (
    <button
      ref={(el) => {
        (buttonRef as React.MutableRefObject<HTMLButtonElement | null>).current = el;
        (elementRef as React.MutableRefObject<HTMLElement | null>).current = el;
      }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      onMouseEnter={startJitter}
      onMouseLeave={stopJitter}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
