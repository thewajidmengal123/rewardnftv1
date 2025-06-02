import type { SegmentConfig } from "next/dist/server/future/route-modules/route-module"

export const config: SegmentConfig = {
  dynamic: "force-dynamic",
  revalidate: 60, // Revalidate every 60 seconds
  fetchCache: "force-cache",
  runtime: "nodejs",
}
