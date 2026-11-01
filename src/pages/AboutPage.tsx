import { PageIntro } from "../components/PageIntro"
import { HowItWorks } from "../components/HowItWorks"
import { useReveal } from "../lib/hooks"
import {
  ArrowUpRight,
  Check,
  Globe,
  MapIcon,
  Pin,
} from "../components/icons"

const principles = [
  {
    icon: MapIcon,
    title: "Place before paper",
    body: "A neighbourhood tells you more about a company than a job title does. Start with the map, then read the role.",
  },
  {
    icon: Pin,
    title: "No black boxes",
    body: "Company pins go to real offices. Careers links go to the company’s own site. No middlemen, no application forms here.",
  },
  {
    icon: Globe,
    title: "One country, eight doors",
    body: "Bengaluru is not the whole story. Neither is Delhi, Mumbai or any single city. The map keeps the whole country in view.",
  },
]

export default function AboutPage() {
  useReveal("about")
  return (
    <div className="inner-page">
      <PageIntro
        kicker="A different way to find what’s next"
        title={
          <>
            Opportunity has an <span className="accent">address.</span>
          </>
        }
        lede="We’re making it a little easier to find. One company, one neighbourhood, one city at a time."
      >
        <div className="intro-actions" data-reveal>
          <a href="#/map" className="button button-primary">
            <MapIcon size={16} /> Find your next chapter <ArrowUpRight size={15} />
          </a>
          <a href="#/faq" className="button button-secondary">
            Read the details
          </a>
        </div>
      </PageIntro>

      <HowItWorks />

      <section className="about-story container">
        <div className="about-lede" data-reveal>
          <p className="kicker">Why a map</p>
          <h2>
            A map, not another endless <span className="accent">job board.</span>
          </h2>
        </div>
        <div className="about-copy" data-reveal>
          <p>
            Sometimes your next opportunity is a few streets away. Sometimes
            it’s a city you’ve always wanted to call home. Startup Arena gives
            you a different perspective: discover the teams around you, then
            explore where your skills could take you.
          </p>
          <p>
            This is an independent frontend concept inspired by BLR Startup
            Arena, expanded to eight Indian cities. The directory is curated
            sample data, locations are approximate, and career paths are
            illustrative. It is not affiliated with the original platform or the
            featured companies.
          </p>
        </div>
      </section>

      <section className="values-section container">
        {principles.map(({ icon: Icon, title, body }) => (
          <article className="value-card" key={title} data-reveal>
            <span className="value-icon">
              <Icon size={19} />
            </span>
            <h3>{title}</h3>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="about-closing container" data-reveal>
        <div>
          <p className="kicker">The fine print, in plain words</p>
          <h2>Built to be explored, not to collect your data.</h2>
          <ul className="check-list">
            <li>
              <Check size={14} /> No account required to browse
            </li>
            <li>
              <Check size={14} /> Applications happen on company sites
            </li>
            <li>
              <Check size={14} /> Sample data, clearly labelled
            </li>
          </ul>
        </div>
        <a href="#/map" className="button button-primary">
          Take a look around <ArrowUpRight size={16} />
        </a>
      </section>
    </div>
  )
}
