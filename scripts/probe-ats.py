#!/usr/bin/env python3
"""ATS auto-discovery probe.

Given a company name, probes the public APIs of the "guessable" ATS
platforms (Lever, Greenhouse, SmartRecruiters, Ashby) with slug variations
and reports which board — if any — the company uses.

This is the dynamic alternative to hardcoding per-company ATS configs:
run this when onboarding a company, verify the hit, then add the
discovered (platform, slug) to the fetcher config.

Platforms NOT guessable (need manual config): Workday (tenant+wd number),
Keka (portal ID), TurboHire (org GUID), Kula, and fully custom boards.

Usage:
    python3 scripts/probe-ats.py "Razorpay"
    python3 scripts/probe-ats.py "PhonePe" --json
"""

import json
import re
import sys
import urllib.request

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
)
TIMEOUT = 20


def slug_variants(name):
    """Generate likely ATS slugs from a company name.

    Boards are inconsistent: some use the bare name ("cred"), others the
    full legal name ("razorpaysoftwareprivatelimited", "PHONEPELIMITED").
    So we try the stripped base, the raw name, and the base with common
    legal suffixes appended.
    """
    raw = name.strip().lower()
    raw_compact = re.sub(r"[^a-z0-9]", "", raw)
    base = re.sub(
        r"\b(inc|llc|ltd|limited|labs|technologies|technology|solutions|"
        r"systems|software|private|pvt|corp|corporation|company|co)\b",
        "",
        raw,
    ).strip()
    compact = re.sub(r"[^a-z0-9]", "", base)
    dashed = re.sub(r"[^a-z0-9]+", "-", base).strip("-")
    variants = []
    for v in (compact, dashed, raw_compact):
        if v and v not in variants:
            variants.append(v)
    # legal-suffix appends: "phonepe" -> "phonepelimited" etc.
    for suffix in ("limited", "ltd", "inc", "labs", "technologies"):
        v = compact + suffix
        if v not in variants:
            variants.append(v)
    return variants


def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    resp = urllib.request.urlopen(req, timeout=TIMEOUT)
    return json.loads(resp.read().decode("utf-8", "replace"))


def probe_lever(slug):
    try:
        data = get_json(f"https://api.lever.co/v0/postings/{slug}?mode=json")
    except Exception:
        return None
    if isinstance(data, list) and data:
        return {"platform": "lever", "slug": slug, "jobs": len(data)}
    return None


def probe_greenhouse(slug):
    try:
        data = get_json(
            f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"
        )
    except Exception:
        return None
    jobs = data.get("jobs") if isinstance(data, dict) else None
    if jobs:
        return {"platform": "greenhouse", "slug": slug, "jobs": len(jobs)}
    return None


def probe_smartrecruiters(slug):
    # SR company ids vary in case ("phonepelimited" vs "PHONEPELIMITED"
    # can be different records) — try all, keep the richest hit.
    best = None
    for variant in (slug, slug.upper(), slug.lower()):
        try:
            data = get_json(
                f"https://api.smartrecruiters.com/v1/companies/"
                f"{variant}/postings?limit=5"
            )
        except Exception:
            continue
        total = data.get("totalFound", 0)
        content = data.get("content") or []
        jobs = total or len(content)
        if jobs and (best is None or jobs > best["jobs"]):
            best = {
                "platform": "smartrecruiters",
                "slug": variant,
                "jobs": jobs,
            }
    return best


def probe_ashby(slug):
    try:
        data = get_json(
            f"https://api.ashbyhq.com/posting-api/job-board/{slug}"
        )
    except Exception:
        return None
    jobs = data.get("jobs") if isinstance(data, dict) else None
    if jobs:
        return {"platform": "ashby", "slug": slug, "jobs": len(jobs)}
    return None


PROBES = [probe_lever, probe_greenhouse, probe_smartrecruiters, probe_ashby]


def discover(name, extra_slugs=()):
    hits = []
    tried = set()
    for slug in list(extra_slugs) + slug_variants(name):
        for probe in PROBES:
            key = (probe.__name__, slug)
            if key in tried:
                continue
            tried.add(key)
            hit = probe(slug)
            if hit and hit not in hits:
                hits.append(hit)
    return hits


def config_snippet(name, hit):
    p = hit["platform"]
    s = hit["slug"]
    if p == "lever":
        return f'    "{s}": ["<company-id>"],  # LEVER_BOARDS'
    if p == "greenhouse":
        return f'    "{s}": ["<company-id>"],  # GREENHOUSE_BOARDS'
    if p == "smartrecruiters":
        return f'    "{s}": ["<company-id>"],  # SMARTRECRUITERS'
    if p == "ashby":
        return f'    "{s}": ["<company-id>"],  # ASHBY_BOARDS'
    return ""


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    as_json = "--json" in sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    name = " ".join(args)
    extra = []
    if "--slug" in sys.argv[1:]:
        i = sys.argv.index("--slug")
        extra = sys.argv[i + 1].split(",")
    hits = discover(name, extra_slugs=extra)
    if as_json:
        print(json.dumps({"company": name, "hits": hits}, indent=2))
        return
    print(f"Probing ATS boards for: {name}")
    print(f"  slug variants tried: {', '.join(slug_variants(name))}")
    if not hits:
        print("  No hits on Lever / Greenhouse / SmartRecruiters / Ashby.")
        print("  Likely: Workday, Keka, TurboHire, Kula, or a custom board —")
        print("  needs manual config (or a browser check).")
        return
    for h in hits:
        print(f"  HIT: {h['platform']:16s} slug={h['slug']!r:40s} "
              f"~{h['jobs']} jobs")
        print(f"       config: {config_snippet(name, h)}")
    print("\nVerify the slug really is this company (not a namesake),")
    print("then add the config with the real <company-id>.")


if __name__ == "__main__":
    main()
