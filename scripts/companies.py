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
        "note": "AWS WAF challenge — needs a real browser to pass",
    },
    {
        "cids": ["bengaluru-phonepe"],
        "name": "PhonePe",
        "url": "https://www.phonepe.com/careers/job-openings/",
        "wait_ms": 12000,
        "note": "Gatsby SPA; jobs API only visible at runtime",
    },
    {
        "cids": ["bengaluru-postman"],
        "name": "Postman",
        "url": "https://www.postman.com/company/careers/open-positions/",
        "wait_ms": 15000,
        "note": "Bot-walled Next.js; real browser may pass",
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
        "note": "DarwinBox SPA shell",
    },
    {
        "cids": ["delhi-delhivery"],
        "name": "Delhivery",
        "url": "https://delhivery.darwinbox.in/ms/candidate/careers",
        "wait_ms": 12000,
        "note": "DarwinBox SPA shell",
    },
    {
        "cids": ["mumbai-dream11"],
        "name": "Dream11",
        "url": "https://dreamsports.group/lifeatdreamsports",
        "wait_ms": 12000,
        "note": "Left Lever; new system unknown",
    },
    {
        "cids": ["mumbai-nykaa"],
        "name": "Nykaa",
        "url": "https://careers.nykaa.com",
        "wait_ms": 12000,
        "note": "Skima platform; API contract unknown",
    },
]
