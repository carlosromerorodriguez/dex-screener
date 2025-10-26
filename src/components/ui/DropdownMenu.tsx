import * as React from "react";
import clsx from "clsx";

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "center" | "end";
}

export function Dropdown({ trigger, children, align = "end" }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);
  
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setOpen(v => !v)} className="cursor-pointer">
        {trigger}
      </div>
      {open && (
        <div
          className={clsx(
            "absolute z-50 mt-2 min-w-[220px] rounded-xl border border-[#2c3344] bg-[#10131a] shadow-xl",
            align === "end" && "right-0",
            align === "start" && "left-0"
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export interface ItemProps {
  children: React.ReactNode;
  onClick?: () => void;
}

export function Item({ children, onClick }: ItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 hover:bg-[#161b24] rounded-xl text-sm transition-colors"
    >
      {children}
    </button>
  );
}

export function Separator() {
  return <div className="h-px bg-[#2c3344] my-1" />;
}

export default { Dropdown, Item, Separator };

