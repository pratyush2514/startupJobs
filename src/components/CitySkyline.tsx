export function CitySkyline({ variant = 0 }: { variant?: number }) {
  return (
    <svg
      viewBox="0 0 160 70"
      fill="none"
      aria-hidden="true"
      className="city-skyline"
    >
      <path
        d="M5 65H155M17 65V42H36V65M22 42V36H31V42M43 65V31H62V65M47 31V25H58V31M69 65V40H88V65M96 65V28H116V65M101 28V20H111V28M125 65V40H146V65M129 40V34H141V40"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d={
          variant % 3 === 0
            ? "M66 40V23C66 9 90 9 90 23V40M78 11V4M60 40H96M73 65V50C73 43 83 43 83 50V65"
            : variant % 3 === 1
              ? "M68 40V20H88V40M73 20V10H83V20M78 10V2M73 28H82M73 34H82"
              : "M65 40L78 14L91 40M72 40V34H84V40M78 14V5M61 40H95"
        }
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="M22 49H25M29 49H32M22 55H25M29 55H32M48 38H51M55 38H58M48 45H51M55 45H58M48 52H51M55 52H58M101 36H105M109 36H112M101 43H105M109 43H112M101 50H105M109 50H112M130 47H134M138 47H142M130 54H134M138 54H142"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  )
}
