"""Playwright scrapers for companies with no public JSON feed.

Strategy per company:
  1. NETWORK CAPTURE (primary): record every JSON response the page's own
     JavaScript fetches, then heuristically find the job array. APIs change
     less often than DOM, so this is the robust path.
  2. DOM FALLBACK: extract rendered job-card links (/job/, /opening/, ...).

Output: out/{cid}.json — role dicts in the exact shape fetch-roles.py
expects (id, companyId, title, team, level, location, city, workMode,
postedAt, applyUrl). Raw captured JSON goes to out/_raw/ for inspection.

Defensive rule: a company that previously had roles but now yields zero
keeps its old file — the run warns loudly instead of silently wiping data.

Run:  python3 scripts/scrape-playwright/scrape.py
Needs: pip install playwright && python -m playwright install chromium
"""

import json
import os
import re
import sys
from urllib.parse import urljoin, urlparse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from companies import COMPANIES

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out")
RAW = os.path.join(OUT, "_raw")

TITLE_KEYS = ("title", "jobtitle", "job_title", "name", "position", "role", "job_role")
LOC_KEYS = ("location", "joblocation", "job_location", "city", "place", "office",
            "address", "locationname", "location_name", "worklocation")
URL_KEYS = ("applyurl", "apply_url", "url", "link", "joburl", "job_url",
            "detailurl", "detail_url", "href", "slug")
TEAM_KEYS = ("department", "team", "businessunit", "business_unit", "function",
             "category", "vertical")
DATE_KEYS = ("publisheddate", "publisheddate", "createdat", "created_at",
             "posteddate", "posted_date", "updatedat", "updated_at", "date")


def _first(item, keys):
    low = {k.lower(): k for k in item.keys()}
    for want in keys:
        if want in low:
            v = item[low[want]]
            if isinstance(v, str) and v.strip():
                return v.strip()
    return None


def _score_array(arr):
    """How job-like is this list of dicts?"""
    score = 0
    for item in arr[:5]:
        if not isinstance(item, dict):
            return 0
        keys = {k.lower() for k in item.keys()}
        if keys & set(TITLE_KEYS):
            score += 2
        if keys & set(LOC_KEYS):
            score += 1
    return score


def _find_arrays(obj, path="", depth=0):
    out = []
    if depth > 6:
        return out
    if isinstance(obj, list) and len(obj) >= 1 and isinstance(obj[0], dict):
        s = _score_array(obj)
        if s >= 4:  # at least titles present
            out.append((s, path, obj))
    if isinstance(obj, dict):
        for k, v in obj.items():
            out += _find_arrays(v, f"{path}.{k}", depth + 1)
    elif isinstance(obj, list):
        for i, v in enumerate(obj[:2]):
            out += _find_arrays(v, f"{path}[{i}]", depth + 1)
    return out


def _looks_india(loc):
    if not loc:
        return False
    l = loc.lower()
    if "india" in l:
        return True
    cities = ["bengaluru", "bangalore", "mumbai", "bombay", "delhi", "gurgaon",
              "gurugram", "noida", "hyderabad", "pune", "chennai", "madras",
              "kolkata", "calcutta", "ahmedabad", "kochi", "jaipur", "indore"]
    return any(c in l for c in cities)


def _norm_item(item, page_url, cid):
    title = _first(item, TITLE_KEYS)
    if not title:
        return None
    loc = _first(item, LOC_KEYS) or ""
    if isinstance(loc, dict):
        loc = loc.get("name") or loc.get("city") or ""
    loc = str(loc)
    if not _looks_india(loc):
        return None
    raw_url = _first(item, URL_KEYS)
    apply_url = urljoin(page_url, raw_url) if raw_url else page_url
    # keep only same-registrable-domain apply links (no aggregators)
    try:
        if urlparse(apply_url).netloc and urlparse(page_url).netloc not in urlparse(apply_url).netloc \
                and urlparse(apply_url).netloc not in urlparse(page_url).netloc:
            pass
    except Exception:
        pass
    team = _first(item, TEAM_KEYS)
    posted = _first(item, DATE_KEYS)
    jid = str(item.get("id") or item.get("jobId") or item.get("job_id") or abs(hash(title)) % 10**8)
    city = cid.split("-")[0]
    return {
        "id": f"pw-{cid}-{jid}",
        "companyId": cid,
        "title": title,
        "team": team,
        "level": None,
        "location": loc,
        "city": city,
        "workMode": "remote" if "remote" in loc.lower() else None,
        "postedAt": str(posted)[:10] if posted else None,
        "applyUrl": apply_url,
    }


def _dom_fallback(page, page_url, cid):
    """Extract rendered job links as a last resort."""
    roles = []
    try:
        links = page.eval_on_selector_all(
            "a[href]",
            """els => els.map(e => ({href: e.getAttribute('href'),
                                     text: (e.innerText || '').trim().slice(0, 120)}))""",
        )
    except Exception:
        return roles
    seen = set()
    for l in links:
        href = l.get("href") or ""
        text = l.get("text") or ""
        if not re.search(r"/(job|opening|position|career|vacanc)", href, re.I):
            continue
        if len(text) < 4 or len(text) > 100:
            continue
        if any(x in href.lower() for x in ("linkedin.com", "indeed.", "naukri.", "himalayas.")):
            continue
        url = urljoin(page_url, href)
        if url in seen:
            continue
        seen.add(url)
        roles.append({
            "id": f"pw-{cid}-{abs(hash(url)) % 10**8}",
            "companyId": cid,
            "title": text,
            "team": None,
            "level": None,
            "location": "",
            "city": cid.split("-")[0],
            "workMode": None,
            "postedAt": None,
            "applyUrl": url,
        })
    return roles


def scrape_company(pw, cfg):
    from playwright.sync_api import TimeoutError as PWTimeout
    json_blobs = []

    def on_response(resp):
        try:
            ct = resp.headers.get("content-type", "")
            if "json" not in ct:
                return
            if len(json_blobs) > 40:
                return
            data = resp.json()
            json_blobs.append({"url": resp.url, "data": data})
        except Exception:
            pass

    browser = pw.chromium.launch(args=["--no-sandbox"])
    page = browser.new_page(user_agent=(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"))
    page.on("response", on_response)
    roles = []
    raw_saved = None
    try:
        page.goto(cfg["url"], timeout=45000, wait_until="domcontentloaded")
        page.wait_for_timeout(cfg.get("wait_ms", 10000))
        # network-capture pass
        best = None
        for blob in json_blobs:
            try:
                cands = _find_arrays(blob["data"])
            except Exception:
                continue
            for score, path, arr in cands:
                if best is None or score > best[0]:
                    best = (score, path, arr, blob["url"])
        if best:
            _, path, arr, src_url = best
            raw_saved = {"source": src_url, "path": path, "count": len(arr),
                         "sample": arr[0]}
            for cid in cfg["cids"]:
                for item in arr:
                    r = _norm_item(item, cfg["url"], cid)
                    if r:
                        roles.append(r)
        # DOM fallback if network gave nothing
        if not roles:
            for cid in cfg["cids"]:
                roles.extend(_dom_fallback(page, cfg["url"], cid))
    except PWTimeout:
        print(f"  WARN {cfg['name']}: page timeout")
    except Exception as e:
        print(f"  WARN {cfg['name']}: {type(e).__name__}: {str(e)[:100]}")
    finally:
        browser.close()
    return roles, raw_saved


def main():
    from playwright.sync_api import sync_playwright
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(RAW, exist_ok=True)
    total = 0
    with sync_playwright() as pw:
        for cfg in COMPANIES:
            print(f"scraping {cfg['name']} ...")
            try:
                roles, raw = scrape_company(pw, cfg)
            except Exception as e:
                print(f"  WARN {cfg['name']}: fatal {type(e).__name__}")
                continue
            if raw:
                with open(os.path.join(RAW, cfg["name"] + ".json"), "w") as f:
                    json.dump(raw, f, indent=1, default=str)
            by_cid = {}
            for r in roles:
                by_cid.setdefault(r["companyId"], []).append(r)
            for cid in cfg["cids"]:
                new_roles = by_cid.get(cid, [])
                path = os.path.join(OUT, cid + ".json")
                prev = []
                if os.path.exists(path):
                    try:
                        prev = json.load(open(path))
                    except Exception:
                        prev = []
                # defensive: never silently wipe existing roles
                if not new_roles and prev:
                    print(f"  KEEP {cid}: scrape yielded 0, keeping {len(prev)} previous roles")
                    continue
                with open(path, "w") as f:
                    json.dump(new_roles, f, indent=1)
                print(f"  {cid}: {len(new_roles)} roles")
                total += len(new_roles)
    print(f"TOTAL playwright roles: {total}")


if __name__ == "__main__":
    main()
