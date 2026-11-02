#!/usr/bin/env python3
"""Fetch real open roles from companies' public ATS boards + RapidAPI.

Sources, merged into one feed (all free and keyless except the last):
  1. Public Greenhouse boards — 7 companies, unlimited.
  2. Public Lever boards (api.lever.co) — 3 companies, unlimited.
  3. Public SmartRecruiters API — Freshworks (2 pins), unlimited.
  4. RapidAPI "Company Career Sites Jobs API" (needs key) — every other
     company, pulled from their own ATS career sites. ~1 call per company
     per refresh; the free Basic tier is ~50 requests/month, so the direct
     feeds above exist to keep the API bill inside that quota.

Only India-based roles are kept. Writes src/roles.ts (generated, committed).

The RapidAPI key is read from the RAPIDAPI_KEY environment variable —
never hardcode it, never commit it:
    RAPIDAPI_KEY=xxx python3 scripts/fetch-roles.py
Without the key, only the Greenhouse source runs.

Probe the raw API shape for one company:
    RAPIDAPI_KEY=xxx python3 scripts/fetch-roles.py --probe Razorpay

Refresh only some companies (after a rate-limit pause, for example):
    RAPIDAPI_KEY=xxx python3 scripts/fetch-roles.py --only PhonePe,Swiggy,Zepto
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

# Aggregator domains that must never appear as an applyUrl — every role
# has to link to the company's OWN posting, never a middleman board.
BLOCKED_APPLY_DOMAINS = {
    "himalayas.app",
    "www.himalayas.app",
    "linkedin.com",
    "www.linkedin.com",
    "indeed.com",
    "www.indeed.com",
    "naukri.com",
    "www.naukri.com",
}


def apply_url_ok(url):
    host = urllib.parse.urlparse(url or "").hostname or ""
    return host not in BLOCKED_APPLY_DOMAINS

# Greenhouse board token -> our company ids (one board can feed two city pins)
BOARDS = {
    "druva": ["pune-druva"],
    "groww": ["bengaluru-groww"],
    "highradius": ["hyderabad-highradius"],
    "inmobi": ["bengaluru-inmobi"],
    "pubmatic": ["pune-pubmatic"],
    "zenoti": ["hyderabad-zenoti"],
    # board slug discovered via the RapidAPI Career Sites feed
    "razorpaysoftwareprivatelimited": ["bengaluru-razorpay"],
    # MNC batch 2026-11-02 — boards discovered via scripts/probe-ats.py,
    # India-role counts verified before onboarding
    "databricks": ["bengaluru-databricks"],
    "mongodb": ["delhi-mongodb"],
    "stripe": ["bengaluru-stripe"],
    "gitlab": ["bengaluru-gitlab"],
    "coinbase": ["hyderabad-coinbase"],
    "elastic": ["bengaluru-elastic"],
    "datadog": ["bengaluru-datadog"],
    "twilio": ["bengaluru-twilio"],
}

# Lever board slug -> our company ids (public JSON, no key)
LEVER_BOARDS = {
    "cred": ["bengaluru-cred"],
    "meesho": ["bengaluru-meesho"],
    "mindtickle": ["pune-mindtickle"],
}

# SmartRecruiters company name -> our company ids (public JSON, no key)
SMARTRECRUITERS = {
    "Freshworks": ["bengaluru-freshworks", "chennai-freshworks"],
    # Discovered 2026-11-02 via browser extraction: PhonePe's board is
    # SmartRecruiters (jobs.smartrecruiters.com/PHONEPELIMITED), 131 roles.
    "PHONEPELIMITED": ["bengaluru-phonepe"],
}

# Ashby board slug -> our company ids (public JSON, no key)
ASHBY_BOARDS = {}

# Kula (careers.kula.ai) board slug -> our company ids.
# Kula is a Next.js board; jobs come from the __next_f flight data.
KULA_BOARDS = {
    "rocketlane": ["chennai-rocketlane"],
}

# Swiggy serves a public jobs JSON (see fetch_swiggy).
SWIGGY_IDS = ["bengaluru-swiggy"]

# TurboHire tenants: (subdomain, org GUID) -> our company ids.
# GUID comes from the tenant's /careerpage/{guid} URL.
TURBOHIRE_TENANTS = {
    ("flipkart", "4d757ba0-3d57-448a-b82c-238ed87ac90f"): ["bengaluru-flipkart"],
}

# Company ids with bespoke public JSON feeds (see fetch_* above).
UPSTOX_IDS = ["mumbai-upstox"]
URBANCOMPANY_IDS = ["delhi-urban-company"]
ZERODHA_IDS = ["bengaluru-zerodha"]

# Keka: (subdomain, portal identifier) -> our company ids.
# The identifier comes from the careers page's embed script URL:
#   {sub}.keka.com/careers -> /careers/api/embedjobs/js/{identifier}
KEKA_PORTALS = {
    ("bacancy", "24b25cc8-8f4c-48f1-905a-60b46a99c09c"): ["ahmedabad-bacancy"],
}

# Workday: (tenant, wd_number, site) -> our company ids.
# Discovered from apply URLs like {tenant}.wd{N}.myworkdayjobs.com.
# Public JSON: POST https://{tenant}.wd{N}.myworkdayjobs.com/wday/cxs/{tenant}/{site}/jobs
WORKDAY_BOARDS = {
    ("postman", "108", "careers"): ["bengaluru-postman"],
}


def fetch_workday(tenant, wdnum, site):
    """Yield jobPostings dicts from a Workday board (paged).

    Uses curl via subprocess: Workday 302-redirects urllib's POST into a
    broken GET (HTTP 400); curl handles it cleanly. Public JSON, no key.
    """
    import json as _json
    import subprocess

    base = "https://%s.wd%s.myworkdayjobs.com" % (tenant, wdnum)
    url = "%s/wday/cxs/%s/%s/jobs" % (base, tenant, site)
    # Workday 400s when limit > 20; paginate instead.
    limit, offset = 20, 0
    seen_total = None
    ua = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
          "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
    while True:
        body = _json.dumps(
            {"appliedFacets": {}, "limit": limit, "offset": offset,
             "searchText": ""}
        )
        proc = subprocess.run(
            ["curl", "-s", "--max-time", "25", "-X", "POST", "-A", ua,
             "-H", "Content-Type: application/json",
             "-d", body, url],
            capture_output=True, text=True, timeout=40,
        )
        if proc.returncode != 0 or not proc.stdout.strip().startswith("{"):
            raise RuntimeError("workday %s: bad response" % tenant)
        data = _json.loads(proc.stdout)
        postings = data.get("jobPostings") or []
        if seen_total is None:
            seen_total = data.get("total") or 0
        for p in postings:
            yield p
        offset += len(postings)
        if offset >= seen_total or not postings:
            break


def workday_role(job, base_url, cid):
    title = (job.get("title") or "").strip()
    if not title:
        return None
    ext = job.get("externalPath") or ""
    apply_url = (base_url + ext) if ext.startswith("/") else (ext or None)
    loc = (job.get("locationsText") or "").strip() or None
    posted_on = job.get("postedOn")  # e.g. "30+ Days Ago"
    bullets = job.get("bulletFields") or []
    team = bullets[0] if bullets else None
    rid = "wd-%s-%s" % (cid, abs(hash((title, loc or "", ext))) % 10**10)
    return {
        "id": rid,
        "companyId": cid,
        "title": title,
        "team": team,
        "level": None,
        "location": loc,
        "city": infer_city(loc, cid.split("-")[0]) if loc else None,
        "workMode": None,
        "postedAt": None,
        "applyUrl": apply_url,
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


def fetch_lever(slug):
    """Public Lever postings API — returns a JSON array, no key needed."""
    url = f"https://api.lever.co/v0/postings/{slug}?mode=json"
    req = urllib.request.Request(url, headers={"User-Agent": "startup-arena/1.0"})
    with urllib.request.urlopen(req, timeout=25) as res:
        data = json.load(res)
    return data if isinstance(data, list) else []


_KULA_BS = chr(92)  # backslash — avoids literal-escaping ambiguity





def fetch_upstox():
    """Upstox's public content API — no key.

    Discovered 2026-11-01: service.upstox.com/content/open/v1/jobs/
    returns {"success":true,"data":[...]}. Only rows with
    post_on_careers_page="1" are genuinely open (rest are internal/dummy).
    location/location_city are Python-stringified lists — literal_eval them.
    Apply URLs go to Upstox's official Darwinbox board.
    """
    import ast as _ast

    url = "https://service.upstox.com/content/open/v1/jobs/"
    req = urllib.request.Request(url, headers={"User-Agent": "startup-arena/1.0"})
    with urllib.request.urlopen(req, timeout=25) as res:
        data = json.load(res)
    jobs = data.get("data") if isinstance(data, dict) else []
    out = []
    for j in jobs or []:
        if str(j.get("post_on_careers_page")) != "1":
            continue
        if (j.get("location_country") or "") != "India":
            continue
        try:
            cities = _ast.literal_eval(j.get("location_city") or "[]")
        except (ValueError, SyntaxError):
            cities = []
        try:
            locs = _ast.literal_eval(j.get("location") or "[]")
        except (ValueError, SyntaxError):
            locs = []
        j = dict(j)
        j["_cities"] = [c for c in cities if isinstance(c, str)]
        j["_locs"] = [x for x in locs if isinstance(x, str)]
        out.append(j)
    return out


def upstox_role(job, cid):
    city = (job.get("_cities") or [""])[0]
    loc = (job.get("_locs") or [""])[0] or city
    jid = job.get("job_id") or ""
    exp_f, exp_t = job.get("experience_from"), job.get("experience_to")
    level = None
    if exp_f is not None or exp_t is not None:
        level = f"{exp_f or '?'}-{exp_t or '?'} yrs"
    return {
        "id": f"upstox-{cid}-{jid}",
        "companyId": cid,
        "title": clean(job.get("job_title")),
        "team": clean(job.get("department")),
        "level": level,
        "location": clean(loc),
        "city": infer_city(loc or city, cid.split("-")[0]),
        "workMode": "remote" if str(job.get("is_remote")) == "1" else "onsite",
        "postedAt": (job.get("job_updated_timestamp") or "")[:10] or None,
        "applyUrl": (
            f"https://upstox.darwinbox.in/ms/candidatev2/main/careers"
            f"/jobDetails/{jid}?from=all" if jid else None
        ),
    }


def fetch_urbancompany():
    """Urban Company's public gateway API — no key.

    Discovered 2026-11-01: POST dev.urbanclap.com/api/v2/platform-gateway/getAllJobs
    with {} body. Returns the job list; apply_url points at Urban Company's
    own TurboHire board.
    """
    import subprocess

    # NOTE: urllib intermittently truncates this response; curl is reliable.
    out = subprocess.run(
        ["curl", "-s", "--max-time", "25", "-A", "startup-arena/1.0",
         "-X", "POST", "-H", "Content-Type: application/json",
         "-d", "{}",
         "https://dev.urbanclap.com/api/v2/platform-gateway/getAllJobs"],
        capture_output=True, text=True, timeout=40,
    )
    data = json.loads(out.stdout)
    if isinstance(data, dict):
        for k in ("jobs", "data", "result"):
            if isinstance(data.get(k), list):
                return data[k]
        return []
    return data if isinstance(data, list) else []


def urbancompany_role(job, cid):
    cities = job.get("location_city") or []
    locs = job.get("location") or []
    city = cities[0] if cities else ""
    loc = locs[0] if locs else city
    return {
        "id": f"uc-{cid}-{job.get('job_id')}",
        "companyId": cid,
        "title": clean(job.get("job_title")),
        "team": clean(job.get("parent_department")),
        "level": None,
        "location": clean(loc),
        "city": infer_city(loc or city, cid.split("-")[0]),
        "workMode": None,
        "postedAt": None,
        "applyUrl": job.get("apply_url"),
    }


def fetch_zerodha():
    """Zerodha's public jobs API — no key.

    Discovered 2026-11-01: careers.zerodha.com is a Vite SPA fetching
    /api/jobs -> {"count":N,"data":[...],"success":true}.
    Currently 0 open roles; wired so postings flow automatically.
    """
    url = "https://careers.zerodha.com/api/jobs"
    req = urllib.request.Request(url, headers={"User-Agent": "startup-arena/1.0"})
    with urllib.request.urlopen(req, timeout=25) as res:
        data = json.load(res)
    jobs = data.get("data") if isinstance(data, dict) else []
    return jobs if isinstance(jobs, list) else []


def zerodha_role(job, cid):
    # Shape TBD — endpoint currently returns []. Best-effort mapping;
    # refine when Zerodha posts roles.
    jid = job.get("id") or job.get("job_id") or ""
    return {
        "id": f"zerodha-{cid}-{jid}",
        "companyId": cid,
        "title": clean(job.get("title") or job.get("job_title")),
        "team": clean(job.get("department") or job.get("team")),
        "level": None,
        "location": clean(job.get("location") or ""),
        "city": infer_city(job.get("location") or "", cid.split("-")[0]),
        "workMode": None,
        "postedAt": (job.get("created_at") or job.get("published_at") or "")[:10] or None,
        "applyUrl": f"https://careers.zerodha.com/jobs/{jid}" if jid else "https://careers.zerodha.com",
    }

def fetch_turbohire(subdomain, org_guid):
    """TurboHire ATS public API — no key, but needs a fresh anon token.

    Discovered 2026-11-01 (Flipkart). Flow:
      1. GET thapi.azurewebsites.net/api/token/noauth (Origin+Referer headers)
      2. POST thapi-external.azurewebsites.net/api/careerpagev2/filteredjobs
         ?orgId={guid}&pageType=2  (pageType=2 = genuinely open roles)
    Uses curl via subprocess: the endpoint intermittently truncates
    responses over urllib, curl is reliable. Returns the Result job list.
    """
    import subprocess

    base = f"https://{subdomain}.turbohire.co"
    career_ref = f"{base}/careerpage/{org_guid}"
    common = [
        "curl", "-s", "--max-time", "25", "-A", "startup-arena/1.0",
        "-H", f"Origin: {base}", "-H", f"Referer: {career_ref}",
    ]
    tok = subprocess.run(
        common + ["https://thapi.azurewebsites.net/api/token/noauth"],
        capture_output=True, text=True, timeout=30,
    )
    token = json.loads(tok.stdout).get("access_token")
    if not token:
        raise RuntimeError("turbohire: no access_token")
    jobs = subprocess.run(
        common + [
            "-X", "POST",
            "-H", f"Authorization: Bearer {token}",
            "-H", "Content-Type: application/json",
            "-d", "{}",
            f"https://thapi-external.azurewebsites.net/api/careerpagev2/filteredjobs"
            f"?orgId={org_guid}&pageType=2",
        ],
        capture_output=True, text=True, timeout=40,
    )
    data = json.loads(jobs.stdout)
    result = data.get("Result")
    return result if isinstance(result, list) else []


def turbohire_role(job, subdomain, cid):
    loc_raw = job.get("Location") or ""
    try:
        locs = json.loads(loc_raw) if isinstance(loc_raw, str) else loc_raw
    except (json.JSONDecodeError, ValueError):
        locs = []
    addr = ""
    if isinstance(locs, list) and locs:
        addr = (locs[0] or {}).get("Address", "")
    if "India" not in addr:
        return None
    obf = job.get("JobIdObfuscated") or ""
    exp = job.get("Experience") or {}
    level = None
    if isinstance(exp, dict) and (exp.get("MinExp") is not None or exp.get("MaxExp") is not None):
        level = f"{exp.get('MinExp', '?')}-{exp.get('MaxExp', '?')} yrs"
    pub = job.get("PublishedDate") or ""
    return {
        "id": f"turbohire-{cid}-{job.get('JobId')}",
        "companyId": cid,
        "title": clean(job.get("JobTitle")),
        "team": clean(job.get("Department")),
        "level": level,
        "location": clean(addr),
        "city": infer_city(addr, cid.split("-")[0]),
        "workMode": None,
        "postedAt": pub[:10] if isinstance(pub, str) else None,
        "applyUrl": f"https://{subdomain}.turbohire.co/job/publicjobs/{obf}" if obf else None,
    }

def fetch_swiggy():
    """Swiggy's public jobs JSON — no key needed.

    Discovered 2026-11-01: careers.swiggy.in is a Vite SPA whose bundle
    fetches /api/jobs.json. Fields are minified:
      t=title, c=city, l=location, b=business unit (team),
      e=employment type, r=remote flag, h=hybrid flag,
      d=posted date (epoch ms), u=apply URL (SmartRecruiters SWIGGY board).
    """
    url = "https://careers.swiggy.in/api/jobs.json"
    req = urllib.request.Request(url, headers={"User-Agent": "startup-arena/1.0"})
    with urllib.request.urlopen(req, timeout=25) as res:
        data = json.load(res)
    jobs = data.get("jobs") if isinstance(data, dict) else data
    return jobs if isinstance(jobs, list) else []


def swiggy_role(job, cid):
    loc = job.get("l") or ""
    if not looks_india(loc):
        return None
    wm = None
    if job.get("r") == 1:
        wm = "remote"
    elif job.get("h") == 1:
        wm = "hybrid"
    else:
        wm = "onsite"
    posted = job.get("d")
    posted_at = None
    if isinstance(posted, (int, float)) and posted > 0:
        try:
            posted_at = datetime.fromtimestamp(posted / 1000, tz=timezone.utc).date().isoformat()
        except (OSError, OverflowError, ValueError):
            posted_at = None
    return {
        "id": f"swiggy-{cid}-{abs(hash(job.get('u') or job.get('t'))) % 10**8}",
        "companyId": cid,
        "title": clean(job.get("t")),
        "team": clean(job.get("b")),
        "level": None,
        "location": clean(loc),
        "city": infer_city(loc, cid.split("-")[0]),
        "workMode": wm,
        "postedAt": posted_at,
        "applyUrl": job.get("u"),
    }

def _kula_unescape(s):
    """Decode Kula flight payload (escaped quotes / unicode)."""
    s = re.sub(_KULA_BS + _KULA_BS + "u([0-9a-fA-F]{4})",
               lambda m: chr(int(m.group(1), 16)), s)
    s = s.replace(_KULA_BS + '"', '"')
    s = s.replace(_KULA_BS + _KULA_BS, _KULA_BS)
    return s


def fetch_kula(company):
    """Kula (careers.kula.ai) board — jobs are embedded in the Next.js
    flight data, no key needed. Returns (jobs, id_to_slug)."""
    url = f"https://careers.kula.ai/{company}"
    req = urllib.request.Request(url, headers={"User-Agent": "startup-arena/1.0"})
    with urllib.request.urlopen(req, timeout=30) as res:
        html = res.read(3_000_000).decode("utf-8", "ignore")
    payloads = re.findall(r'self\.__next_f\.push\(\[1,"(.*?)"\]\)</script>', html, re.S)
    blob = _kula_unescape("".join(payloads))
    id_to_slug = dict(
        re.findall(r'href="/' + re.escape(company) + r'/(\d+)-([^"]+)"', html)
    )
    jobs = []
    for m in re.finditer(r'"id":(\d+),"account_id":\d+,"title":"((?:[^"\\]|\\.)*?)"', blob):
        jid, title = m.group(1), m.group(2)
        seg = blob[m.start() : m.start() + 6000]
        launch = re.search(r'"launch_at":"([^"]+?)"', seg)
        dept = re.search(
            r'"ats_department":\{"id":\d+,"name":"((?:[^"\\]|\\.)*?)"', seg
        )
        listed = re.search(r'"listed":(true|false)', seg)
        offices = []
        om = re.search(r'"offices":\[(.*?)\](,|})', seg)
        if om:
            for part in re.split(r'\{"id":', om.group(1)):
                if not part.strip():
                    continue
                oseg = '{"id":' + part[:900]

                def _f(p, s=oseg):
                    mm = re.search(p, s)
                    return mm.group(1) if mm else None

                offices.append({
                    "location": _f(r'"location":"((?:[^"\\]|\\.)*?)"'),
                    "country_code": _f(r'"country_code":"([A-Z]{2})"'),
                    "city": _f(r'"city":"((?:[^"\\]|\\.)*?)"'),
                    "remote": bool(re.search(r'"remote":true', oseg)),
                    "workplace": _f(r'"workplace":"([a-z_]+)"'),
                })
        jobs.append({
            "id": jid,
            "title": title,
            "launch_at": launch.group(1) if launch else None,
            "department": dept.group(1) if dept else None,
            "listed": (listed.group(1) == "true") if listed else True,
            "offices": offices,
        })
    return jobs, id_to_slug


def kula_role(job, company, cid, id_to_slug):
    offices = job.get("offices") or []
    india = [o for o in offices if (o.get("country_code") or "").upper() == "IN"]
    if not india:
        return None
    o = india[0]
    slug = id_to_slug.get(job["id"])
    if slug:
        apply = f"https://careers.kula.ai/{company}/{job['id']}-{slug}"
    else:
        apply = f"https://careers.kula.ai/{company}"
    wm = None
    if o.get("remote"):
        wm = "remote"
    elif o.get("workplace") == "remote":
        wm = "remote"
    elif o.get("workplace") == "office":
        wm = "onsite"
    posted = job.get("launch_at")
    return {
        "id": f"kula-{cid}-{job['id']}",
        "companyId": cid,
        "title": job["title"],
        "team": job.get("department"),
        "level": None,
        "location": o.get("location") or o.get("name"),
        "city": infer_city(o.get("location") or "", cid.split("-")[0]),
        "workMode": wm,
        "postedAt": posted[:10] if posted else None,
        "applyUrl": apply,
    }


def fetch_smartrecruiters(company):
    """Public SmartRecruiters postings API — paged, no key needed."""
    postings = []
    offset = 0
    while True:
        url = (
            f"https://api.smartrecruiters.com/v1/companies/{company}"
            f"/postings?limit=100&offset={offset}"
        )
        req = urllib.request.Request(
            url, headers={"User-Agent": "startup-arena/1.0"}
        )
        with urllib.request.urlopen(req, timeout=25) as res:
            data = json.load(res)
        batch = data.get("content") or []
        postings.extend(batch)
        if len(postings) >= (data.get("totalFound") or 0) or not batch:
            break
        offset += len(batch)
    return postings


def lever_role(posting, cid):
    cats = posting.get("categories") or {}
    loc = cats.get("location") or ""
    created = posting.get("createdAt")
    posted = None
    if created:
        try:
            posted = datetime.fromtimestamp(created / 1000, tz=timezone.utc).date().isoformat()
        except (ValueError, OSError):
            pass
    return {
        "id": f"lever-{cid}-{posting.get('id')}",
        "companyId": cid,
        "title": clean(posting.get("text")),
        "team": clean(cats.get("team")) or clean(cats.get("department")),
        "level": None,
        "location": clean(loc),
        "city": infer_city(loc, cid.split("-")[0]),
        "workMode": "remote"
        if "remote" in loc.lower()
        else ("hybrid" if "hybrid" in loc.lower() else None),
        "postedAt": posted,
        "applyUrl": posting.get("hostedUrl"),
    }


def smartrecruiters_role(posting, company, cid):
    loc = posting.get("location") or {}
    country = loc.get("country") or ""
    city = loc.get("city") or ""
    func = posting.get("function") or ""
    if isinstance(func, dict):
        func = func.get("label") or ""
    return {
        "id": f"sr-{cid}-{posting.get('id')}",
        "companyId": cid,
        "title": clean(posting.get("name")),
        "team": clean(func),
        "level": None,
        "location": clean(f"{city}, {country}".strip(", ")),
        "city": infer_city(f"{city} {country}", cid.split("-")[0]),
        "workMode": None,
        "postedAt": (posting.get("releasedDate") or "")[:10] or None,
        "applyUrl": f"https://jobs.smartrecruiters.com/{company}/{posting.get('id')}",
    }


def fetch_ashby(slug):
    """Public Ashby job-board API — no key needed."""
    url = f"https://api.ashbyhq.com/posting-api/job-board/{slug}"
    req = urllib.request.Request(
        url, headers={"User-Agent": "startup-arena/1.0"}
    )
    with urllib.request.urlopen(req, timeout=25) as res:
        return json.load(res).get("jobs", [])


def ashby_role(posting, cid):
    loc = posting.get("locationName") or ""
    wt = (posting.get("workplaceType") or "").lower()
    return {
        "id": f"ashby-{cid}-{posting.get('id')}",
        "companyId": cid,
        "title": clean(posting.get("title")),
        "team": clean(posting.get("departmentName")),
        "level": None,
        "location": clean(loc),
        "city": infer_city(loc, cid.split("-")[0]),
        "workMode": "remote"
        if wt == "remote" or posting.get("isRemote")
        else ("hybrid" if wt == "hybrid" else ("onsite" if wt == "on-site" else None)),
        "postedAt": (posting.get("publishedAt") or "")[:10] or None,
        "applyUrl": posting.get("jobUrl"),
    }


def fetch_keka(subdomain, identifier):
    """Public Keka careers embed API — no key needed.

    The portal identifier is per-company; grab it from the careers page:
      {sub}.keka.com/careers -> /careers/api/embedjobs/js/{identifier}
    """
    url = (
        f"https://{subdomain}.keka.com/careers/api/embedjobs/"
        f"default/active/{identifier}"
    )
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36"
        },
    )
    with urllib.request.urlopen(req, timeout=25) as res:
        data = json.load(res)
    return data if isinstance(data, list) else []


def keka_role(job, subdomain, cid):
    locs = job.get("jobLocations") or []
    india = [l for l in locs if (l.get("countryCode") or "").upper() == "IN"]
    loc = india[0] if india else (locs[0] if locs else {})
    city = loc.get("city") or ""
    loc_name = loc.get("name") or ""
    return {
        "id": f"keka-{cid}-{job.get('id')}",
        "companyId": cid,
        "title": clean(job.get("title")),
        "team": clean(job.get("departmentName")),
        "level": clean(job.get("experience")),
        "location": clean(f"{city}, India" if city and india else loc_name),
        "city": infer_city(f"{city} India", cid.split("-")[0]),
        "workMode": "remote" if loc_name.lower() == "remote" else None,
        "postedAt": (job.get("publishedOn") or "")[:10] or None,
        "applyUrl": f"https://{subdomain}.keka.com/careers/jobdetails/{job.get('id')}",
    }


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


INDIAN_STATES = {
    "andhra pradesh", "arunachal pradesh", "assam", "bihar", "chhattisgarh",
    "delhi", "goa", "gujarat", "haryana", "himachal pradesh", "jharkhand",
    "karnataka", "kerala", "madhya pradesh", "maharashtra", "manipur",
    "meghalaya", "mizoram", "nagaland", "odisha", "orissa", "punjab",
    "rajasthan", "sikkim", "tamil nadu", "telangana", "tripura",
    "uttar pradesh", "uttarakhand", "west bengal", "jammu", "kashmir",
    "ladakh", "puducherry", "pondicherry", "chandigarh",
}

_CITY_HINT_WORDS = {h for hints in CITY_HINTS.values() for h in hints}


def clean(s):
    return re.sub(r"\s+", " ", (s or "").strip()) or None


def looks_india(location_text):
    """True when a location string refers to India.

    Some boards give 'City, State, India', others only 'City, State' or a
    bare city — so match Indian cities and states, not just the word India.
    """
    text = (location_text or "").lower()
    if "india" in text:
        return True
    return any(w in text for w in _CITY_HINT_WORDS) or any(
        s in text for s in INDIAN_STATES
    )


def normalize_rapidapi_job(j, source_tag):
    """Map a Company Career Sites Jobs API job onto our Role fields.

    Real shape (verified 2026-11-01): data.jobs[] with id, title, company,
    applyUrl, category, subcategory, experienceLevel, workMode, location,
    city, country, postedAt (YYYY-MM-DD); pagination via data.nextCursor.
    """
    title = clean(j.get("title"))
    team = clean(j.get("category"))
    sub = clean(j.get("subcategory"))
    if sub and sub != team:
        team = f"{team} · {sub}" if team else sub
    level = clean(j.get("experienceLevel"))
    mode = (clean(j.get("workMode")) or "").lower()
    if "remote" in mode:
        work_mode = "remote"
    elif "hybrid" in mode:
        work_mode = "hybrid"
    elif "onsite" in mode or "on-site" in mode or "office" in mode:
        work_mode = "onsite"
    else:
        work_mode = "remote" if j.get("isRemote") else None
    posted = clean(j.get("postedAt"))
    return {
        "job_key": str(j.get("id") or re.sub(r"\W+", "-", (title or "job").lower())[:40]),
        "title": title,
        "team": team,
        "level": level,
        "location": clean(j.get("location")) or clean(j.get("city")),
        "city_hint": clean(j.get("city")) or clean(j.get("location")),
        "workMode": work_mode,
        "postedAt": posted,
        "applyUrl": clean(j.get("applyUrl")),
        "source": source_tag,
    }


def fetch_rapidapi_company(name, api_key):
    """All India jobs for one company name, following nextCursor pages."""
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
                # the API sits behind Cloudflare: Python-urllib's default
                # UA gets a 1010 block, a browser UA passes through.
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/126.0 Safari/537.36",
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
        payload = data.get("data") or {}
        if isinstance(data, dict) and data.get("message") and not payload.get("jobs"):
            raise RuntimeError(f"API error: {data['message']}")
        batch = payload.get("jobs") or []
        jobs.extend(batch)
        cursor = payload.get("nextCursor")
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


def run_rapidapi(api_key, roles, per_company, only=None):
    """Pull India roles for every company not on a direct Greenhouse feed."""
    companies = load_companies()
    covered_ids = {cid for ids in BOARDS.values() for cid in ids}
    covered_ids |= {cid for ids in LEVER_BOARDS.values() for cid in ids}
    covered_ids |= {cid for ids in SMARTRECRUITERS.values() for cid in ids}
    covered_ids |= {cid for ids in ASHBY_BOARDS.values() for cid in ids}
    covered_ids |= {cid for ids in KEKA_PORTALS.values() for cid in ids}
    covered_ids |= {cid for ids in KULA_BOARDS.values() for cid in ids}
    covered_ids |= set(SWIGGY_IDS)
    covered_ids |= {cid for ids in WORKDAY_BOARDS.values() for cid in ids}
    covered_ids |= {cid for ids in TURBOHIRE_TENANTS.values() for cid in ids}
    covered_ids |= set(UPSTOX_IDS + URBANCOMPANY_IDS + ZERODHA_IDS)
    by_name = {}
    for cid, name in companies:
        if cid in covered_ids:
            continue
        by_name.setdefault(name, []).append(cid)
    if only:
        wanted = {w.lower() for w in only}
        by_name = {n: c for n, c in by_name.items() if n.lower() in wanted}
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
            if not apply_url_ok(r["applyUrl"]):
                continue  # aggregator mirror, not the company's own posting
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
            if not looks_india(loc):
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
    for slug, company_ids in LEVER_BOARDS.items():
        try:
            postings = fetch_lever(slug)
        except Exception as e:
            print(f"WARN lever {slug}: {e}")
            continue
        for post in postings:
            loc = ((post.get("categories") or {}).get("location") or "")
            if not looks_india(loc):
                continue
            for cid in company_ids:
                role = lever_role(post, cid)
                if role["title"] and role["applyUrl"]:
                    roles.append(role)
                    per_company[cid] = per_company.get(cid, 0) + 1
    for company, company_ids in SMARTRECRUITERS.items():
        try:
            postings = fetch_smartrecruiters(company)
        except Exception as e:
            print(f"WARN smartrecruiters {company}: {e}")
            continue
        for post in postings:
            loc = post.get("location") or {}
            country = (loc.get("country") or "").lower()
            if country != "in" and not looks_india(loc.get("fullLocation") or ""):
                continue
            # One board serves both city pins — route each role to the pin
            # matching its city, once.
            city = infer_city(
                f"{loc.get('city') or ''} {loc.get('country') or ''}",
                None,
            )
            target = (
                next((c for c in company_ids if c.startswith(city + "-")), None)
                if city
                else None
            ) or company_ids[0]
            role = smartrecruiters_role(post, company, target)
            if role["title"]:
                role["city"] = city or target.split("-")[0]
                roles.append(role)
                per_company[target] = per_company.get(target, 0) + 1
    for slug, company_ids in ASHBY_BOARDS.items():
        try:
            postings = fetch_ashby(slug)
        except Exception as e:
            print(f"WARN ashby {slug}: {e}")
            continue
        for post in postings:
            loc = post.get("locationName") or ""
            if not looks_india(loc):
                continue
            for cid in company_ids:
                role = ashby_role(post, cid)
                if role["title"] and role["applyUrl"]:
                    roles.append(role)
                    per_company[cid] = per_company.get(cid, 0) + 1
    for (subdomain, identifier), company_ids in KEKA_PORTALS.items():
        try:
            jobs = fetch_keka(subdomain, identifier)
        except Exception as e:
            print(f"WARN keka {subdomain}: {e}")
            continue
        for job in jobs:
            locs = job.get("jobLocations") or []
            if not any(
                (l.get("countryCode") or "").upper() == "IN" for l in locs
            ):
                continue
            for cid in company_ids:
                role = keka_role(job, subdomain, cid)
                if role["title"]:
                    roles.append(role)
                    per_company[cid] = per_company.get(cid, 0) + 1
    for company, company_ids in KULA_BOARDS.items():
        try:
            jobs, id_to_slug = fetch_kula(company)
        except Exception as e:
            print(f"WARN kula {company}: {e}")
            continue
        for job in jobs:
            if not job.get("listed", True):
                continue
            for cid in company_ids:
                role = kula_role(job, company, cid, id_to_slug)
                if role:
                    roles.append(role)
                    per_company[cid] = per_company.get(cid, 0) + 1
    for (tenant, wdnum, site), company_ids in WORKDAY_BOARDS.items():
        try:
            jobs = fetch_workday(tenant, wdnum, site)
        except Exception as e:
            print(f"WARN workday {tenant}: {e}")
            continue
        base_url = "https://%s.wd%s.myworkdayjobs.com" % (tenant, wdnum)
        for job in jobs:
            if not looks_india(job.get("locationsText") or ""):
                continue
            for cid in company_ids:
                role = workday_role(job, base_url, cid)
                if role and role["title"]:
                    roles.append(role)
                    per_company[cid] = per_company.get(cid, 0) + 1
    for cid in SWIGGY_IDS:
        try:
            jobs = fetch_swiggy()
        except Exception as e:
            print(f"WARN swiggy: {e}")
            break
        for job in jobs:
            role = swiggy_role(job, cid)
            if role and role["title"] and role["applyUrl"]:
                roles.append(role)
                per_company[cid] = per_company.get(cid, 0) + 1
    for (subdomain, org_guid), company_ids in TURBOHIRE_TENANTS.items():
        try:
            jobs = fetch_turbohire(subdomain, org_guid)
        except Exception as e:
            print(f"WARN turbohire {subdomain}: {e}")
            continue
        for job in jobs:
            for cid in company_ids:
                role = turbohire_role(job, subdomain, cid)
                if role and role["title"] and role["applyUrl"]:
                    roles.append(role)
                    per_company[cid] = per_company.get(cid, 0) + 1
    for _label, _ids, _fetch, _mk in [
        ("upstox", UPSTOX_IDS, fetch_upstox, upstox_role),
        ("urbancompany", URBANCOMPANY_IDS, fetch_urbancompany, urbancompany_role),
        ("zerodha", ZERODHA_IDS, fetch_zerodha, zerodha_role),
    ]:
        try:
            jobs = _fetch()
        except Exception as e:
            print(f"WARN {_label}: {e}")
            continue
        for job in jobs:
            for cid in _ids:
                role = _mk(job, cid)
                if role and role["title"] and role["applyUrl"]:
                    roles.append(role)
                    per_company[cid] = per_company.get(cid, 0) + 1
    api_key = os.environ.get("RAPIDAPI_KEY")
    if api_key:
        only = None
        for i, a in enumerate(sys.argv):
            if a == "--only" and i + 1 < len(sys.argv):
                only = sys.argv[i + 1].split(",")
        run_rapidapi(api_key, roles, per_company, only)
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
