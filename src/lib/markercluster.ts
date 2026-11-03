import type L from "leaflet"

let ready: Promise<void> | null = null

/**
 * Loads the vendored leaflet.markercluster UMD exactly once.
 *
 * The UMD reads the bare global `L`, so we publish the app's Leaflet
 * instance on globalThis before the dynamic import evaluates it.
 * Resolves immediately on later calls.
 */
export function ensureMarkerCluster(leaflet: typeof L): Promise<void> {
  if ((leaflet as unknown as { markerClusterGroup?: unknown }).markerClusterGroup) {
    return Promise.resolve()
  }
  if (!ready) {
    ready = (async () => {
      ;(globalThis as unknown as { L: typeof L }).L = leaflet
      await import("../vendor/leaflet.markercluster.js")
    })()
  }
  return ready
}
