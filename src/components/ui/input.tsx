import * as React from "react"
import { cn } from "../../lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "w-full bg-muted border border-border rounded-xl h-12 px-4 text-sm text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "transition-all",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
