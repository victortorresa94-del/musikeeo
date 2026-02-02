import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"

// Context to share state between Select parts
const SelectContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
    open: boolean;
    setOpen: (open: boolean) => void;
} | null>(null);

const Select = ({ children, value, onValueChange }: { children: React.ReactNode, value?: string, onValueChange?: (val: string) => void }) => {
    const [open, setOpen] = React.useState(false);
    // Uncontrolled state fallback if needed, but for now assuming controlled for simplicity

    return (
        <SelectContext.Provider value={{ value: value || '', onValueChange: onValueChange || (() => { }), open, setOpen }}>
            <div className="relative group">{children}</div>
        </SelectContext.Provider>
    );
};

const SelectTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const ctx = React.useContext(SelectContext);
    return (
        <button
            ref={ref}
            type="button"
            onClick={() => ctx?.setOpen(!ctx.open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { position?: "popper" | "item-aligned" }
>(({ className, children, position = "popper", ...props }, ref) => {
    const ctx = React.useContext(SelectContext);

    if (!ctx?.open) return null;

    return (
        <>
            <div className="fixed inset-0 z-50" onClick={() => ctx.setOpen(false)} />
            <div
                ref={ref}
                className={cn(
                    "absolute top-full mt-1 z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80",
                    position === "popper" &&
                    "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
                    className
                )}
                {...props}
            >
                <div className="p-1">
                    {children}
                </div>
            </div>
        </>
    )
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
    const ctx = React.useContext(SelectContext);
    const isSelected = ctx?.value === value;

    return (
        <div
            ref={ref}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-white/10 cursor-pointer",
                isSelected && "bg-brand-yellow/20 text-brand-yellow",
                className
            )}
            onClick={(e) => {
                e.stopPropagation();
                ctx?.onValueChange(value);
                ctx?.setOpen(false);
            }}
            {...props}
        >
            {isSelected && (
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-brand-yellow" />
                </span>
            )}
            <span className="truncate">{children}</span>
        </div>
    )
})
SelectItem.displayName = "SelectItem"

const SelectValue = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, ...props }, ref) => {
    const ctx = React.useContext(SelectContext);
    return (
        <span
            ref={ref}
            className={cn("block truncate", className)}
            {...props}
        >
            {ctx?.value || placeholder}
        </span>
    )
})
SelectValue.displayName = "SelectValue"

export { Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator }

// Mocks for unused parts to match standard API if needed, or just leave out
const SelectGroup = ({ children }: { children: React.ReactNode }) => <div>{children}</div>;
const SelectLabel = ({ children }: { children: React.ReactNode }) => <div className="px-2 py-1.5 text-sm font-semibold">{children}</div>;
const SelectSeparator = () => <div className="-mx-1 my-1 h-px bg-muted" />;
