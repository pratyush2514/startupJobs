import "leaflet"

/** Minimal typings for the vendored leaflet.markercluster UMD. */
declare module "leaflet" {
  interface MarkerClusterGroupOptions extends L.LayerOptions {
    maxClusterRadius?: number
    iconCreateFunction?: (cluster: MarkerCluster) => L.DivIcon
    zoomToBoundsOnClick?: boolean
    showCoverageOnHover?: boolean
    spiderfyOnMaxZoom?: boolean
    disableClusteringAtZoom?: number | null
  }

  interface MarkerClusterGroup extends L.FeatureGroup {
    addLayers(layers: L.Layer[]): this
    zoomToShowLayer(layer: L.Layer, callback?: () => void): void
  }

  interface MarkerCluster extends L.Marker {
    getChildCount(): number
    getAllChildMarkers(): L.Marker[]
  }

  function markerClusterGroup(
    options?: MarkerClusterGroupOptions,
  ): MarkerClusterGroup
}

declare module "*leaflet.markercluster.js"
