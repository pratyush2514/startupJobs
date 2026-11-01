import type { SVGProps } from "react"

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number
  strokeWidth?: number
}

function Icon({
  size = 18,
  strokeWidth = 1.6,
  children,
  ...rest
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

export function Mark({ size = 24, ...rest }: IconProps) {
  return (
    <Icon size={size} aria-hidden="true" {...rest}>
      <path d="M12 21.2s6.9-6.1 6.9-11.1a6.9 6.9 0 1 0-13.8 0c0 5 6.9 11.1 6.9 11.1Z" />
      <path d="M8.9 10.9V9.7a3.1 3.1 0 0 1 6.2 0v1.2" />
      <path d="M7.7 10.9h8.6" />
    </Icon>
  )
}

export function ArrowRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12h15" />
      <path d="m13.5 6.2 5.8 5.8-5.8 5.8" />
    </Icon>
  )
}

export function ArrowUpRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7 17 17 7" />
      <path d="M8.6 7H17v8.4" />
    </Icon>
  )
}

export function ChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6.4 9.4 5.6 5.6 5.6-5.6" />
    </Icon>
  )
}

export function ChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9.4 6.4 5.6 5.6-5.6 5.6" />
    </Icon>
  )
}

export function Close(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
  )
}

export function Menu(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16M4 12h11M4 17h16" />
    </Icon>
  )
}

export function Search(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="10.8" cy="10.8" r="6.3" />
      <path d="m15.6 15.6 4.1 4.1" />
    </Icon>
  )
}

export function Sun(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.8v2.1M12 19.1v2.1M4.5 4.5l1.5 1.5M18 18l1.5 1.5M2.8 12h2.1M19.1 12h2.1M4.5 19.5 6 18M18 6l1.5-1.5" />
    </Icon>
  )
}

export function Moon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 14.3A8.3 8.3 0 0 1 9.7 4a8.3 8.3 0 1 0 10.3 10.3Z" />
    </Icon>
  )
}

export function Check(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5 12.6 4.4 4.4L19 7.4" />
    </Icon>
  )
}

export function Pin(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s6.3-5.7 6.3-10.4a6.3 6.3 0 1 0-12.6 0C5.7 15.3 12 21 12 21Z" />
      <circle cx="12" cy="10.4" r="2.2" />
    </Icon>
  )
}

export function MapIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 4.3-5 2v13.4l5-2 6 2 5-2V4.3l-5 2-6-2Z" />
      <path d="M9 4.3v13.4M15 6.3v13.4" />
    </Icon>
  )
}

export function ListIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 7h11M9 12h11M9 17h11" />
      <path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01" strokeWidth="2.2" />
    </Icon>
  )
}

export function GridIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="4" width="6.4" height="6.4" rx="1.2" />
      <rect x="13.6" y="4" width="6.4" height="6.4" rx="1.2" />
      <rect x="4" y="13.6" width="6.4" height="6.4" rx="1.2" />
      <rect x="13.6" y="13.6" width="6.4" height="6.4" rx="1.2" />
    </Icon>
  )
}

export function Sliders(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h6M14 7h6M4 17h4M12 17h8" />
      <circle cx="12" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </Icon>
  )
}

export function Globe(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M3.8 12h16.4" />
      <path d="M12 3.8c2.3 2.4 3.5 5.2 3.5 8.2S14.3 17.8 12 20.2C9.7 17.8 8.5 15 8.5 12S9.7 6.2 12 3.8Z" />
    </Icon>
  )
}

export function Building(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 20.5V5.2a1 1 0 0 1 1-1h7.2a1 1 0 0 1 1 1v15.3" />
      <path d="M13.7 9.4h4.8a1 1 0 0 1 1 1v10.1M3 20.5h18" />
      <path d="M7.7 8h2.7M7.7 11.7h2.7M7.7 15.4h2.7M16.2 13h.01M16.2 16.6h.01" />
    </Icon>
  )
}

export function Briefcase(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="7.5" width="17" height="12.5" rx="2" />
      <path d="M9 7.5V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v1.5M3.5 12.5h17" />
      <path d="M10.5 12.5v1.8h3v-1.8" />
    </Icon>
  )
}

export function Locate(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="6.2" />
      <circle cx="12" cy="12" r="1.6" />
      <path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3" />
    </Icon>
  )
}

export function Fit(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
      <path d="M4.8 4.9 9 9.1M15 9.1l4.2-4.2M4.8 19.1 9 14.9M15 14.9l4.2 4.2" opacity=".45" />
    </Icon>
  )
}

export function Plus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  )
}

export function Minus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 12h14" />
    </Icon>
  )
}

export function WifiOff(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 4.5 21 20.5" />
      <path d="M8.6 9.3a10.5 10.5 0 0 1 10.6 1.5M5.5 7.2a15 15 0 0 1 3-1.7" />
      <path d="M9.2 13a5.7 5.7 0 0 1 5.5.8M12 17.2h.01" strokeWidth="2.1" />
    </Icon>
  )
}

export function Refresh(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M19.5 11.5a7.5 7.5 0 1 0-1.3 5.3" />
      <path d="M19.8 5.4v6.1h-6.1" />
    </Icon>
  )
}

export function Info(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.3" />
      <path d="M12 11v5" />
      <path d="M12 7.9h.01" strokeWidth="2.2" />
    </Icon>
  )
}

export function ExternalLink(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13.5 4.5H20v6.5M20 4.5l-8.6 8.6" />
      <path d="M18 14.5v4a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4" />
    </Icon>
  )
}

export function Sprout(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 20v-7.5" />
      <path d="M12 12.5C9.5 12.5 7 11 7 7.5c3.5 0 5 1.5 5 5Z" />
      <path d="M12 10.5c0-3 1.7-4.9 4.8-4.9 0 3.5-1.7 4.9-4.8 4.9Z" />
      <path d="M6.5 20h11" />
    </Icon>
  )
}

export function Code(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9 8-4.2 4L9 16M15 8l4.2 4L15 16" />
    </Icon>
  )
}

export function Pen(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m4 20 4.2-1L19 8.2a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" />
      <path d="m14.5 6.7 3 3M4.8 15.6l3.6 3.6" />
    </Icon>
  )
}

export function Compass(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="m15.4 8.6-2 4.8-4.8 2 2-4.8 4.8-2Z" />
    </Icon>
  )
}

export function Layers(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m12 3.5 8.5 4.7-8.5 4.7-8.5-4.7 8.5-4.7Z" />
      <path d="m3.5 12.5 8.5 4.7 8.5-4.7M3.5 16.9l8.5 4.6 8.5-4.6" opacity=".5" />
    </Icon>
  )
}

export function ArrowLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 12H5" />
      <path d="M10.5 6.2 4.7 12l5.8 5.8" />
    </Icon>
  )
}

export function Building2(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 20.5V6.2a1.2 1.2 0 0 1 1.2-1.2h6.6a1.2 1.2 0 0 1 1.2 1.2v14.3" />
      <path d="M14 10h3.8a1.2 1.2 0 0 1 1.2 1.2v9.3M3 20.5h18" />
      <path d="M8 8.5h3M8 12h3M8 15.5h3" />
    </Icon>
  )
}
