import { Skeleton } from "@/components/ui/skeleton"

export function Loader() {
  return (
    <div className="w-full min-h-screen bg-gray-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="py-6 mb-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-32 bg-gray-800" /> {/* Logo */}
            <div className="flex space-x-4">
              <Skeleton className="h-8 w-20 bg-gray-800" /> {/* Nav item */}
              <Skeleton className="h-8 w-20 bg-gray-800" /> {/* Nav item */}
              <Skeleton className="h-8 w-20 bg-gray-800" /> {/* Nav item */}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="mb-8">
          {/* Hero section */}
          <div className="mb-12">
            <Skeleton className="h-64 w-full rounded-xl bg-gray-800 mb-4" /> {/* Hero image */}
            <Skeleton className="h-10 w-3/4 bg-gray-800 mb-4" /> {/* Hero title */}
            <Skeleton className="h-4 w-full max-w-2xl bg-gray-800" /> {/* Hero description */}
          </div>

          {/* Grid content */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-3">
                <Skeleton className="h-48 w-full rounded-xl bg-gray-800" /> {/* Card image */}
                <Skeleton className="h-6 w-3/4 bg-gray-800" /> {/* Card title */}
                <Skeleton className="h-4 w-full bg-gray-800" /> {/* Card description */}
                <Skeleton className="h-4 w-full bg-gray-800" /> {/* Card description */}
                <Skeleton className="h-8 w-28 bg-gray-800" /> {/* Card button */}
              </div>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="py-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-32 bg-gray-800" /> {/* Footer logo */}
            <div className="flex space-x-4">
              <Skeleton className="h-8 w-8 rounded-full bg-gray-800" /> {/* Social icon */}
              <Skeleton className="h-8 w-8 rounded-full bg-gray-800" /> {/* Social icon */}
              <Skeleton className="h-8 w-8 rounded-full bg-gray-800" /> {/* Social icon */}
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

