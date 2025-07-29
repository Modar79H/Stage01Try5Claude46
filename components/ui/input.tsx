// components/ui/input.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, ...props }, ref) => {
    const inputId = React.useId();
    
    if (label) {
      return (
        <div className="relative">
          <div className="relative">
            {icon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                {icon}
              </div>
            )}
            <input
              type={type}
              id={inputId}
              className={cn(
                "flex h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm transition-all duration-200",
                "placeholder:text-transparent peer",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                "disabled:cursor-not-allowed disabled:opacity-50",
                icon && "pl-10",
                error && "border-destructive focus:ring-destructive",
                !error && "border-input hover:border-gray-400",
                className
              )}
              placeholder={label}
              ref={ref}
              {...props}
            />
            <label
              htmlFor={inputId}
              className={cn(
                "absolute left-3 top-2.5 text-sm text-muted-foreground transition-all duration-200",
                "peer-placeholder-shown:text-base peer-placeholder-shown:top-2.5",
                "peer-focus:top-[-8px] peer-focus:left-3 peer-focus:text-xs peer-focus:text-primary",
                "peer-focus:bg-background peer-focus:px-1",
                "[&:has(~input:not(:placeholder-shown))]:top-[-8px] [&:has(~input:not(:placeholder-shown))]:left-3 [&:has(~input:not(:placeholder-shown))]:text-xs [&:has(~input:not(:placeholder-shown))]:px-1 [&:has(~input:not(:placeholder-shown))]:bg-background",
                icon && "left-10 peer-focus:left-10 [&:has(~input:not(:placeholder-shown))]:left-10"
              )}
            >
              {label}
            </label>
          </div>
          {error && (
            <p className="mt-1 text-xs text-destructive">{error}</p>
          )}
        </div>
      );
    }
    
    return (
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-lg border bg-background px-3 py-2 text-sm transition-all duration-200",
            "placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-10",
            error && "border-destructive focus:ring-destructive",
            !error && "border-input hover:border-gray-400",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };