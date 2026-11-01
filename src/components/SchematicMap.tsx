import { useMemo } from "react"
import { type City, type Company } from "../data"
import { monogram, readableOn } from "../lib/utils"
import { Pin } from "./icons"

function project(company: Company, city: City, companies: Company[]) {
  const points = [...companies.map((c) => [c.lat, c.lng]), [city.lat, city.lng]]
  const lats = points.map((p) => p[0])
  const lngs = points.map((p) => p[1])
  let minLat = Math.min(...lats)
  let maxLat = Math.max(...lats)
  let minLng = Math.min(...lngs)
  let maxLng = Math.max(...lngs)
  const latPad = Math.max((maxLat - minLat) * 0.28, 0.024)
  const lngPad = Math.max((maxLng - minLng) * 0.28, 0.03)
  minLat -= latPad
  maxLat += latPad
  minLng -= lngPad
  maxLng += lngPad
  const x = ((company.lng - minLng) / (maxLng - minLng)) * 100
  const y = (1 - (company.lat - minLat) / (maxLat - minLat)) * 100
  return {
    left: Math.min(94, Math.max(6, x)),
    top: Math.min(88, Math.max(12, y)),
  }
}

const labelPositions = [
  { left: "14%", top: "22%" },
  { left: "66%", top: "16%" },
  { left: "18%", top: "72%" },
  { left: "68%", top: "76%" },
]

export function SchematicMap({
  city,
  companies,
  onSelect,
  note = "Schematic view",
  busy = false,
  preview = false,
}: {
  city: City
  companies: Company[]
  onSelect: (company: Company) => void
  note?: string
  busy?: boolean
  preview?: boolean
}) {
  const pins = useMemo(
    () =>
      companies.map((company) => ({
        company,
        ...project(company, city, companies),
      })),
    [companies, city],
  )

  return (
    <div
      className={`schematic${preview ? " is-preview" : ""}`}
      role="group"
      aria-label={`${companies.length} companies in ${city.name}, shown on a schematic map`}
      aria-busy={busy}
    >
      <svg
        className="schematic-art"
        viewBox="0 0 1000 620"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <g className="schematic-blocks">
          <rect x="70" y="56" width="132" height="76" rx="8" />
          <rect x="220" y="42" width="86" height="92" rx="8" />
          <rect x="326" y="64" width="158" height="62" rx="8" />
          <rect x="510" y="40" width="108" height="112" rx="8" />
          <rect x="642" y="62" width="70" height="88" rx="8" />
          <rect x="736" y="48" width="158" height="72" rx="8" />
          <rect x="56" y="170" width="104" height="126" rx="8" />
          <rect x="184" y="172" width="174" height="70" rx="8" />
          <rect x="386" y="160" width="92" height="88" rx="8" />
          <rect x="502" y="188" width="150" height="60" rx="8" />
          <rect x="676" y="176" width="90" height="134" rx="8" />
          <rect x="790" y="160" width="122" height="82" rx="8" />
          <rect x="70" y="330" width="126" height="86" rx="8" />
          <rect x="220" y="300" width="92" height="142" rx="8" />
          <rect x="338" y="282" width="168" height="72" rx="8" />
          <rect x="532" y="284" width="102" height="116" rx="8" />
          <rect x="660" y="344" width="142" height="70" rx="8" />
          <rect x="826" y="286" width="92" height="120" rx="8" />
          <rect x="92" y="462" width="156" height="84" rx="8" />
          <rect x="278" y="470" width="106" height="78" rx="8" />
          <rect x="410" y="392" width="88" height="156" rx="8" />
          <rect x="528" y="436" width="156" height="112" rx="8" />
          <rect x="708" y="446" width="98" height="94" rx="8" />
          <rect x="828" y="438" width="98" height="112" rx="8" />
        </g>
        <g className="schematic-parks">
          <path d="M330 470h54v58h-54zM680 176h66v58h-66z" />
        </g>
        <path
          className="schematic-river"
          d="M-20 500c120-30 168-4 248-28s108-72 196-64 128 54 220 32 130-78 240-62 130 20 156 10"
        />
        <g className="schematic-roads">
          <path d="M-20 150c180 30 250 16 390 26s230 54 350 44 220-10 300-22" />
          <path d="M-20 390c160-38 290-20 420-10s260 26 380 4 190-24 240-18" />
          <path d="M170 -20c14 142 58 190 58 302s-24 196 6 358" />
          <path d="M480 -20c-10 130 32 186 22 292s-38 178-10 368" />
          <path d="M760 -20c-8 120 44 180 26 282s-18 178 8 378" />
          <path d="M110 620c60-88 96-104 168-122M600 620c80-64 108-102 158-142M900 620c-30-92-18-130 0-190" />
        </g>
        <path
          className="schematic-avenue"
          d="M-20 254 1020 214"
          aria-hidden="true"
        />
        <g className="schematic-markers" aria-hidden="true">
          <circle cx="486" cy="274" r="5" />
          <circle cx="486" cy="274" r="13" />
          <path d="M486 254v-16" />
        </g>
      </svg>

      {city.areas.slice(0, preview ? 2 : 4).map((area, index) => (
        <span
          className="schematic-area"
          key={area}
          style={
            {
              left: labelPositions[index].left,
              top: labelPositions[index].top,
              "--area-delay": `${index * 90}ms`,
            } as React.CSSProperties
          }
        >
          {area}
        </span>
      ))}

      <div className="schematic-pins">
        {pins.map(({ company, left, top }, index) => (
          <button
            type="button"
            className="schematic-pin"
            key={company.id}
            style={
              {
                left: `${left}%`,
                top: `${top}%`,
                "--pin": company.color,
                "--pin-ink": readableOn(company.color),
                "--pin-delay": `${Math.min(index, 11) * 35}ms`,
              } as React.CSSProperties
            }
            onClick={() => onSelect(company)}
            aria-label={`${company.name}, ${company.area}, ${city.name}`}
          >
            <span className="schematic-pin-body">
              {monogram(company.name)}
            </span>
            <em>{company.name}</em>
          </button>
        ))}
      </div>

      <span className="schematic-note">
        <Pin size={12} />
        {note}
      </span>
      <span className="schematic-compass" aria-hidden="true">
        <i>N</i>
        <span />
      </span>
    </div>
  )
}
