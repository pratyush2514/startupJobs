import {
  ArrowUpRight,
  Briefcase,
  Check,
  Code,
  Pen,
  Pin,
  Search,
} from "./icons"

const steps = [
  {
    number: "01",
    title: "Put possibility on the map",
    body: "Pick a city, then a neighbourhood. See the teams building close to where you already are.",
    art: (
      <div className="step-art map-art">
        <div className="mini-road mini-road-a" />
        <div className="mini-road mini-road-b" />
        <div className="mini-road mini-road-c" />
        {[1, 2, 3, 4, 5].map((n) => (
          <span className={`mini-pin mini-pin-${n}`} key={n}>
            <Pin size={n === 3 ? 21 : 15} />
          </span>
        ))}
        <span className="mini-label mini-label-search">
          <Search size={11} /> Your next opportunity
        </span>
      </div>
    ),
  },
  {
    number: "02",
    title: "Find a team that feels right",
    body: "Look past the job title. Get a feel for the industry, the neighbourhood and the people.",
    art: (
      <div className="step-art company-art">
        <div className="mini-profile">
          <div className="mini-profile-head">
            <span className="mini-profile-mark">A</span>
            <i>Hiring</i>
          </div>
          <span className="mini-line is-long" />
          <span className="mini-line" />
          <span className="mini-line is-short" />
          <div className="mini-tags">
            <span>
              <Code size={9} /> Engineering
            </span>
            <span>
              <Pen size={9} /> Design
            </span>
          </div>
        </div>
        <span className="mini-label mini-label-check">
          <Check size={12} /> Your kind of team
        </span>
      </div>
    ),
  },
  {
    number: "03",
    title: "Go straight to the source",
    body: "Found your place? Head to the company’s own careers page. No middlemen, no detours.",
    art: (
      <div className="step-art move-art">
        <div className="mini-job">
          <span className="mini-job-icon">
            <Briefcase size={16} />
          </span>
          <span className="mini-job-copy">
            <strong>Your next big move</strong>
            <small>A new chapter awaits</small>
          </span>
          <ArrowUpRight size={15} />
        </div>
        <div className="mini-apply">
          <span>Make your move</span>
          <ArrowUpRight size={13} />
        </div>
        <span className="mini-label mini-label-source">Official careers page</span>
      </div>
    ),
  },
]

export function HowItWorks() {
  return (
    <section className="section how-section container">
      <div className="section-heading" data-reveal>
        <div>
          <p className="kicker">Less scrolling, more discovering</p>
          <h2>A fresh way to find what’s next.</h2>
        </div>
        <p className="section-aside">Three small steps. One big move.</p>
      </div>
      <div className="steps-grid">
        {steps.map((step) => (
          <article className="step-card" key={step.number} data-reveal>
            {step.art}
            <div className="step-copy">
              <span className="step-number">{step.number}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
