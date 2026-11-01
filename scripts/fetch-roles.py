#!/usr/bin/env python3
"""Fetch real open roles from companies' public Greenhouse boards + RapidAPI.

Two sources, merged into one feed:
  1. Public Greenhouse boards (no key) — 6 companies, unlimited.
  2. RapidAPI "Company Career Sites Jobs API" (needs key) — every other
     company, pulled from their own ATS career sites (Greenhouse, Lever,
     Ashby, Workday, ...). ~1 call per company per refresh.

Only India-based roles are kept. Writes src/roles.ts (generated, committed).

The RapidAPI key is read from the RAPIDAPI_KEY environment variable —
never hardcode it, never commit it:
    RAPIDAPI_KEY=xxx python3 scripts/fetch-roles.py
Without the key, only the Greenhouse source runs.

Probe the raw API shape for one company:
    RAPIDAPI_KEY=xxx python3 scripts/fetch-roles.py --probe Razorpay
"""
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone

RAPIDAPI_HOST = "company-career-sites-jobs-api1.p.rapidapi.com"
RAPIDAPI_URL = f"https://{RAPIDAPI_HOST}/api/public/v1/jobs"

# Greenhouse board token -> our company ids (one board can feed two city pins)
BOARDS = {
    "druva": ["pune-druva"],
    "groww": ["bengaluru-groww"],
    "highradius": ["hyderabad-highradius"],
    "inmobi": ["bengaluru-inmobi"],
    "pubmatic": ["pune-pubmatic"],
    "zenoti": ["hyderabad-zenoti"],
}

CITY_HINTS = {
    "bengaluru": ["bengaluru", "bangalore"],
    "delhi": ["delhi", "gurugram", "gurgaon", "noida"],
    "mumbai": ["mumbai", "bombay"],
    "hyderabad": ["hyderabad"],
    "pune": ["pune"],
    "chennai": ["chennai", "madras"],
    "ahmedabad": ["ahmedabad", "amdavad"],
    "kolkata": ["kolkata", "calcutta"],
}


def fetch_board(token):
    url = f"https://boards-api.greenhouse.io/v1/boards/{token}/jobs"
    req = urllib.request.Request(url, headers={"User-Agent": "startup-arena/1.0"})
    with urllib.request.urlopen(req, timeout=25) as res:
        return json.load(res).get("jobs", [])


def meta_value(job, *names):
    for m in job.get("metadata") or []:
        if m.get("name") in names:
            v = m.get("value")
            if isinstance(v, list):
                return ", ".join(str(x) for x in v) if v else None
            return str(v) if v not in (None, False, "") else None
    return None


def infer_city(location, company_city):
    low = (location or "").lower()
    for city, hints in CITY_HINTS.items():
        if any(h in low for h in hints):
            return city
    # "India" with no city -> keep the company's own city
    return company_city


def infer_mode(job, location):
    low = (location or "").lower()
    if "remote" in low:
        return "remote"
    rv = meta_value(job, "Remote Position")
    if rv and rv.lower() == "true":
        return "remote"
    return None


def clean(s):
    return re.sub(r"\s+", " ", (s or "").strip()) or None


def join_list(v):
    if isinstance(v, list):
        v = ", ".join(str(x) for x in v if x)
    return clean(str(v)) if v else None


def first(d, *keys):
    for k in keys:
        if d.get(k):
            return d[k]
    return None


def normalize_rapidapi_job(j, source_tag):
    """Map a RapidAPI job object onto our Role fields (minus companyId/city).

    Field names are best-effort across plausible shapes; --probe dumps the
    real shape so this can be tightened after the first live run.
    """
    title = clean(first(j, "title", "jobTitle", "name"))
    location = clean(first(j, "location", "jobLocation"))
    city = clean(first(j, "city"))
    team = join_list(first(j, "department", "team", "category"))
    if not team:
        team = join_list(first(j, "subcategories", "subcategory"))
    level = join_list(first(j, "experienceLevel", "level", "seniority"))
    mode = (clean(first(j, "workMode", "workplace", "workplaceType")) or "").lower()
    if "remote" in mode:
        work_mode = "remote"
    elif "hybrid" in mode:
        work_mode = "hybrid"
    elif "onsite" in mode or "on-site" in mode or "office" in mode:
        work_mode = "onsite"
    else:
        work_mode = None
    posted = first(j, "postedAt", "datePosted", "publishedAt", "createdAt", "date")
    if posted is not None and not isinstance(posted, str):
        posted = str(posted)
    apply = clean(first(j, "applyUrl", "apply_url", "url", "jobUrl", "link"))
    jid = first(j, "id", "jobId")
    if not jid:
        jid = re.sub(r"\W+", "-", (title or "job").lower())[:40]
    return {
        "job_key": str(jid),
        "title": title,
        "team": team,
        "level": level,
        "location": location or city,
        "city_hint": city or location,
        "workMode": work_mode,
        "postedAt": posted,
        "applyUrl": apply,
        "source": source_tag,
    }


def fetch_rapidapi_company(name, api_key):
    """All India jobs for one company name, following cursor pages."""
    jobs = []
    cursor = None
    calls = 0
    while True:
        params = {"company": name, "countries": "India", "limit": "10"}
        if cursor:
            params["cursor"] = cursor
        req = urllib.request.Request(
            RAPIDAPI_URL + "?" + urllib.parse.urlencode(params),
            headers={
                "x-rapidapi-host": RAPIDAPI_HOST,
                "x-rapidapi-key": api_key,
            },
        )
        calls += 1
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.load(r)
        except urllib.error.HTTPError as e:
            if e.code == 403:
                body = e.read().decode()[:120]
                raise RuntimeError(
                    f"HTTP 403 — {body} "
                    "(subscribe to 'Company Career Sites Jobs API' on RapidAPI first)"
                )
            raise
        if isinstance(data, dict) and data.get("message") and not (
            data.get("jobs") or data.get("data")
        ):
            raise RuntimeError(f"API error: {data['message']}")
        batch = data.get("jobs") or data.get("data") or []
        jobs.extend(batch)
        cursor = (
            data.get("cursor") or data.get("nextCursor") or data.get("next_cursor")
        )
        if not cursor or not batch:
            break
    return jobs, calls


def probe_company(name, api_key):
    jobs, calls = fetch_rapidapi_company(name, api_key)
    print(f"{name}: {len(jobs)} jobs in {calls} call(s)")
    if jobs:
        j = jobs[0]
        print("top-level job keys:", sorted(j.keys()))
        for k in sorted(j.keys()):
            print(f"  {k}: {str(j[k])[:110]}")
        print("\nnormalized:")
        print(json.dumps(normalize_rapidapi_job(j, "rapidapi"), indent=2)[:800])


def load_companies():
    """id + name pairs from src/data.ts (company ids are city-prefixed)."""
    src = open("src/data.ts").read()
    pairs = re.findall(r'\{\s*id: "([^"]+)",\s*name: "([^"]+)"', src)
    return [(i, n) for i, n in pairs if "-" in i]


def run_rapidapi(api_key, roles, per_company):
    """Pull India roles for every company not on a direct Greenhouse feed."""
    companies = load_companies()
    covered_ids = {cid for ids in BOARDS.values() for cid in ids}
    by_name = {}
    for cid, name in companies:
        if cid in covered_ids:
            continue
        by_name.setdefault(name, []).append(cid)
    total_calls = 0
    for name, cids in sorted(by_name.items()):
        try:
            jobs, calls = fetch_rapidapi_company(name, api_key)
        except Exception as e:
            print(f"WARN rapidapi {name}: {e}")
            continue
        total_calls += calls
        n = 0
        for j in jobs:
            r = normalize_rapidapi_job(j, "rapidapi")
            if not r["title"] or not r["applyUrl"]:
                continue
            city = infer_city(r["city_hint"] or "", None)
            target = (
                next((c for c in cids if c.startswith(city + "-")), cids[0])
                if city
                else cids[0]
            )
            roles.append(
                {
                    "id": f"rapi-{target}-{r['job_key']}",
                    "companyId": target,
                    "title": r["title"],
                    "team": r["team"],
                    "level": r["level"],
                    "location": r["location"],
                    "city": city or target.split("-")[0],
                    "workMode": r["workMode"],
                    "postedAt": r["postedAt"],
                    "applyUrl": r["applyUrl"],
                }
            )
            per_company[target] = per_company.get(target, 0) + 1
            n += 1
        print(f"  rapidapi {name}: {n} India roles ({calls} calls)")
        time.sleep(0.5)  # stay polite on the free tier
    print(f"RapidAPI source: {total_calls} calls total")


def main():
    roles = []
    per_company = {}
    for token, company_ids in BOARDS.items():
        try:
            jobs = fetch_board(token)
        except Exception as e:
            print(f"WARN {token}: {e}")
            continue
        for job in jobs:
            loc = (job.get("location") or {}).get("name", "")
            if "india" not in loc.lower():
                continue
            for cid in company_ids:
                company_city = cid.split("-")[0]
                roles.append(
                    {
                        "id": f"{cid}-{job['id']}",
                        "companyId": cid,
                        "title": clean(job.get("title")),
                        "team": clean(
                            meta_value(job, "Sub Department", "Department", "Team")
                        ),
                        "level": clean(meta_value(job, "Designation", "Level")),
                        "location": clean(loc),
                        "city": infer_city(loc, company_city),
                        "workMode": infer_mode(job, loc),
                        "postedAt": job.get("first_published")
                        or job.get("updated_at"),
                        "applyUrl": job.get("absolute_url"),
                    }
                )
                per_company[cid] = per_company.get(cid, 0) + 1
    api_key = os.environ.get("RAPIDAPI_KEY")
    if api_key:
        run_rapidapi(api_key, roles, per_company)
    else:
        print("RAPIDAPI_KEY not set — Greenhouse source only.")

    roles.sort(key=lambda r: r["postedAt"] or "", reverse=True)
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")

    lines = [
        "/* GENERATED by scripts/fetch-roles.py — do not edit by hand.",
        f"   Fetched {fetched_at} from public Greenhouse boards + RapidAPI",
        "   Company Career Sites Jobs API (India roles only).",
        "   Re-run the script to refresh; set RAPIDAPI_KEY for full coverage. */",
        "",
        "export type WorkMode = \"remote\" | \"hybrid\" | \"onsite\";",
        "",
        "export type Role = {",
        "  id: string;",
        "  companyId: string;",
        "  title: string;",
        "  team: string | null;",
        "  level: string | null;",
        "  location: string | null;",
        "  city: string | null;",
        "  workMode: WorkMode | null;",
        "  postedAt: string | null;",
        "  /** The original posting on the company's own board — apply there. */",
        "  applyUrl: string;",
        "};",
        "",
        f"export const rolesFetchedAt = {json.dumps(fetched_at)};",
        "",
        "export const roles: Role[] = [",
    ]
    for r in roles:
        lines.append("  {")
        for k in ["id", "companyId", "title", "team", "level", "location",
                  "city", "workMode", "postedAt", "applyUrl"]:
            v = r[k]
            lines.append(f"    {k}: {json.dumps(v)},")
        lines.append("  },")
    lines.append("];")
    lines.append("")
    open("src/roles.ts", "w").write("\n".join(lines))
    print(f"wrote src/roles.ts: {len(roles)} India roles")
    for cid, n in sorted(per_company.items()):
        print(f"  {cid}: {n}")


if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "--probe":
        key = os.environ.get("RAPIDAPI_KEY")
        if not key:
            sys.exit("set RAPIDAPI_KEY first")
        probe_company(sys.argv[2], key)
    else:
        main()
