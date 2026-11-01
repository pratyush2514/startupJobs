import { Mark } from "./icons"

export function Brand({
  small = false,
  onNavigate,
}: {
  small?: boolean
  onNavigate?: () => void
}) {
  return (
    <a
      className={`brand${small ? " brand-small" : ""}`}
      href="#/"
      aria-label="Startup Arena India — home"
      onClick={onNavigate}
    >
      <span className="brand-symbol" aria-hidden="true">
        <Mark size={small ? 19 : 22} strokeWidth={1.7} />
      </span>
      <span className="brand-word">
        <span className="brand-name">
          startup<span>arena</span>
        </span>
        <span className="brand-country">India</span>
      </span>
    </a>
  )
}
