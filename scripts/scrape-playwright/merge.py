"""Merge Playwright scraper output into src/data/roles.ts — standalone.

Reads scripts/scrape-playwright/out/*.json (role dicts written by scrape.py),
surgically replaces any existing "pw-" roles in src/data/roles.ts, and writes back.
Idempotent: run it any number of times, result is the same.

This exists so the weekly JSON-feed workflow (fetch-roles.py, which
regenerates roles.ts from scratch) can re-apply scraper roles afterwards
without fetch-roles.py itself needing changes:

    python3 scripts/fetch-roles.py
    python3 scripts/scrape-playwright/merge.py
"""

import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "out")
ROLES_TS = os.path.join(HERE, "..", "..", "src", "data", "roles.ts")

KEYS = ["id", "companyId", "title", "team", "level", "location",
        "city", "workMode", "postedAt", "applyUrl"]


def _ts_escape(s):
    return json.dumps(s)  # valid TS string literal too


def _role_to_ts(role):
    lines = ["  {"]
    for k in KEYS:
        lines.append(f"    {k}: {_ts_escape(role.get(k))},")
    lines.append("  },")
    return "\n".join(lines)


def main():
    if not os.path.isdir(OUT):
        print("no scraper output dir, nothing to merge")
        return
    incoming = []
    for fn in sorted(os.listdir(OUT)):
        if not fn.endswith(".json"):
            continue
        try:
            roles = json.load(open(os.path.join(OUT, fn)))
        except Exception:
            continue
        for r in roles if isinstance(roles, list) else []:
            if r.get("title") and r.get("applyUrl") and r.get("companyId"):
                # normalize id prefix so re-runs replace cleanly
                if not str(r.get("id", "")).startswith("pw-"):
                    r["id"] = f"pw-{r['companyId']}-{r['id']}"
                incoming.append(r)
    print(f"merging {len(incoming)} playwright roles")

    src = open(ROLES_TS).read()
    # Split into: head (up to roles array), role blocks, tail.
    m = re.search(r"export const roles: Role\[\] = \[\n", src)
    if not m:
        print("ERROR: roles array not found in roles.ts")
        return
    head, rest = src[: m.end()], src[m.end():]
    # rest = sequence of "  {...},\n" blocks ending with "];\n"
    tail_idx = rest.rfind("];")
    body, tail = rest[:tail_idx], rest[tail_idx:]

    kept_blocks = []
    for bm in re.finditer(r"  \{(?:[^{}]|\{[^{}]*\})*?\},\n", body, re.S):
        block = bm.group(0)
        if re.search(r'id:\s*"pw-', block):
            continue  # drop old playwright roles; fresh ones appended below
        kept_blocks.append(block)

    new_blocks = [_role_to_ts(r) + "\n" for r in incoming]
    # sort everything by postedAt desc like the generator does
    # (simple: keep existing order, append new at end — page sorts client-side)
    out = head + "".join(kept_blocks) + "".join(new_blocks) + tail
    open(ROLES_TS, "w").write(out)
    print(f"roles.ts updated: kept {len(kept_blocks)} feed roles, "
          f"wrote {len(new_blocks)} playwright roles")


if __name__ == "__main__":
    main()
