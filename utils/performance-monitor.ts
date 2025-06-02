"use client"

import { useEffect } from "react"

// Interface for performance metrics
export interface PerformanceMetrics {
  fcp: number | null // First Contentful Paint
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  ttfb: number | null // Time to First Byte
}

// Function to get current performance metrics
export function getCurrentPerformanceMetrics(): PerformanceMetrics {
  if (typeof window === "undefined") {
    return {
      fcp: null,
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
    }
  }

  const metrics: PerformanceMetrics = {
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
  }

  // Get First Contentful Paint
  const fcpEntry = performance.getEntriesByName("first-contentful-paint", "paint")[0]
  if (fcpEntry) {
    metrics.fcp = fcpEntry.startTime
  }

  // Get Time to First Byte
  const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
  if (navigationEntry) {
    metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart
  }

  return metrics
}

// Hook to monitor performance metrics
export function usePerformanceMonitor(callback?: (metrics: PerformanceMetrics) => void) {
  useEffect(() => {
    if (typeof window === "undefined") return

    // Create a PerformanceObserver to monitor LCP
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const lastEntry = entries[entries.length - 1]
      const lcp = lastEntry.startTime

      const metrics = getCurrentPerformanceMetrics()
      metrics.lcp = lcp

      if (callback) callback(metrics)
    })

    // Create a PerformanceObserver to monitor FID
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries()
      const firstEntry = entries[0]
      const fid = firstEntry.processingStart - firstEntry.startTime

      const metrics = getCurrentPerformanceMetrics()
      metrics.fid = fid

      if (callback) callback(metrics)
    })

    // Create a PerformanceObserver to monitor CLS
    const clsObserver = new PerformanceObserver((entryList) => {
      let clsValue = 0

      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value
        }
      }

      const metrics = getCurrentPerformanceMetrics()
      metrics.cls = clsValue

      if (callback) callback(metrics)
    })

    // Start observing
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true })
    fidObserver.observe({ type: "first-input", buffered: true })
    clsObserver.observe({ type: "layout-shift", buffered: true })

    return () => {
      lcpObserver.disconnect()
      fidObserver.disconnect()
      clsObserver.disconnect()
    }
  }, [callback])

  return getCurrentPerformanceMetrics()
}
