import { type ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
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
  const variants = {
    primary: 'bg-[#FFB800] text-[#050505] hover:bg-[#FFCC33] shadow-[0_0_20px_rgba(255,184,0,0.25)] hover:shadow-[0_0_30px_rgba(255,184,0,0.4)]',
    secondary: 'bg-[#FF6B00] text-white hover:bg-[#FF8C00] shadow-[0_0_20px_rgba(255,107,0,0.2)]',
    outline: 'bg-transparent border border-white/20 text-[#F5F5F5] hover:border-[#FFB800] hover:text-[#FFB800]',
  };

  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-sm',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15 }}
      className={`font-mono font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

export default Button;
