#!/usr/bin/env python3
"""Tropical Placidus chart via kerykeion. Reads JSON stdin, writes JSON stdout. No logging of raw PII to disk."""
from __future__ import annotations
import json, sys
from kerykeion import AstrologicalSubjectFactory

PLANETS = [
    "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
    "uranus", "neptune", "pluto", "mean_north_lunar_node", "chiron",
]
SIGNS = [
    "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
    "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]
SIGN_ZH = {
    "Aries": "白羊", "Taurus": "金牛", "Gemini": "雙子", "Cancer": "巨蟹",
    "Leo": "獅子", "Virgo": "處女", "Libra": "天秤", "Scorpio": "天蠍",
    "Sagittarius": "射手", "Capricorn": "摩羯", "Aquarius": "水瓶", "Pisces": "雙魚",
    # kerykeion short codes
    "Ari": "白羊", "Tau": "金牛", "Gem": "雙子", "Can": "巨蟹",
    "Leo": "獅子", "Vir": "處女", "Lib": "天秤", "Sco": "天蠍",
    "Sag": "射手", "Cap": "摩羯", "Aqu": "水瓶", "Pis": "雙魚",
}
SIGN_FULL = {
    "Ari": "Aries", "Tau": "Taurus", "Gem": "Gemini", "Can": "Cancer",
    "Leo": "Leo", "Vir": "Virgo", "Lib": "Libra", "Sco": "Scorpio",
    "Sag": "Sagittarius", "Cap": "Capricorn", "Aqu": "Aquarius", "Pis": "Pisces",
}
PLANET_ZH = {
    "sun": "太陽", "moon": "月亮", "mercury": "水星", "venus": "金星", "mars": "火星",
    "jupiter": "木星", "saturn": "土星", "uranus": "天王星", "neptune": "海王星",
    "pluto": "冥王星", "mean_north_lunar_node": "北交點", "chiron": "凱龍",
}

def main():
    data = json.load(sys.stdin)
    lat = float(data.get("lat", 22.3193))
    lng = float(data.get("lng", 114.1694))
    tz = data.get("timezone") or "Asia/Hong_Kong"
    subj = AstrologicalSubjectFactory.from_birth_data(
        name="anon",
        year=int(data["year"]), month=int(data["month"]), day=int(data["day"]),
        hour=int(data.get("hour", 12)), minute=int(data.get("minute", 0)),
        city=data.get("place") or "Hong Kong", nation="HK",
        lat=lat, lng=lng, tz_str=tz, online=False,
        houses_system_identifier="P",
        suppress_geonames_warning=True,
    )
    placements = []
    for key in PLANETS:
        p = getattr(subj, key, None)
        if p is None:
            continue
        sign = getattr(p, "sign", None) or SIGNS[int(p.abs_pos // 30) % 12]
        sign = SIGN_FULL.get(sign, sign)
        placements.append({
            "planet": key,
            "planetZh": PLANET_ZH.get(key, key),
            "sign": sign,
            "signZh": SIGN_ZH.get(sign, sign),
            "degree": round(p.abs_pos % 30, 3),
            "absPos": round(p.abs_pos, 4),
            "house": getattr(p, "house", None),
            "retrograde": bool(getattr(p, "retrograde", False)),
        })
    house_attrs = [
        "first_house","second_house","third_house","fourth_house","fifth_house","sixth_house",
        "seventh_house","eighth_house","ninth_house","tenth_house","eleventh_house","twelfth_house",
    ]
    houses = []
    for i, attr in enumerate(house_attrs, start=1):
        h = getattr(subj, attr, None)
        if h is None:
            continue
        sign = getattr(h, "sign", SIGNS[int(h.abs_pos // 30) % 12])
        sign = SIGN_FULL.get(sign, sign)
        houses.append({
            "house": i,
            "sign": sign,
            "signZh": SIGN_ZH.get(sign, sign),
            "degree": round(h.abs_pos % 30, 3),
            "absPos": round(h.abs_pos, 4),
        })
    asc = subj.first_house
    out = {
        "system": "tropical / Placidus",
        "ascendant": {
            "sign": SIGN_FULL.get(asc.sign, asc.sign),
            "signZh": SIGN_ZH.get(SIGN_FULL.get(asc.sign, asc.sign), asc.sign),
            "degree": round(asc.abs_pos % 30, 3),
        },
        "placements": placements,
        "houses": houses,
    }
    json.dump(out, sys.stdout, ensure_ascii=False)

if __name__ == "__main__":
    main()
