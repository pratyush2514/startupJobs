"""Per-company config for the Playwright scrapers.

Each entry: the official careers URL + which of our company ids it feeds.
The scraper captures the page's own network JSON first (job APIs change
less often than DOM), falling back to rendered job-card links.
"""

COMPANIES = [
    {
        "cids": ["bengaluru-zepto", "mumbai-zepto"],
        "name": "Zepto",
        "url": "https://www.zepto.com/careers",
        "wait_ms": 12000,
        "note": "Darwinbox portal gated behind Google SSO login (verified 2026-11-02) — "
                "no public listings route; needs user sign-in or an alternate source",
    },
    {
        "cids": ["bengaluru-phonepe"],
        "name": "PhonePe",
        "url": "https://www.phonepe.com/careers/job-openings/",
        "wait_ms": 12000,
        "note": "Gatsby SPA; jobs API only visible at runtime",
    },

    {
        "cids": ["delhi-zomato"],
        "name": "Zomato",
        "url": "https://www.eternal.com/careers",
        "wait_ms": 8000,
        "note": "Post-rebrand static page; may genuinely list nothing",
    },
    {
        "cids": ["delhi-oyo"],
        "name": "OYO",
        "url": "https://oyo.darwinbox.in/ms/candidatev2/main/careers",
        "wait_ms": 12000,
        "note": "Darwinbox tenant gated behind OYO employee SSO (Microsoft PRISM, verified 2026-11-02) — no public listings route; needs an alternate source",
    },
    {
        "cids": ["delhi-delhivery"],
        "name": "Delhivery",
        "url": "https://delhivery.darwinbox.in/ms/candidate/careers",
        "wait_ms": 12000,
        "note": "Darwinbox tenant gated behind Delhivery employee SSO (verified 2026-11-02) — no public listings route; needs an alternate source",
    },
    {
        "cids": ["mumbai-dream11"],
        "name": "Dream11",
        "url": "https://dreamsports.group/lifeatdreamsports",
        "wait_ms": 12000,
        "note": "Official site has no listings and links to no job board (verified 2026-11-02); old Lever boards 404. LinkedIn company page shows ~137 jobs — needs login, not pursued",
    },
    {
        "cids": ["mumbai-nykaa"],
        "name": "Nykaa",
        "url": "https://careers.nykaa.com",
        "wait_ms": 12000,
        "note": "Skima platform; API contract unknown",
    },
]
