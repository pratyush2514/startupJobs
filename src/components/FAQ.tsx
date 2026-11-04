import { faqs } from "../data/companies"

export function FAQ() {
  return (
    <section className="section faq-section container">
      <div className="faq-head" data-reveal>
        <div>
          <p className="kicker">Before you start</p>
          <h2>A few things worth knowing.</h2>
        </div>
        <p className="section-aside">
          Can’t find your answer? Every company’s own website is the final word.
        </p>
      </div>
      <div className="faq-list" data-reveal>
        {faqs.map(([question, answer]) => (
          <details key={question}>
            <summary>
              <span>{question}</span>
              <span className="faq-toggle" aria-hidden="true">
                <i />
                <i />
              </span>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
