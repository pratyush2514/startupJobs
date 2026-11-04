import type { Metadata } from "next";
import { Suspense } from "react";
import { siteMeta } from "@/lib/site";
import { JobsContent } from "./_content";

export const metadata: Metadata = {
  title: siteMeta.jobs.title,
  description: siteMeta.jobs.description,
};

export default function JobsPage() {
  return (
    <Suspense>
      <JobsContent />
    </Suspense>
  );
}
