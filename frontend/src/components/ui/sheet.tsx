import * as React from "react";
import { X } from "lucide-react";

export interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

const SheetContext = React.createContext<{
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}>({});

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  );
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right" | "top" | "bottom";
}

export function SheetContent({
  className = "",
  children,
  side = "right",
  ...props
}: SheetContentProps) {
  const { open, onOpenChange } = React.useContext(SheetContext);

  if (!open) return null;

  const sideClasses = {
    right: "inset-y-0 right-0 h-full w-full sm:max-w-md border-l animate-in slide-in-from-right",
    left: "inset-y-0 left-0 h-full w-full sm:max-w-md border-r animate-in slide-in-from-left",
    top: "inset-x-0 top-0 h-auto w-full border-b animate-in slide-in-from-top",
    bottom: "inset-x-0 bottom-0 h-auto w-full border-t animate-in slide-in-from-bottom",
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200"
        onClick={() => onOpenChange?.(false)}
      />
      {/* Panel */}
      <div
        className={`fixed bg-background p-6 shadow-xl border-border flex flex-col justify-between overflow-y-auto max-h-screen ${sideClasses[side]} ${className}`}
        {...props}
      >
        <button
          onClick={() => onOpenChange?.(false)}
          className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          title="Close Drawer"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex-1 mt-6">
          {children}
        </div>
      </div>
    </div>
  );
}

export function SheetHeader({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col space-y-1.5 text-left mb-6 ${className}`} {...props} />;
}

export function SheetTitle({ className = "", ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-lg font-bold text-foreground leading-none tracking-tight ${className}`} {...props} />;
}

export function SheetDescription({ className = "", ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`text-sm text-muted-foreground ${className}`} {...props} />;
}

export function SheetFooter({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`flex flex-col sm:flex-row sm:justify-end sm:space-x-2 gap-2 mt-6 ${className}`} {...props} />;
}
