import { useEffect, useRef, useState } from "react"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { type City, type Company } from "./data"
import { monogram, readableOn } from "./lib/utils"
import { rolesForCompany } from "./lib/roles"
import { useOnline, useSlowConnection } from "./lib/hooks"
import { SchematicMap } from "./components/SchematicMap"
import { Fit, Minus, Pin, Plus, Refresh, WifiOff } from "./components/icons"

const INDIA_BOUNDS = L.latLngBounds([6.4, 67.5], [37.3, 97.8])
const TRANSPARENT_TILE =
  "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="

type TileStatus = "loading" | "ready" | "degraded" | "offline" | "paused"
type Provider = "esri" | "carto"

type Props = {
  city: City
  companies: Company[]
  dark: boolean
  selected?: Company | null
  onSelect: (company: Company) => void
  preview?: boolean
}

function tileSource(provider: Provider, dark: boolean) {
  if (provider === "carto") {
    return {
      url: `https://{s}.basemaps.cartocdn.com/${
        dark ? "dark_all" : "light_all"
      }/{z}/{x}/{y}{r}.png`,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>',
      options: {
        subdomains: "abcd",
        maxZoom: 20,
        minZoom: 3,
        errorTileUrl: TRANSPARENT_TILE,
      } satisfies L.TileLayerOptions,
      labels: null,
    }
  }
  const mode = dark ? "Dark" : "Light"
  return {
    url: `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${mode}_Gray_Base/MapServer/tile/{z}/{y}/{x}`,
    attribution:
      'Tiles &copy; <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    options: {
      maxZoom: 19,
      maxNativeZoom: 16,
      minZoom: 3,
      errorTileUrl: TRANSPARENT_TILE,
    } satisfies L.TileLayerOptions,
    labels: `https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${mode}_Gray_Reference/MapServer/tile/{z}/{y}/{x}`,
  }
}

export default function MapView({
  city,
  companies,
  dark,
  selected,
  onSelect,
  preview = false,
}: Props) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const markers = useRef<L.LayerGroup | null>(null)
  const markerIndex = useRef(new Map<string, L.Marker>())
  const lastCity = useRef(city.id)
  const callback = useRef(onSelect)
  const selectedRef = useRef(selected)
  callback.current = onSelect
  selectedRef.current = selected

  const online = useOnline()
  const slow = useSlowConnection()
  const [allowTiles, setAllowTiles] = useState(
    () => typeof navigator === "undefined" || (!slow && navigator.onLine),
  )
  const [provider, setProvider] = useState<Provider>("esri")
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<TileStatus>(() =>
    typeof navigator !== "undefined" && !navigator.onLine
      ? "offline"
      : slow
        ? "paused"
        : "loading",
  )

  useEffect(() => {
    if (!container.current) return
    const instance = L.map(container.current, {
      zoomControl: false,
      attributionControl: true,
      // The preview map stays fully interactive (drag / touch / double-click),
      // but never hijacks the page's scroll wheel.
      scrollWheelZoom: preview ? false : true,
      dragging: true,
      touchZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      zoomSnap: 0.5,
      zoomDelta: 0.5,
      maxBounds: INDIA_BOUNDS,
      maxBoundsViscosity: 0.85,
      minZoom: 3,
      worldCopyJump: false,
      preferCanvas: true,
    })
    instance.attributionControl.setPrefix(false)
    instance.setView([city.lat, city.lng], preview ? 11 : 12, { animate: false })
    map.current = instance
    markers.current = L.layerGroup().addTo(instance)

    const frame = window.requestAnimationFrame(() => {
      instance.invalidateSize()
      fitToCompanies(instance, city, companies, false)
      lastCity.current = city.id
      const indiaZoom = instance.getBoundsZoom(INDIA_BOUNDS, true)
      instance.setMinZoom(Math.max(4, Math.min(indiaZoom + 1, 6)))
    })

    const observer = new ResizeObserver(() => {
      instance.invalidateSize()
    })
    observer.observe(container.current)

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
      instance.remove()
      map.current = null
      markers.current = null
      markerIndex.current.clear()
    }
    // The map instance lives for the life of the component.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview])

  useEffect(() => {
    if (!online) {
      setStatus("offline")
      return
    }
    if (status === "offline") {
      setAllowTiles(true)
      setAttempt((value) => value + 1)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online])

  useEffect(() => {
    if (!allowTiles) setStatus("paused")
  }, [allowTiles])

  useEffect(() => {
    const instance = map.current
    if (!instance || !allowTiles || !online) return
    let cancelled = false
    let settled = false
    let loaded = 0
    let errors = 0
    const source = tileSource(provider, dark)
    const width = container.current?.clientWidth ?? 900
    const height = container.current?.clientHeight ?? 500
    const expected =
      Math.ceil(width / 256) * Math.ceil(height / 256) * (provider === "esri" ? 1 : 1)
    const threshold = Math.min(expected, Math.max(3, Math.round(expected * 0.4)))

    setStatus("loading")

    const base = L.tileLayer(source.url, {
      ...source.options,
      attribution: source.attribution,
      bounds: INDIA_BOUNDS,
      updateWhenIdle: preview,
      keepBuffer: 2,
    }).addTo(instance)

    const labels = source.labels
      ? L.tileLayer(source.labels, {
          maxZoom: 19,
          maxNativeZoom: 16,
          minZoom: 3,
          bounds: INDIA_BOUNDS,
          pane: "overlayPane",
          updateWhenIdle: preview,
          keepBuffer: 2,
        }).addTo(instance)
      : null

    const settle = (next: TileStatus) => {
      if (cancelled || settled) return
      settled = true
      setStatus(next)
    }

    base.on("tileload", () => {
      if (cancelled) return
      loaded += 1
      if (loaded >= threshold) settle("ready")
    })
    base.on("tileerror", () => {
      if (cancelled) return
      errors += 1
      if (errors >= 4 && loaded === 0 && provider === "esri") {
        setProvider("carto")
      }
    })

    const slowTimer = window.setTimeout(() => {
      if (cancelled || settled) return
      if (loaded === 0) setStatus("degraded")
    }, 4200)

    const giveUpTimer = window.setTimeout(() => {
      if (cancelled || settled) return
      settle(loaded > 0 ? "ready" : "degraded")
    }, 11000)

    return () => {
      cancelled = true
      window.clearTimeout(slowTimer)
      window.clearTimeout(giveUpTimer)
      base.remove()
      labels?.remove()
    }
  }, [allowTiles, online, dark, provider, attempt, preview])

  useEffect(() => {
    const instance = map.current
    if (!instance) return
    const fit = () => {
      instance.invalidateSize()
      fitToCompanies(instance, city, companies, lastCity.current !== city.id)
      lastCity.current = city.id
    }
    const frame = window.requestAnimationFrame(fit)
    return () => window.cancelAnimationFrame(frame)
    // Fit only when the city changes or the map first mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city.id])

  useEffect(() => {
    const group = markers.current
    if (!group) return
    group.clearLayers()
    markerIndex.current.clear()

    companies.forEach((company) => {
      const element = document.createElement("div")
      element.className = "map-pin"
      element.style.setProperty("--pin", company.color)
      element.style.setProperty("--pin-ink", readableOn(company.color))
      const body = document.createElement("span")
      body.className = "map-pin-body"
      body.textContent = monogram(company.name)
      const tail = document.createElement("span")
      tail.className = "map-pin-tail"
      element.append(body, tail)

      const icon = L.divIcon({
        html: element,
        className: "map-pin-icon",
        iconSize: [42, 50],
        iconAnchor: [21, 48],
      })

      const place = company.area ?? city.name
      const marker = L.marker([company.lat, company.lng], {
        icon,
        keyboard: true,
        riseOnHover: true,
        title: `${company.name}, ${place}`,
        alt: `${company.name}, ${place}`,
      })

      const tooltip = document.createElement("div")
      tooltip.className = "map-tooltip-content"
      const name = document.createElement("strong")
      name.textContent = company.name
      const area = document.createElement("span")
      area.textContent = `${place} · ${company.category}`
      tooltip.append(name, area)

      const companyRoles = rolesForCompany(company.id)
      if (companyRoles.length > 0) {
        const rolesHead = document.createElement("span")
        rolesHead.className = "map-tooltip-roles-head"
        rolesHead.textContent = `${companyRoles.length} open role${companyRoles.length === 1 ? "" : "s"}`
        tooltip.append(rolesHead)
        for (const role of companyRoles.slice(0, 2)) {
          const row = document.createElement("span")
          row.className = "map-tooltip-role"
          row.textContent = role.title
          tooltip.append(row)
        }
        const hint = document.createElement("span")
        hint.className = "map-tooltip-hint"
        hint.textContent = "Click the pin for all roles"
        tooltip.append(hint)
      }

      marker.bindTooltip(tooltip, {
        direction: "top",
        offset: [0, -38],
        opacity: 1,
        className: "map-tooltip",
      })
      marker.on("click", () => callback.current(company))
      marker.addTo(group)
      markerIndex.current.set(company.id, marker)
    })

    const current = selectedRef.current
    if (current) {
      const marker = markerIndex.current.get(current.id)
      marker?.getElement()?.classList.add("is-selected")
      marker?.setZIndexOffset(900)
    }
  }, [companies])

  useEffect(() => {
    markerIndex.current.forEach((marker, id) => {
      const element = marker.getElement()
      if (!element) return
      const active = selected?.id === id
      element.classList.toggle("is-selected", active)
      marker.setZIndexOffset(active ? 900 : 0)
    })
  }, [selected])

  const retry = () => {
    setAllowTiles(true)
    setProvider((current) => (current === "esri" ? "carto" : "esri"))
    setAttempt((value) => value + 1)
  }

  const loadTiles = () => {
    setAllowTiles(true)
    setAttempt((value) => value + 1)
  }

  const fitResults = () => {
    if (map.current) fitToCompanies(map.current, city, companies, true)
  }

  const ready = status === "ready"

  return (
    <div className={`map-shell${preview ? " is-preview" : ""}`}>
      <div
        className="leaflet-canvas"
        ref={container}
        aria-label={`Interactive map of ${city.name}`}
      />

      <div
        className={`schematic-layer${ready ? " is-hidden" : ""}`}
        aria-hidden={ready}
      >
        <SchematicMap
          city={city}
          companies={companies}
          onSelect={onSelect}
          preview={preview}
          busy={status === "loading"}
          note={
            status === "paused"
              ? "Schematic view · map paused"
              : status === "offline"
                ? "Schematic view · offline"
                : status === "degraded"
                  ? "Schematic view · tiles unavailable"
                  : "Schematic view · loading map"
          }
        />
      </div>

      {!preview && (
        <div className="map-city-label">
          <Pin size={13} />
          {city.name}
        </div>
      )}

      {ready && (
        <div className="map-controls" aria-label="Map controls">
            <button
              type="button"
              onClick={() => map.current?.zoomIn(0.5)}
              aria-label="Zoom in"
              title="Zoom in"
            >
              <Plus size={17} />
            </button>
            <button
              type="button"
              onClick={() => map.current?.zoomOut(0.5)}
              aria-label="Zoom out"
              title="Zoom out"
            >
              <Minus size={17} />
            </button>
            <button
              type="button"
              onClick={fitResults}
              aria-label="Fit all companies in view"
              title="Fit companies"
            >
              <Fit size={16} />
            </button>
          </div>
      )}

      {!preview && status !== "ready" && (
        <div className="map-status" role="status" aria-live="polite">
          <span className="map-status-copy">
            {status === "offline" ? (
              <WifiOff size={14} />
            ) : status === "paused" ? (
              <Pin size={14} />
            ) : status === "degraded" ? (
              <WifiOff size={14} />
            ) : (
              <span className="map-status-spinner" aria-hidden="true" />
            )}
            {status === "offline"
              ? "You’re offline — exploring the schematic map"
              : status === "paused"
                ? "Data saver is on — the map is paused"
                : status === "degraded"
                  ? "Map tiles are unavailable — schematic view"
                  : "Loading map tiles…"}
          </span>
          {status === "paused" && (
            <button type="button" onClick={loadTiles} className="map-status-action">
              Load map
            </button>
          )}
          {(status === "degraded" || status === "offline") && (
            <button type="button" onClick={retry} className="map-status-action">
              <Refresh size={13} /> Retry
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function fitToCompanies(
  instance: L.Map,
  city: City,
  companies: Company[],
  animate: boolean,
) {
  if (companies.length === 0) {
    instance.flyTo([city.lat, city.lng], 12, { duration: animate ? 0.6 : 0 })
    return
  }
  if (companies.length === 1) {
    instance.flyTo([companies[0].lat, companies[0].lng], 13, {
      duration: animate ? 0.6 : 0,
    })
    return
  }
  const bounds = L.latLngBounds(
    companies.map((company) => [company.lat, company.lng] as L.LatLngTuple),
  ).pad(0.22)
  instance.flyToBounds(bounds, {
    maxZoom: 13,
    duration: animate ? 0.65 : 0,
    paddingTopLeft: [12, 36],
    paddingBottomRight: [12, 36],
  })
}
