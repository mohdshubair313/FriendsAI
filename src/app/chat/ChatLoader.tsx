import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

const ChatLoader = () => {
  return (
    <div className="flex items-center space-x-4 animate-pulse p-4 bg-gray-400 dark:bg-gray-800 rounded-lg shadow-md">
      {/* Avatar Skeleton */}
      <Skeleton className="h-14 w-14 rounded-full bg-gray-800 dark:bg-gray-800" />

      {/* Text Skeleton */}
      <div className="space-y-3">
        {/* First Line */}
        <Skeleton className="h-4 w-[600px] bg-gray-800 dark:bg-gray-800 rounded" />
        {/* Second Line */}
        <Skeleton className="h-4 w-[600px] bg-gray-800 dark:bg-gray-800 rounded" />
        <Skeleton className="h-4 w-[600px] bg-gray-800 dark:bg-gray-800 rounded" />
        <Skeleton className="h-4 w-[600px] bg-gray-800 dark:bg-gray-800 rounded" />
      </div>
    </div>
  );
};

export default ChatLoader;
