import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div
      role="status"
      className="w-full mx-auto p-10 md:p-14 border border-gray-600 rounded-lg shadow-md animate-pulse bg-gray-750"
    >
      {/* Header skeleton */}
      <div className="flex items-center justify-between top-0">
        <div className="h-2 bg-gray-600 rounded-full dark:bg-gray-800 w-4/6"></div>
        <div className="w-12 h-12 rounded-full top-2 bg-gray-800 dark:bg-gray-800"></div>
        <div className="h-10 bg-gray-300 rounded-lg dark:bg-gray-700 w-32 animate-pulse"></div>
        <div className="h-10 bg-gray-300 rounded-lg dark:bg-gray-700 w-32 animate-pulse"></div>
      </div>

      {/* Body text skeleton */}
      <div className="space-y-3 mb-10 mt-48">
        <div className="h-2 bg-gray-600 rounded-full dark:bg-gray-800 w-full"></div>
        <div className="h-2 bg-gray-600 rounded-full dark:bg-gray-800 w-full"></div>
        <div className="h-2 bg-gray-600 rounded-full dark:bg-gray-800 w-5/6"></div>
        <div className="h-2 bg-gray-600 rounded-full dark:bg-gray-800 w-4/6"></div>
      </div>

      {/* box skeleton */}
      
      <Skeleton className="flex justify-center items-center bg-gray-600 dark:bg-gray-800 h-[300px] w-[950px] rounded-xl mt-20 ml-12" />

      {/* Footer skeleton */}
      {/* <div className="flex justify-between items-center mt-6">
        <div className="w-24 h-3 bg-gray-600 rounded-full dark:bg-gray-800"></div>
        <div className="flex space-x-3">
          <div className="w-8 h-8 bg-gray-600 rounded-full dark:bg-gray-800"></div>
          <div className="w-8 h-8 bg-gray-600 rounded-full dark:bg-gray-800"></div>
          <div className="w-8 h-8 bg-gray-600 rounded-full dark:bg-gray-800"></div>
        </div>
      </div> */}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
