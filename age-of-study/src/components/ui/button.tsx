'use client'

import * as React from 'react'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background'
    
    const variantClasses = {
      primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg',
      secondary: 'bg-slate-700 text-slate-100 hover:bg-slate-600',
      outline: 'border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300',
      ghost: 'bg-transparent hover:bg-white/10 text-slate-400 hover:text-white',
      danger: 'bg-red-600 text-white hover:bg-red-700',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700'
    }
    
    const sizeClasses = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'h-10 w-10 p-0'
    }

    return (
      <button
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className || ''}`}
        ref={ref}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'

export { Button }