import { ArrowRight, ArrowUpRight, Check, Compass } from "./icons"

const included = [
  "Every city and every company on the map",
  "Company profiles and neighbourhood filters",
  "Direct links to official careers pages",
  "No account, no card, no paywall",
]

export function Pricing({ standalone = false }: { standalone?: boolean }) {
  return (
    <section className={`section pricing-section container${standalone ? " is-standalone" : ""}`}>
      {!standalone && (
        <div className="section-heading" data-reveal>
          <div>
            <p className="kicker">Opportunity should be open</p>
            <h2>Start exploring. Stay curious.</h2>
          </div>
          <a href="#/pricing" className="text-link">
            More about access <ArrowRight size={15} />
          </a>
        </div>
      )}
      <div className="pricing-grid">
        <article className="pricing-card" data-reveal>
          <div className="pricing-card-head">
            <div>
              <span className="pricing-name">Explorer</span>
              <p>For a little curiosity, and your next big move.</p>
            </div>
            <span className="pricing-badge">Free, always</span>
          </div>
          <div className="price">
            <strong>₹0</strong>
            <span>no strings attached</span>
          </div>
          <ul>
            {included.map((item) => (
              <li key={item}>
                <span className="list-check">
                  <Check size={13} />
                </span>
                {item}
              </li>
            ))}
          </ul>
          <a className="button button-primary" href="#/map">
            Start exploring <ArrowUpRight size={16} />
          </a>
        </article>

        <article className="pricing-card is-future" data-reveal>
          <div className="future-head">
            <span className="future-icon">
              <Compass size={19} />
            </span>
            <span className="pricing-badge is-plain">On the horizon</span>
          </div>
          <h3>
            A little more direction.
            <br />
            A lot more possibility.
          </h3>
          <p>
            Personalised matches, a place to keep track of your journey, and
            tools that help you make the next move with confidence.
          </p>
          <div className="future-note">
            We’re just getting started. These features aren’t part of this
            preview yet.
          </div>
          <a href="#/faq" className="text-link">
            Get to know Startup Arena <ArrowRight size={15} />
          </a>
        </article>
      </div>
    </section>
  )
}
