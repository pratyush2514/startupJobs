import type { Metadata } from "next";
import { Suspense } from "react";
import { siteMeta } from "@/lib/site";
import { CompaniesContent } from "./_content";

export const metadata: Metadata = {
  title: siteMeta.companies.title,
  description: siteMeta.companies.description,
};

export default function CompaniesPage() {
  return (
    <Suspense>
      <CompaniesContent />
    </Suspense>
  );
}
