import type React from "react"
import dynamic from "next/dynamic"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

// Generic type for component props
type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never

// Function to dynamically import components with loading fallback
export function lazyImport<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  loadingComponent?: React.ReactNode,
  ssr = false,
) {
  const LazyComponent = dynamic(importFn, {
    loading: () => <>{loadingComponent || <Skeleton className="w-full h-32" />}</>,
    ssr,
  })

  return function DynamicComponent(props: ComponentProps<T>) {
    return (
      <Suspense fallback={loadingComponent || <Skeleton className="w-full h-32" />}>
        <LazyComponent {...props} />
      </Suspense>
    )
  }
}

// Function to create a lazy-loaded image component
export function lazyImage(src: string, alt: string, className?: string) {
  return <img src={src || "/placeholder.svg"} alt={alt} className={className} loading="lazy" decoding="async" />
}
