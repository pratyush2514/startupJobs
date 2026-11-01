import type { ReactNode } from "react"

export function PageIntro({
  kicker,
  title,
  lede,
  children,
}: {
  kicker: string
  title: ReactNode
  lede: string
  children?: ReactNode
}) {
  return (
    <header className="page-intro container">
      <p className="kicker" data-reveal>
        {kicker}
      </p>
      <h1 data-reveal>{title}</h1>
      <p className="page-lede" data-reveal>
        {lede}
      </p>
      {children}
    </header>
  )
}
