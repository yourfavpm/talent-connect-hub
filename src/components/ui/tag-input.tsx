import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TagInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxTags?: number;
}

const TagInput = React.forwardRef<HTMLInputElement, TagInputProps>(
  ({ value, onChange, placeholder, disabled, maxTags, className, ...props }, ref) => {
    const [pendingValue, setPendingValue] = React.useState("");

    const addTag = (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;
      if (maxTags && value.length >= maxTags) return;
      
      // Prevent duplicates (case-insensitive)
      if (value.some(t => t.toLowerCase() === trimmed.toLowerCase())) {
        setPendingValue("");
        return;
      }

      onChange([...value, trimmed]);
      setPendingValue("");
    };

    const removeTag = (index: number) => {
      if (disabled) return;
      const newValue = [...value];
      newValue.splice(index, 1);
      onChange(newValue);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addTag(pendingValue);
      } else if (e.key === "Backspace" && !pendingValue && value.length > 0) {
        removeTag(value.length - 1);
      }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData("text");
      const tags = pasteData.split(/[,\n]/).map(t => t.trim()).filter(Boolean);
      
      const newValue = [...value];
      tags.forEach(tag => {
        if (!newValue.some(t => t.toLowerCase() === tag.toLowerCase())) {
          if (!maxTags || newValue.length < maxTags) {
            newValue.push(tag);
          }
        }
      });
      onChange(newValue);
    };

    return (
      <div className={cn("space-y-2", className)}>
        <div className="flex flex-wrap gap-1.5 min-h-[2.5rem] p-1.5 rounded-lg border border-slate-200 bg-white items-center focus-within:ring-1 focus-within:ring-slate-800 transition-all">
          {value.map((tag, index) => (
            <Badge 
              key={`${tag}-${index}`} 
              variant="secondary" 
              className="pl-2 pr-1 py-0.5 h-7 flex items-center gap-1 bg-slate-100 text-slate-700 border-none rounded-md group"
            >
              <span className="text-xs font-semibold">{tag}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeTag(index)}
                  className="p-0.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-900 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
          {!disabled && (
            <input
              {...props}
              ref={ref}
              type="text"
              value={pendingValue}
              onChange={(e) => setPendingValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              onBlur={() => addTag(pendingValue)}
              placeholder={value.length === 0 ? placeholder : ""}
              className="flex-1 min-w-[120px] bg-transparent outline-none text-sm placeholder:text-slate-400 disabled:cursor-not-allowed"
            />
          )}
        </div>
        <p className="text-[10px] text-slate-400 font-medium px-1">
          {disabled ? "Read-only mode" : "Type and press Enter or comma to add"}
        </p>
      </div>
    );
  }
);

TagInput.displayName = "TagInput";

export { TagInput };
