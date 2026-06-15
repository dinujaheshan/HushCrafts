import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', error, label, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label ? (
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </label>
        ) : null}
        <input
          type={type}
          ref={ref}
          className={`w-full px-4 py-2.5 bg-card border border-border text-foreground font-sans text-sm rounded-xl transition-all duration-200 outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50 disabled:bg-muted ${
            error ? 'border-destructive focus:border-destructive focus:ring-destructive' : ''
          } ${className}`}
          {...props}
        />
        {error ? (
          <span className="text-xs text-destructive font-medium mt-0.5">
            {error}
          </span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
