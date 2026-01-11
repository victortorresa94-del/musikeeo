import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"

// --- UTILS ---
// Creating a simple utils file inline or reference it if I create it separately.
// For now, I'll rely on imported 'cn' assuming it exists or I will create it.

// --- BUTTON ---
const buttonVariants = cva(
    "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-heading font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(0,229,255,0.5)] border border-transparent",
                destructive:
                    "bg-destructive text-destructive-foreground hover:bg-destructive/90",
                outline:
                    "border border-primary/20 bg-transparent hover:bg-primary/10 hover:text-primary hover:border-primary/50 text-foreground",
                secondary:
                    "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                ghost: "hover:bg-accent/10 hover:text-accent",
                link: "text-primary underline-offset-4 hover:underline",
                // Stitch Specific
                glow: "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(0,229,255,0.4)] hover:shadow-[0_0_30px_rgba(0,229,255,0.6)] hover:scale-105 border border-primary/50",
                glass: "bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-foreground"
            },
            size: {
                default: "h-11 px-6 py-2",
                sm: "h-9 rounded-lg px-3",
                lg: "h-14 rounded-2xl px-10 text-base",
                icon: "h-11 w-11",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
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
