import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Search, RotateCcw } from "lucide-react";

interface FilterDrawerProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  availabilityFilter: string;
  setAvailabilityFilter: (val: string) => void;
  onReset: () => void;
}

export const FilterDrawer = ({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  availabilityFilter,
  setAvailabilityFilter,
  onReset
}: FilterDrawerProps) => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="h-10 text-gray-700 bg-white border-gray-200 shrink-0">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md bg-white border-l-gray-200 shadow-2xl p-6">
        <SheetHeader className="mb-6 pb-6 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
          <SheetTitle className="text-lg font-medium text-gray-900">Filter Talents</SheetTitle>
          <Button variant="ghost" size="sm" onClick={onReset} className="h-8 text-xs text-gray-500 hover:text-gray-900">
            <RotateCcw className="h-3 w-3 mr-1.5" /> Reset All
          </Button>
        </SheetHeader>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Name, skills, tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 border-gray-200"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900">Primary Role</Label>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="h-10 border-gray-200">
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Role</SelectItem>
                <SelectItem value="virtual_assistant">Virtual Assistant</SelectItem>
                <SelectItem value="customer_support">Customer Support</SelectItem>
                <SelectItem value="product_manager">Product Manager</SelectItem>
                <SelectItem value="operations_manager">Operations Manager</SelectItem>
                <SelectItem value="project_manager">Project Manager</SelectItem>
                <SelectItem value="executive_assistant">Executive Assistant</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-900">Availability</Label>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="h-10 border-gray-200">
                <SelectValue placeholder="Any Availability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Availability</SelectItem>
                <SelectItem value="full_time">Full-time (40h/week)</SelectItem>
                <SelectItem value="part_time">Part-time (&lt;40h/week)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
