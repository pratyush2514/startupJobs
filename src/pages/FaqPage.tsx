import { PageIntro } from "../components/PageIntro"
import { FAQ } from "../components/FAQ"
import { useReveal } from "../lib/hooks"
import { ArrowUpRight, MapIcon } from "../components/icons"

export default function FaqPage() {
  useReveal("faq")
  return (
    <div className="inner-page">
      <PageIntro
        kicker="A little clarity goes a long way"
        title={
          <>
            Good questions. Straight <span className="accent">answers.</span>
          </>
        }
        lede="Everything you need to know before you start exploring — including what this preview is, and what it isn’t."
      />
      <FAQ />
      <section className="faq-closing container" data-reveal>
        <span className="value-icon">
          <MapIcon size={19} />
        </span>
        <div>
          <h2>Still wondering where to start?</h2>
          <p>The map is the quickest answer. Pick a city and take a look around.</p>
        </div>
        <a href="#/map" className="button button-primary">
          Open the map <ArrowUpRight size={15} />
        </a>
      </section>
    </div>
  )
}
