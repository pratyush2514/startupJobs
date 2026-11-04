import type { Metadata } from "next";
import Link from "next/link";
import { FAQ } from "@/components/FAQ";
import { ArrowUpRight, MapIcon } from "@/components/icons";
import { PageIntro } from "@/components/PageIntro";
import { siteMeta } from "@/lib/site";

export const metadata: Metadata = {
  title: siteMeta.faq.title,
  description: siteMeta.faq.description,
};

export default function Faq() {
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
          <p>
            The map is the quickest answer. Pick a city and take a look around.
          </p>
        </div>
        <Link href="/map" className="button button-primary">
          Open the map <ArrowUpRight size={15} />
        </Link>
      </section>
    </div>
  );
}
