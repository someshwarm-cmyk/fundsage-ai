import re

MOCK_NAV = '''
MOCK_NAV_DATA = {}
def generate_mock_nav(base_nav=100.0, years=12):
    """Generate realistic mock NAV history"""
    import random
    random.seed(42)
    nav_data = []
    nav = base_nav
    from datetime import datetime, timedelta
    today = datetime.now()
    for i in range(years * 252):
        date = today - timedelta(days=i)
        if date.weekday() < 5:
            change = random.gauss(0.0004, 0.012)
            nav = max(nav * (1 + change), 1.0)
            nav_data.append({
                "date": date.strftime("%d-%m-%Y"),
                "nav": str(round(nav, 4))
            })
    return nav_data

FUND_BASE_NAVS = {
    "119598": 85.0,  "120505": 70.0,  "118989": 90.0,
    "120716": 55.0,  "125494": 45.0,  "120503": 30.0,
    "118701": 65.0,  "119775": 95.0,  "120828": 75.0,
    "118255": 80.0,  "119270": 60.0,  "120507": 50.0,
    "118550": 40.0,  "120206": 35.0,  "119093": 88.0,
    "119016": 40.0,  "119237": 35.0,  "120594": 30.0,
    "118477": 45.0,  "119364": 38.0,  "118825": 42.0,
    "120831": 28.0,  "118632": 32.0,  "120832": 25.0,
    "119261": 55.0,  "118834": 75.0,  "119247": 80.0,
    "119788": 20.0,  "120473": 18.0,  "118663": 22.0,
    "119761": 19.0,  "119177": 17.0,
}

def get_mock_nav_data(scheme_code: str, fund_type: str = "equity") -> dict:
    base = FUND_BASE_NAVS.get(scheme_code, 50.0)
    history = generate_mock_nav(base_nav=base)
    fallback_names = {}
    for ft, codes in FALLBACK_CODES.items():
        for code, name in codes:
            fallback_names[code] = (name, ft)
    name, ft = fallback_names.get(scheme_code, (f"Fund {scheme_code}", fund_type))
    return {
        "meta": {
            "scheme_name": name,
            "fund_house": name.split()[0] if name else "Unknown",
            "scheme_type": "Open Ended",
            "scheme_category": ft.capitalize(),
            "isin_growth": f"INF{scheme_code}01",
        },
        "data": history,
        "status": "mock"
    }
'''

with open("main.py", "r") as f:
    content = f.read()

# Insert mock data after FALLBACK_CODES dict
insert_after = 'FALLBACK_CODES = {'
idx = content.find('\nrf_model     = None')
if 'MOCK_NAV_DATA' not in content:
    content = content[:idx] + '\n' + MOCK_NAV + '\n' + content[idx:]

# Patch fetch_nav_data to use mock when real fails
old_fetch = '''async def fetch_nav_data(scheme_code: str) -> dict:
    url = f"https://api.mfapi.in/mf/{scheme_code}"
    try:
        async with httpx.AsyncClient(timeout=20.0) as c:
            resp = await c.get(url)
            if resp.status_code == 200:
                return resp.json()
    except Exception:
        pass
    return None'''

new_fetch = '''async def fetch_nav_data(scheme_code: str, fund_type: str = "equity") -> dict:
    url = f"https://api.mfapi.in/mf/{scheme_code}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as c:
            resp = await c.get(url)
            if resp.status_code == 200:
                text = resp.text.strip()
                if text and text != "null" and "<html" not in text:
                    return resp.json()
    except Exception:
        pass
    print(f"MFAPI unavailable for {scheme_code} — using mock data")
    return get_mock_nav_data(scheme_code, fund_type)'''

content = content.replace(old_fetch, new_fetch)

# Patch get_fund_list_dynamic to skip search
old_dynamic = '''async def get_fund_list_dynamic(fund_type: str, num_needed: int) -> list:
    queries  = FUND_SEARCH_QUERIES.get(fund_type.lower(), FUND_SEARCH_QUERIES["equity"])
    keywords = CATEGORY_KEYWORDS.get(fund_type.lower(), [])
    search_tasks = [search_funds_by_query(q) for q in queries]
    all_results  = await asyncio.gather(*search_tasks)
    seen_codes = set()
    fund_list  = []
    for results in all_results:
        for r in results:
            code       = str(r["schemeCode"])
            name       = r["schemeName"]
            name_lower = name.lower()
            if code in seen_codes:
                continue
            if keywords and not any(k in name_lower for k in keywords):
                continue
            seen_codes.add(code)
            fund_list.append({"code": code, "name": name})
            if len(fund_list) >= num_needed + 5:
                break
        if len(fund_list) >= num_needed + 5:
            break
    print(f"Dynamic search: found {len(fund_list)} valid {fund_type} funds for {num_needed} requested")
    # Fallback when MFAPI search is down
    if len(fund_list) == 0:
        print(f"WARNING: MFAPI search down — using fallback scheme codes for {fund_type}")
        fallback = FALLBACK_CODES.get(fund_type.lower(), [])
        for code, name in fallback[:num_needed + 5]:
            fund_list.append({"code": code, "name": name})
        print(f"Fallback: loaded {len(fund_list)} hardcoded funds")
    return fund_list'''

new_dynamic = '''async def get_fund_list_dynamic(fund_type: str, num_needed: int) -> list:
    # Use fallback codes directly (MFAPI search blocked in this environment)
    fallback = FALLBACK_CODES.get(fund_type.lower(), FALLBACK_CODES["equity"])
    fund_list = [{"code": code, "name": name} for code, name in fallback[:num_needed + 5]]
    print(f"Using fallback codes: {len(fund_list)} {fund_type} funds")
    return fund_list'''

content = content.replace(old_dynamic, new_dynamic)

# Patch process_fund to pass fund_type to fetch_nav_data
content = content.replace(
    'data = await fetch_nav_data(info["code"])',
    'data = await fetch_nav_data(info["code"], fund_type)'
)

with open("main.py", "w") as f:
    f.write(content)

print("✅ Patch applied successfully!")
