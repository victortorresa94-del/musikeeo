import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground font-semibold rounded-xl hover:brightness-105 active:scale-95 hover:shadow-[0_0_20px_var(--primary-glow)]",
        ghost:
          "border border-primary/40 text-primary bg-transparent hover:bg-primary/10 rounded-xl active:scale-95",
        surface:
          "bg-muted text-foreground border border-border hover:border-border hover:bg-muted/80 rounded-xl active:scale-95",
        destructive:
          "bg-destructive/10 text-destructive border border-destructive/30 rounded-xl hover:bg-destructive/20 active:scale-95",
        link: "text-primary underline-offset-4 hover:underline",
        glass:
          "bg-card/60 backdrop-blur-md border border-border text-foreground rounded-xl hover:bg-card/80 active:scale-95",
        // Legacy aliases — kept for backward compatibility
        outline:
          "border border-primary/40 text-primary bg-transparent hover:bg-primary/10 rounded-xl active:scale-95",
        glow:
          "bg-primary text-primary-foreground font-semibold rounded-xl hover:brightness-105 active:scale-95 shadow-[0_0_20px_var(--primary-glow)] hover:shadow-[0_0_30px_var(--primary-glow)]",
        default:
          "bg-primary text-primary-foreground font-semibold rounded-xl hover:brightness-105 active:scale-95 hover:shadow-[0_0_20px_var(--primary-glow)]",
        secondary:
          "bg-muted text-foreground border border-border hover:bg-muted/80 rounded-xl active:scale-95",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
