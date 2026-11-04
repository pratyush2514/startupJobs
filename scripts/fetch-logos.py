#!/usr/bin/env python3
"""Fetch real company logos for slugs that don't have one yet.

Runs in the 6-hourly GitHub workflow BEFORE fetch-roles.py so the map never
ships a monogram (alphabet) fallback. Idempotent: slugs that already have a
logo file are skipped, so a normal run does zero network calls.

The logo is the company's own brand asset (single source of truth). Every
source is derived from the company's domain -- no third-party logo
databases, no guessing:
  1. unavatar.io/{domain} (the domain's published icon, fallback=false --
     often serves the real vector SVG)
  2. logo.clearbit.com/{domain} (Clearbit's logo API)
  3. Google favicon service (sz=128)
  4. DuckDuckGo favicon service
  5. https://{domain}/favicon.ico (the company's own server)
Each source is tried against both the recorded domain and its registrable
root (e.g. careers.zerodha.com -> zerodha.com).

Validation: SVG responses are accepted when they contain real vector art
(shapes/paths, not error pages); <script> elements are stripped and the SVG
is saved directly -- vector beats raster. Raster PNG/JPEG/ICO must decode
under Pillow and measure at least 32px on the short side (pins render at
42px, so 16px favicons are rejected as blurry). ICO frames are converted to
PNG via Pillow. Of the valid raster candidates the largest (by pixel area)
wins.

Output: public/logos/{slug}.svg -- an SVG wrapper holding the raster image
as a data URI, the same convention as the existing logo files. The
logoFiles manifest in src/data/companies.ts is patched in alphabetical
order.

Exit status is always 0: a slug that can't be resolved this run is printed
as a WARN line and retried on the next run. A hard failure (bad manifest,
unwritable files) exits non-zero so the workflow goes red.
"""

import base64
import io
import pathlib
import re
import sys
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
COMPANIES_TS = ROOT / "src" / "data" / "companies.ts"
LOGOS_DIR = ROOT / "public" / "logos"

UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) startup-jobs-logo-bot/1.0"}
MIN_SIDE = 32  # px; pins render at 42px
MULTI_SUFFIXES = ("co.in", "com.in", "org.in", "net.in", "firm.in",
                  "gen.in", "ind.in")


def get(url, timeout=15):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def root_domain(domain):
    """careers.zerodha.com -> zerodha.com ; elasticrun.in -> elasticrun.in."""
    parts = domain.lower().split(".")
    if len(parts) > 2 and ".".join(parts[-2:]) in MULTI_SUFFIXES:
        return ".".join(parts[-3:])
    return ".".join(parts[-2:]) if len(parts) > 2 else domain


def domain_variants(domain):
    variants = [domain]
    root = root_domain(domain)
    if root != domain:
        variants.append(root)
    return variants


def as_png(data):
    """Return (png_bytes, width, height) or None for PNG/JPEG/ICO input."""
    from PIL import Image
    try:
        im = Image.open(io.BytesIO(data))
    except Exception:
        return None
    # ICO: pick the largest frame, not just the first
    best = None
    try:
        n = getattr(im, "n_frames", 1)
        for i in range(n):
            try:
                im.seek(i)
            except Exception:
                break
            w, h = im.size
            if best is None or w * h > best[0] * best[1]:
                best = (w, h, im.copy())
    except Exception:
        return None
    if best is None:
        return None
    w, h, frame = best
    if min(w, h) < MIN_SIDE:
        return None
    # Reject blank placeholders (e.g. unavatar's 1-color 128px PNG).
    rgb = frame.convert("RGB")
    colors = rgb.getcolors(maxcolors=w * h)
    if colors is not None and len(colors) <= 1:
        return None
    buf = io.BytesIO()
    frame.convert("RGBA").save(buf, "PNG")
    return buf.getvalue(), w, h


SVG_SHAPES = (b"<path", b"<circle", b"<rect", b"<image", b"<polygon",
                b"<ellipse", b"<line", b"<text")


def clean_svg(data):
    """Return the SVG text if it's real vector art, else None.

    Strips <script> elements (defense in depth; our <img> usage wouldn't
    execute them anyway) and rejects SVGs with no drawing content.
    """
    head = data.lstrip()[:200].lower()
    if not (head.startswith(b"<svg") or head.startswith(b"<?xml")):
        return None
    try:
        text = data.decode("utf-8", errors="strict")
    except Exception:
        return None
    if "<svg" not in text.lower():
        return None
    low = text.lower().encode()
    if not any(shape in low for shape in SVG_SHAPES):
        return None
    text = re.sub(r"<script\b.*?</script\s*>", "", text,
                  flags=re.S | re.I)
    return text


def fetch_logo(domain, slug):
    """Return (svg_text, source_url) or (None, None).

    A directly-served vector SVG always wins over raster candidates.
    """
    raster = []
    for variant in domain_variants(domain):
        urls = [
            f"https://unavatar.io/{variant}?fallback=false",
            f"https://logo.clearbit.com/{variant}?size=128",
            f"https://www.google.com/s2/favicons?domain={variant}&sz=128",
            f"https://icons.duckduckgo.com/ip3/{variant}.ico",
            f"https://{variant}/apple-touch-icon.png",
            f"https://{variant}/favicon.ico",
        ]
        for url in urls:
            try:
                data = get(url)
            except Exception:
                continue
            if len(data) < 200:
                continue
            svg = clean_svg(data)
            if svg is not None:
                return svg, url + " [vector]"
            conv = as_png(data)
            if conv is None:
                continue
            png, w, h = conv
            raster.append((w * h, png, url))
    if not raster:
        return None, None
    _, png, src = max(raster, key=lambda c: c[0])
    b64 = base64.b64encode(png).decode()
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" '
        f'viewBox="0 0 64 64"><image href="data:image/png;base64,{b64}" '
        f'x="0" y="0" width="64" height="64"/></svg>'
    )
    return svg, src


def parse_companies():
    """Return (full_text, [(slug, domain)], {slug: path})."""
    text = COMPANIES_TS.read_text()
    comp_part = text.split("/** Local logo files")[0]
    pairs = []
    for m in re.finditer(
        r'slug:\s*"([^"]+)"(.*?)(?=\n\s*\},|\n\s*\{)',
        comp_part, re.S,
    ):
        slug, mid = m.group(1), m.group(2)
        dom = re.search(r'domain:\s*"([^"]+)"', mid)
        if dom:
            pairs.append((slug, dom.group(1)))
    block = re.search(
        r"const logoFiles: Record<string, string> = \{(.*?)\n\};",
        text, re.S,
    )
    if not block:
        sys.exit("ERROR: logoFiles block not found in src/data/companies.ts")
    have = dict(re.findall(r'"?([\w-]+)"?\s*:\s*"([^"]+)"', block.group(1)))
    return text, pairs, have, block


def key_style(slug):
    return f'"{slug}"' if "-" in slug else slug


def main():
    only = set(sys.argv[1:]) if len(sys.argv) > 1 else None
    try:
        from PIL import Image  # noqa: F401
    except ImportError:
        sys.exit("ERROR: Pillow is required (pip install pillow)")
    LOGOS_DIR.mkdir(parents=True, exist_ok=True)

    text, pairs, have, block = parse_companies()
    seen_slugs = set()
    targets = []
    for slug, domain in pairs:
        if slug in seen_slugs:
            continue
        seen_slugs.add(slug)
        if only and slug not in only:
            continue
        if slug in have:
            continue
        targets.append((slug, domain))

    if not targets:
        print("fetch-logos: every company already has a logo, nothing to do")
        return

    new_entries = {}
    for slug, domain in targets:
        svg, src = fetch_logo(domain, slug)
        if svg is None:
            print(f"WARN: no usable logo for {slug} (domain {domain})")
            continue
        (LOGOS_DIR / f"{slug}.svg").write_text(svg)
        new_entries[slug] = f"/logos/{slug}.svg"
        print(f"OK: {slug} <- {src}")

    if not new_entries:
        return

    # Patch the manifest alphabetically.
    merged = dict(have)
    merged.update(new_entries)
    lines = [
        f'  {key_style(slug)}: "{merged[slug]}",'
        for slug in sorted(merged)
    ]
    new_block = "const logoFiles: Record<string, string> = {\n" + "\n".join(
        lines) + "\n};"
    text = (text[: block.start()] + new_block + text[block.end():])
    COMPANIES_TS.write_text(text)

    # Verify: every new entry resolves to a real file.
    bad = [s for s in new_entries
           if not (ROOT / "public" / new_entries[s].lstrip("/")).exists()]
    if bad:
        sys.exit(f"ERROR: wrote manifest but files missing: {bad}")
    print(f"fetch-logos: added {len(new_entries)} logos: "
          f"{', '.join(sorted(new_entries))}")


if __name__ == "__main__":
    main()
