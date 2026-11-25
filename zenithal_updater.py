import urllib.request
import xml.etree.ElementTree as ET
import json
from datetime import datetime, timezone, timedelta

# 1. Fetch live Kolkata weather (with safety net so it never crashes)
temp_text = "Kolkata: Live"
try:
    weather_url = "https://open-meteo.com"
    weather_raw = urllib.request.urlopen(weather_url, timeout=10).read().decode("utf-8")
    if weather_raw.strip():
        weather_res = json.loads(weather_raw)
        temp = weather_res["current_weather"]["temperature"]
        temp_text = f"Kolkata: {temp}°C"
except Exception as e:
    print("Weather fallback used:", e)

# 2. Fetch live top news headlines
headlines = []
try:
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    }
    news_url = "https://google.com"
    news_req = urllib.request.Request(news_url, headers=headers)
    news_xml = urllib.request.urlopen(news_req, timeout=10).read()
    root = ET.fromstring(news_xml)
    for item in root.findall("./channel/item")[:5]:
        headlines.append({
            "title": item.find("title").text,
            "link": item.find("link").text
        })
except Exception as e:
    print("News fallback used:", e)

if not headlines:
    headlines.append({
        "title": "Zenithal Live Search Index Active",
        "link": "https://vercel.app"
    })

# 3. Record exact IST update time
ist = timezone(timedelta(hours=5, minutes=30))
now_ist = datetime.now(ist).strftime("%d %b %Y, %I:%M %p IST")

# 4. Save everything to zenithal_index.json
data = {
    "engine": "Zenithal Enterprise",
    "last_updated": now_ist,
    "weather": temp_text,
    "top_news": headlines
}

with open("zenithal_index.json", "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("Zenithal index updated at:", now_ist)
