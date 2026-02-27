import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

// A simplified, unmanaged Dialog component without Radix that works as a shim

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={() => onOpenChange?.(false)}
      />
      {/* We pass a special prop to close the dialog via context if needed, but here we just render children */}
      <div className="relative z-50">
        {React.Children.map(children, child => {
          if (React.isValidElement(child)) {
             // Attach the closer prop to the content
             return React.cloneElement(child as React.ReactElement<any>, { onClose: () => onOpenChange?.(false) });
          }
          return child;
        })}
      </div>
    </div>
  );
}

// Just pass-through wrapper
export function DialogTrigger({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
  return <>{children}</>;
}

export const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }>(
  ({ className, children, onClose, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-white rounded-xl shadow-xl p-6 relative sm:w-full w-[95vw]",
        className
      )}
      {...props}
    >
      {onClose && (
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      )}
      {children}
    </div>
  )
)
DialogContent.displayName = "DialogContent"

export const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

export const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

export const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  )
)
DialogTitle.displayName = "DialogTitle"

export const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  )
)
DialogDescription.displayName = "DialogDescription"
