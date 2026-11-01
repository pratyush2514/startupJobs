import { PageIntro } from "../components/PageIntro"
import { Pricing } from "../components/Pricing"
import { FAQ } from "../components/FAQ"
import { useReveal } from "../lib/hooks"

export default function PricingPage() {
  useReveal("pricing")
  return (
    <div className="inner-page">
      <PageIntro
        kicker="Less friction, more possibility"
        title={
          <>
            Your ambition doesn’t need a <span className="accent">paywall.</span>
          </>
        }
        lede="Start with discovery. The map, the directory, the filters and every official careers link are free — and stay that way."
      />
      <Pricing standalone />
      <FAQ />
      <p className="fine-print container">
        No account, no card, no application fees. Startup Arena never charges
        candidates to explore.
      </p>
    </div>
  )
}
