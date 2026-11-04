import type { Metadata } from "next";
import { Suspense } from "react";
import { siteMeta } from "@/lib/site";
import { MapContent } from "./_content";

export const metadata: Metadata = {
  title: siteMeta.map.title,
  description: siteMeta.map.description,
};

export default function MapPage() {
  return (
    <Suspense>
      <MapContent />
    </Suspense>
  );
}
