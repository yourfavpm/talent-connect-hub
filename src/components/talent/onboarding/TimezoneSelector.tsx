import * as React from "react";
import { Check, ChevronsUpDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Generate a comprehensive list of timezones with UTC offsets
const getTimezones = () => {
    try {
        const timezones = Intl.supportedValuesOf('timeZone');
        return timezones.map(tz => {
            try {
                const formatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: tz,
                    timeZoneName: 'shortOffset',
                });
                const parts = formatter.formatToParts(new Date());
                const offset = parts.find(p => p.type === 'timeZoneName')?.value || "";
                return {
                    value: tz,
                    label: `(${offset}) ${tz.replace('_', ' ')}`,
                    searchKey: tz.toLowerCase() + " " + offset.toLowerCase()
                };
            } catch (e) {
                return { value: tz, label: tz, searchKey: tz.toLowerCase() };
            }
        }).sort((a, b) => a.label.localeCompare(b.label));
    } catch (e) {
        // Fallback for environments where supportedValuesOf might not exist
        return [{ value: "UTC", label: "(UTC+0) UTC", searchKey: "utc" }];
    }
};

const COMPREHENSIVE_TIMEZONES = getTimezones();

interface TimezoneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TimezoneSelector({ value, onChange, className, disabled }: TimezoneSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedTimezoneLabel = React.useMemo(() => {
    const tz = COMPREHENSIVE_TIMEZONES.find(t => t.value === value);
    return tz ? tz.label : value || "Select timezone...";
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn("w-full justify-between bg-white border-slate-200 font-normal h-9 text-[12px] font-light", className)}
        >
          <div className="flex items-center gap-2 truncate text-slate-600">
            <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{selectedTimezoneLabel}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0 shadow-2xl border-slate-100" align="start">
        <Command>
          <CommandInput placeholder="Search timezone (e.g. Lagos, UTC+1)..." className="h-9" />
          <CommandList className="max-h-[300px] overflow-y-auto scrollbar-thin">
            <CommandEmpty>No timezone found.</CommandEmpty>
            <CommandGroup>
                {COMPREHENSIVE_TIMEZONES.map((tz) => (
                  <CommandItem
                    key={tz.value}
                    value={tz.searchKey} 
                    onSelect={() => {
                      onChange(tz.value);
                      setOpen(false);
                    }}
                    className="text-xs py-2"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4 text-blue-600",
                        value === tz.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {tz.label}
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
