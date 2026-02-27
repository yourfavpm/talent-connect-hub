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
import { TIMEZONE_REGIONS } from "@/lib/constants/onboarding";

interface TimezoneSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function TimezoneSelector({ value, onChange, className }: TimezoneSelectorProps) {
  const [open, setOpen] = React.useState(false);

  const selectedTimezoneLabel = React.useMemo(() => {
    for (const region of TIMEZONE_REGIONS) {
      const tz = region.timezones.find(t => t.value === value);
      if (tz) return tz.label;
    }
    return value || "Select timezone...";
  }, [value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-white border-slate-200 font-normal", className)}
        >
          <div className="flex items-center gap-2 truncate">
            <Globe className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{selectedTimezoneLabel}</span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search timezone or city..." />
          <CommandList>
            <CommandEmpty>No timezone found.</CommandEmpty>
            {TIMEZONE_REGIONS.map((region) => (
              <CommandGroup key={region.region} heading={region.region}>
                {region.timezones.map((tz) => (
                  <CommandItem
                    key={tz.value}
                    value={tz.label} // Command search works on value/text
                    onSelect={() => {
                      onChange(tz.value);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === tz.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {tz.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
