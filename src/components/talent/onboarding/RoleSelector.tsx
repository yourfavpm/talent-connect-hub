import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
import { ROLE_CATEGORIES } from "@/lib/constants/onboarding";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RoleSelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function RoleSelector({ value, onChange, className }: RoleSelectorProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  
  // Find category for the current value if it exists in the list
  const initialCategory = React.useMemo(() => {
    for (const cat of ROLE_CATEGORIES) {
      if (cat.roles.includes(value)) return cat.primary_category;
    }
    return "";
  }, [value]);

  const [selectedCategory, setSelectedCategory] = React.useState(initialCategory);

  const roles = React.useMemo(() => {
    if (!selectedCategory) return [];
    const cat = ROLE_CATEGORIES.find(c => c.primary_category === selectedCategory);
    return cat ? cat.roles : [];
  }, [selectedCategory]);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-2">
        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Role Category</Label>
        <Select 
          value={selectedCategory} 
          onValueChange={(val) => {
            setSelectedCategory(val);
            if (val !== initialCategory) {
              // Reset role if category changes, unless it's a custom role that might belong to the new category?
              // Actually, better to just let user select the role.
            }
          }}
        >
          <SelectTrigger className="w-full bg-white border-slate-200">
            <SelectValue placeholder="Select specialized category" />
          </SelectTrigger>
          <SelectContent>
            {ROLE_CATEGORIES.map((cat) => (
              <SelectItem key={cat.primary_category} value={cat.primary_category}>
                {cat.primary_category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Primary Role Title</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              disabled={!selectedCategory}
              className="w-full justify-between bg-white border-slate-200 font-normal"
            >
              {value ? value : "Select or search role..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search roles..." 
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty className="py-2 px-4 text-sm">
                  <div className="flex flex-col gap-2">
                    <p className="text-slate-500">No matching role found in this category.</p>
                    {search && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 justify-start gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => {
                          onChange(search);
                          setOpen(false);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Create "{search}"
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup heading={selectedCategory}>
                  {roles.map((role) => (
                    <CommandItem
                      key={role}
                      value={role}
                      onSelect={(currentValue) => {
                        onChange(currentValue);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === role ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {role}
                    </CommandItem>
                  ))}
                </CommandGroup>
                
                {/* Allow creating even if there are matches but user wants something specific */}
                {search && !roles.some(r => r.toLowerCase() === search.toLowerCase()) && (
                   <CommandGroup heading="Custom Role">
                      <CommandItem
                        value={search}
                        onSelect={() => {
                          onChange(search);
                          setOpen(false);
                        }}
                        className="text-blue-600 font-medium"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create "{search}"
                      </CommandItem>
                   </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
