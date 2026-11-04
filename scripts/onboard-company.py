#!/usr/bin/env python3
"""Onboard a new company to startupJobs in one command.

This is the "automatic" path for adding companies — it chains the steps
that were previously done by hand:

    probe ATS board  ->  verify India roles  ->  fetch logo  ->
    verify careers URL  ->  geocode office  ->
    patch data.ts + fetch-roles.py

Usage:
    python3 scripts/onboard-company.py "Figma" --city bengaluru --domain figma.com
    python3 scripts/onboard-company.py "Figma" --city bengaluru --domain figma.com --apply
    python3 scripts/onboard-company.py "Figma" --city bengaluru --domain figma.com --apply --fetch --yes

Flags:
    --city      one of: bengaluru delhi mumbai hyderabad pune chennai ahmedabad kolkata
    --domain    company domain, e.g. figma.com (used for logo + careers URL)
    --category  sector label, e.g. "Design tools" (prompted when missing)
    --color     monogram fallback color (prompted when missing)
    --apply     actually patch src/data/companies.ts, scripts/fetch-roles.py and write
                the logo file. Without it, prints what WOULD change.
    --fetch     after --apply, run scripts/fetch-roles.py to regenerate roles
    --yes       answer every confirmation with yes (needs --category/--color)

What stays human (deliberately, not lazily):
  - The board hit must be confirmed — slug guessing can land on a namesake
    (Upstox's real board is a custom API; SmartRecruiters has a 1-job
    "upstox" board for a different outfit). Fully automatic onboarding
    would silently wire the wrong board.
  - The office pin defaults to the city center (area null) unless you
    confirm the geocoded office — pins are never invented.
  - The logo is saved for you but deserves a 2-second glance.
  - The careers URL is verified to return 200, but SPAs return 200 for
    everything — open it once and check it's a real careers page.

Once a company is onboarded, the Sunday GitHub Actions workflow picks it
up forever with zero further action: fetch-roles.py reads the config you
just added and refreshes its roles weekly.
"""

import base64
import importlib.util
import io
import json
import os
import re
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
UA = {"User-Agent": "startupJobs-onboarding/1.0 (contact: repo owner)"}
CITIES = ["bengaluru", "delhi", "mumbai", "hyderabad",
          "pune", "chennai", "ahmedabad", "kolkata"]


def _load(mod_name, filename):
    spec = importlib.util.spec_from_file_location(
        mod_name, os.path.join(HERE, filename))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


probe_ats = _load("probe_ats", "probe-ats.py")
fr = _load("fetch_roles", "fetch-roles.py")


def slugify(name):
    return re.sub(r"[^a-z0-9]+", "-", name.strip().lower()).strip("-")


def get(url, timeout=25, headers=UA):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def head_ok(url):
    try:
        req = urllib.request.Request(url, headers=UA, method="HEAD")
        with urllib.request.urlopen(req, timeout=20) as r:
            return 200 <= r.status < 400
    except Exception:
        try:  # some servers reject HEAD; fall back to a ranged GET
            req = urllib.request.Request(url, headers={**UA, "Range": "bytes=0-0"})
            with urllib.request.urlopen(req, timeout=20) as r:
                return 200 <= r.status < 400
        except Exception:
            return False


def ask(question, default_yes=True):
    if ARGS.yes:
        return True
    hint = "Y/n" if default_yes else "y/N"
    ans = input(f"{question} [{hint}] ").strip().lower()
    if not ans:
        return default_yes
    return ans in ("y", "yes")


def prompt(text, default=""):
    if ARGS.yes:
        if default == "" and text.startswith("Category"):
            sys.exit("ERROR: --yes needs --category")
        return default
    ans = input(f"{text}" + (f" [{default}]" if default else "") + ": ").strip()
    return ans or default


# ---------------------------------------------------------------- probes

def rank_hits(name):
    """Probe ATS boards, fetch each hit, rank by India-role count."""
    hits = probe_ats.discover(name)
    ranked = []
    for h in hits:
        plat, slug = h["platform"], h["slug"]
        try:
            if plat == "greenhouse":
                jobs = fr.fetch_board(slug)
                loc = lambda j: (j.get("location") or {}).get("name", "")
            elif plat == "ashby":
                jobs = fr.fetch_ashby(slug)
                loc = lambda j: j.get("locationName") or ""
            elif plat == "lever":
                jobs = fr.fetch_lever(slug)
                loc = lambda j: (j.get("categories") or {}).get("location") or ""
            elif plat == "smartrecruiters":
                jobs = fr.fetch_smartrecruiters(slug)
                loc = lambda j: (j.get("location") or {}).get("city", "")
            else:
                continue
        except Exception as e:
            print(f"  WARN {plat}/{slug}: {e}")
            continue
        india = [j for j in jobs if fr.looks_india(loc(j))]
        samples = [(fr.clean(j.get("title") if plat != "lever" else j.get("text")),
                    loc(j)) for j in india[:5]]
        ranked.append({"hit": h, "total": len(jobs),
                       "india": len(india), "samples": samples})
    ranked.sort(key=lambda r: -r["india"])
    return ranked


# ---------------------------------------------------------------- logo

def fetch_logo(domain, slug):
    """Fetch the best logo for a domain; return SVG text or None."""
    best = None
    for url in (f"https://unavatar.io/{domain}?fallback=false",
                f"https://www.google.com/s2/favicons?domain={domain}&sz=128",
                f"https://{domain}/favicon.ico"):
        try:
            data = get(url)
        except Exception:
            continue
        if len(data) < 800:
            continue
        is_png = data[:8] == b"\x89PNG\r\n\x1a\n"
        is_jpg = data[:2] == b"\xff\xd8"
        is_ico = data[:4] == b"\x00\x00\x01\x00"
        if not (is_png or is_jpg or is_ico):
            continue
        if is_ico:
            try:
                from PIL import Image
                im = Image.open(io.BytesIO(data))
                frame = im.copy().convert("RGBA")
                buf = io.BytesIO()
                frame.save(buf, "PNG")
                data, mime = buf.getvalue(), "image/png"
            except Exception:
                continue  # ICO we can't convert is not renderable in our SVG
        else:
            mime = "image/png" if is_png else "image/jpeg"
        if best is None or len(data) > len(best[0]):
            best = (data, mime, url)
    if not best:
        return None, None
    data, mime, src = best
    b64 = base64.b64encode(data).decode()
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" '
           f'viewBox="0 0 64 64"><image href="data:{mime};base64,{b64}" '
           f'x="0" y="0" width="64" height="64"/></svg>')
    return svg, src


# ---------------------------------------------------------------- careers URL

def find_careers_url(domain):
    dom_variants = [domain, "www." + domain] if not domain.startswith("www.") else [domain]
    paths = ["/careers", "/company/careers", "/about/careers",
             "/jobs", "/company/jobs", "/careers/"]
    for dom in dom_variants:
        for path in paths:
            url = f"https://{dom}{path}"
            if head_ok(url):
                return url
    return None


# ---------------------------------------------------------------- geocode

def geocode_office(name, city_name):
    """Best-effort office geocode via Nominatim. Returns (lat, lng, label) or None."""
    q = urllib.request.quote(f"{name} office {city_name}")
    url = (f"https://nominatim.openstreetmap.org/search?q={q}"
           f"&format=json&limit=1")
    try:
        data = json.loads(get(url, headers={
            "User-Agent": "startupJobs-onboarding/1.0"}).decode())
    except Exception as e:
        print(f"  geocode unavailable: {e}")
        return None
    if not data:
        return None
    r = data[0]
    return float(r["lat"]), float(r["lon"]), r.get("display_name", "")


def city_center(city_id):
    src = open(os.path.join(ROOT, "src", "data.ts")).read()
    m = re.search(r'id: "%s",\s*name: "[^"]*",\s*state: "[^"]*",\s*'
                  r'tagline: "[^"]*",\s*lat: ([\d.]+),\s*lng: ([\d.]+)'
                  % re.escape(city_id), src)
    if not m:
        sys.exit(f"ERROR: city {city_id!r} not found in src/data/companies.ts")
    return float(m.group(1)), float(m.group(2))


# ---------------------------------------------------------------- patching

def patch_data_ts(entry, slug):
    path = os.path.join(ROOT, "src", "data.ts")
    src = open(path).read()
    if f'id: "{entry["id"]}"' in src:
        sys.exit(f"ERROR: {entry['id']} already in src/data/companies.ts")

    block = ("  {\n"
             f'    id: "{entry["id"]}",\n'
             f'    name: "{entry["name"]}",\n'
             f'    slug: "{slug}",\n'
             f'    color: "{entry["color"]}",\n'
             f'    url: "{entry["url"]}",\n'
             f'    domain: "{entry["domain"]}",\n'
             f'    city: "{entry["city"]}",\n'
             + (f'    area: "{entry["area"]}",\n' if entry["area"]
                else '    area: null,\n')
             + f'    lat: {entry["lat"]},\n'
             f'    lng: {entry["lng"]},\n'
             f'    category: "{entry["category"]}",\n'
             "  },\n")

    anchor = "const logoFiles"
    idx = src.find(anchor)
    if idx < 0:
        sys.exit("ERROR: logoFiles anchor not found in src/data/companies.ts")
    close = src.rfind("\n]\n", 0, idx)
    if close < 0:
        sys.exit("ERROR: companies array close not found")
    src = src[:close] + "\n" + block.rstrip("\n") + src[close:]

    # logoFiles manifest, kept alphabetical
    m = re.search(r"const logoFiles: Record<string, string> = \{(.*?)\n\}",
                  src, re.S)
    if not m:
        sys.exit("ERROR: logoFiles block not found")
    lines = m.group(1).split("\n")
    new_line = f'  "{slug}": "/logos/{slug}.svg",'
    keys = [re.search(r'"([^"]+)"', ln).group(1)
            for ln in lines if '"' in ln]
    pos = next((i for i, k in enumerate(keys) if k > slug), len(keys))
    # map key position back to line position
    li = 0
    for i, ln in enumerate(lines):
        if '"' in ln:
            if li == pos:
                pos = i
                break
            li += 1
    else:
        pos = len(lines)
    lines.insert(pos, new_line)
    src = (src[:m.start(1)] + "\n".join(lines) + src[m.end(1):])
    open(path, "w").write(src)
    print("  patched src/data/companies.ts (company entry + logoFiles)")


def patch_fetch_roles(board_slug, cid, platform):
    path = os.path.join(HERE, "fetch-roles.py")
    src = open(path).read()
    target = {"greenhouse": "BOARDS", "ashby": "ASHBY_BOARDS",
              "lever": "LEVER_BOARDS",
              "smartrecruiters": "SMARTRECRUITERS"}[platform]
    m = re.search(r"^%s = \{$" % target, src, re.M)
    if not m:
        sys.exit(f"ERROR: {target} dict not found in fetch-roles.py")
    close = src.find("\n}", m.end())
    line = f'    "{board_slug}": ["{cid}"],\n'
    if line.strip() in src:
        print(f"  {target} already has {board_slug} — skipping")
        return
    src = src[:close] + "\n" + line.rstrip("\n") + src[close:]
    open(path, "w").write(src)
    print(f"  patched scripts/fetch-roles.py ({target})")


# ---------------------------------------------------------------- main

def parse_args(argv):
    import argparse
    p = argparse.ArgumentParser(description="Onboard a company to startupJobs")
    p.add_argument("name", help='Company name, e.g. "Figma"')
    p.add_argument("--city", required=True, choices=CITIES)
    p.add_argument("--domain", required=True, help="e.g. figma.com")
    p.add_argument("--category", default="")
    p.add_argument("--color", default="#888888")
    p.add_argument("--apply", action="store_true")
    p.add_argument("--fetch", action="store_true")
    p.add_argument("--yes", action="store_true")
    return p.parse_args(argv)


ARGS = parse_args(sys.argv[1:])
NAME = ARGS.name
SLUG = slugify(NAME)
CID = f"{ARGS.city}-{SLUG}"
DOMAIN = ARGS.domain.lower()
CITY_NAME = {"bengaluru": "Bengaluru", "delhi": "Delhi NCR",
             "mumbai": "Mumbai", "hyderabad": "Hyderabad", "pune": "Pune",
             "chennai": "Chennai", "ahmedabad": "Ahmedabad",
             "kolkata": "Kolkata"}[ARGS.city]


def main():
    print(f"Onboarding {NAME} -> {CID} ({DOMAIN})\n")

    # 1. probe + rank boards
    print("Probing ATS boards...")
    ranked = rank_hits(NAME)
    if not ranked:
        print("  No hits on Lever / Greenhouse / SmartRecruiters / Ashby.")
        print("  Likely Workday / Keka / TurboHire / Kula / custom — "
              "needs manual config. Stopping.")
        sys.exit(1)
    for r in ranked:
        h = r["hit"]
        print(f"  {h['platform']:16s} slug={h['slug']!r:35s} "
              f"total={r['total']:4d} india={r['india']:3d}")
        for title, loc in r["samples"][:3]:
            print(f"      e.g. {title} — {loc}")
    top = ranked[0]
    if top["india"] == 0:
        print("\n  WARNING: no India roles on any board found.")
        if not ask("Continue anyway? (roles feed will be empty)", default_yes=False):
            sys.exit(0)
    elif len(ranked) > 1 and ranked[1]["india"] > 0:
        print("\n  Multiple boards have India roles — confirm the right one.")
        for i, r in enumerate(ranked):
            h = r["hit"]
            print(f"    [{i}] {h['platform']}/{h['slug']} ({r['india']} India)")
        if not ARGS.yes:
            choice = input("  Use which? [0] ").strip() or "0"
            top = ranked[int(choice)]
        if not ask(f"Use {top['hit']['platform']}/{top['hit']['slug']}?"):
            sys.exit(0)
    else:
        h = top["hit"]
        if not ask(f"Use {h['platform']}/{h['slug']} "
                   f"({top['india']} India roles)?"):
            sys.exit(0)
    board = top["hit"]

    # 2. logo
    print("\nFetching logo...")
    svg, src_url = fetch_logo(DOMAIN, SLUG)
    logo_path = os.path.join(ROOT, "public", "logos", f"{SLUG}.svg")
    if svg:
        print(f"  got logo from {src_url} ({len(svg)} bytes)")
        print("  Glance at it before shipping — it must be the real mark.")
        if ARGS.apply:
            open(logo_path, "w").write(svg)
            print(f"  wrote {logo_path}")
    else:
        print("  no logo found — monogram fallback will render. "
              "Add one manually later.")

    # 3. careers URL
    print("\nVerifying careers URL...")
    careers = find_careers_url(DOMAIN)
    if careers:
        print(f"  {careers} (HTTP 200)")
        print("  Open it once — SPAs return 200 for everything.")
        if not ask("Use this careers URL?"):
            careers = prompt("Careers URL")
    else:
        print("  none of the common patterns returned 200.")
        careers = prompt("Careers URL")
    if not careers:
        sys.exit("ERROR: a careers URL is required")

    # 4. coords
    print("\nLocating office...")
    geo = geocode_office(NAME, CITY_NAME)
    lat, lng, area = None, None, None
    if geo:
        glat, glng, label = geo
        print(f"  {label}\n  ({glat}, {glng})")
        if ask("Use this pin? (it is approximate, never the building)"):
            lat, lng = round(glat, 4), round(glng, 4)
            area = prompt("Area label (e.g. Koramangala)", "")
    if lat is None:
        clat, clng = city_center(ARGS.city)
        print(f"  falling back to {CITY_NAME} city center "
              f"({clat}, {clng}), area null — honest, refine later")
        lat, lng = clat, clng

    category = ARGS.category or prompt("Category (e.g. Fintech)")
    color = ARGS.color or "#888888"
    if not ARGS.yes and not ARGS.color:
        color = prompt("Monogram color (only used if logo missing)", "#888888")

    entry = {"id": CID, "name": NAME, "city": ARGS.city, "color": color,
             "url": careers, "domain": DOMAIN, "area": area,
             "lat": lat, "lng": lng, "category": category}

    print("\n--- summary ---")
    print(json.dumps({"company": entry, "slug": SLUG,
                      "board": board, "india_roles": top["india"]},
                     indent=2))

    if not ARGS.apply:
        print("\nDry run — nothing written. Re-run with --apply to patch "
              "src/data/companies.ts, scripts/fetch-roles.py and save the logo.")
        return

    patch_data_ts(entry, SLUG)
    patch_fetch_roles(board["slug"], CID, board["platform"])
    print("\nOnboarded. Next: run `python3 scripts/fetch-roles.py`, "
          "review the new roles, then commit + push.")

    if ARGS.fetch:
        print("\nRunning fetch-roles.py...")
        os.execv(sys.executable,
                 [sys.executable, os.path.join(HERE, "fetch-roles.py")])


main()
