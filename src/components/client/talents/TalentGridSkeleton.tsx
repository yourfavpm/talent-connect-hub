import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const TalentGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="p-6 border border-gray-100 shadow-sm rounded-xl space-y-4">
          <div className="flex items-start justify-between">
            <Skeleton className="h-16 w-16 rounded-lg" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          
          <div className="space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-md" />
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-6 w-14 rounded-md" />
          </div>
          
          <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
        </Card>
      ))}
    </div>
  );
};
