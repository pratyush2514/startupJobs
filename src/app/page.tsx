import type { Metadata } from "next";
import { siteMeta } from "@/lib/site";
import { HomeContent } from "./_home";

export const metadata: Metadata = {
  title: siteMeta.home.title,
  description: siteMeta.home.description,
};

export default function HomePage() {
  return <HomeContent />;
}
