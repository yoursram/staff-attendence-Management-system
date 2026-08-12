import * as React from "react";
import { ChevronDown } from "lucide-react";

type AccordionContextValue = {
  value?: string | string[];
  onValueChange?: (value: any) => void;
  type?: "single" | "multiple";
};

const AccordionContext = React.createContext<AccordionContextValue>({});

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "single" | "multiple";
  value?: string | string[];
  onValueChange?: (value: any) => void;
  defaultValue?: string | string[];
}

export function Accordion({
  type = "single",
  value: valueProp,
  onValueChange,
  defaultValue,
  children,
  className = "",
  ...props
}: AccordionProps) {
  const [value, setValue] = React.useState<string | string[]>(
    valueProp !== undefined ? valueProp : defaultValue || (type === "multiple" ? [] : "")
  );

  const activeValue = valueProp !== undefined ? valueProp : value;

  const handleValueChange = React.useCallback(
    (itemValue: string) => {
      let newValue: string | string[];
      if (type === "single") {
        newValue = activeValue === itemValue ? "" : itemValue;
      } else {
        const currentArr = Array.isArray(activeValue) ? activeValue : [];
        newValue = currentArr.includes(itemValue)
          ? currentArr.filter((val) => val !== itemValue)
          : [...currentArr, itemValue];
      }

      if (valueProp === undefined) {
        setValue(newValue);
      }
      onValueChange?.(newValue);
    },
    [activeValue, type, valueProp, onValueChange]
  );

  return (
    <AccordionContext.Provider value={{ value: activeValue, onValueChange: handleValueChange, type }}>
      <div className={`space-y-1 ${className}`} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

const AccordionItemContext = React.createContext<{ value: string }>({ value: "" });

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className = "", children, ...props }, ref) => {
    return (
      <AccordionItemContext.Provider value={{ value }}>
        <div ref={ref} className={`border-b border-border ${className}`} {...props}>
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = "AccordionItem";

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className = "", children, ...props }, ref) => {
    const { value: activeValue, onValueChange } = React.useContext(AccordionContext);
    const { value: itemValue } = React.useContext(AccordionItemContext);

    const isOpen = Array.isArray(activeValue)
      ? activeValue.includes(itemValue)
      : activeValue === itemValue;

    return (
      <button
        ref={ref}
        type="button"
        className={`flex w-full items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180 ${className}`}
        data-state={isOpen ? "open" : "closed"}
        onClick={() => onValueChange?.(itemValue)}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </button>
    );
  }
);
AccordionTrigger.displayName = "AccordionTrigger";

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className = "", children, ...props }, ref) => {
    const { value: activeValue } = React.useContext(AccordionContext);
    const { value: itemValue } = React.useContext(AccordionItemContext);

    const isOpen = Array.isArray(activeValue)
      ? activeValue.includes(itemValue)
      : activeValue === itemValue;

    if (!isOpen) return null;

    return (
      <div
        ref={ref}
        className={`overflow-hidden text-sm transition-all pb-4 animate-in fade-in duration-200 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AccordionContent.displayName = "AccordionContent";
