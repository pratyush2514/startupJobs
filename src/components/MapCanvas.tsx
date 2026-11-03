import { Suspense, lazy, useEffect, useRef, useState } from "react"
import { type City, type Company } from "../data"
import { SchematicMap } from "./SchematicMap"
import { preloadMapView } from "../lib/preload"
import { preloadMarkerCluster } from "../lib/markercluster"

const LazyMapView = lazy(preloadMapView)

type Props = {
  city: City
  companies: Company[]
  dark: boolean
  selected?: Company | null
  onSelect: (company: Company) => void
  preview?: boolean
}

export function MapCanvas(props: Props) {
  const host = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      setActive(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setActive(true)
        void preloadMapView()
        void preloadMarkerCluster()
        observer.disconnect()
      },
      { rootMargin: "600px 0px" },
    )
    if (host.current) observer.observe(host.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="map-canvas" ref={host}>
      {active ? (
        <Suspense
          fallback={
            <SchematicMap
              city={props.city}
              companies={props.companies}
              onSelect={props.onSelect}
              preview={props.preview}
              busy
              note="Preparing the map"
            />
          }
        >
          <LazyMapView {...props} />
        </Suspense>
      ) : (
        <SchematicMap
          city={props.city}
          companies={props.companies}
          onSelect={props.onSelect}
          preview={props.preview}
          note="Map preview"
        />
      )}
    </div>
  )
}
