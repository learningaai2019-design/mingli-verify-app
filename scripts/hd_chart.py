#!/usr/bin/env python3
"""Human Design chart from birth data via kerykeion. JSON stdin -> stdout. No disk PII logs."""
from __future__ import annotations
import json, sys
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
from kerykeion import AstrologicalSubjectFactory

GATE_SEQUENCE = [
    25, 17, 21, 51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52,
    39, 53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57,
    32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60,
    41, 19, 13, 49, 30, 55, 37, 63, 22, 36,
]
HD_START = 358.25
GATE_SIZE = 360.0 / 64.0
LINE_SIZE = GATE_SIZE / 6.0
CHANNELS = [
    (1, 8), (2, 14), (3, 60), (4, 63), (5, 15), (6, 59), (7, 31), (9, 52),
    (10, 20), (10, 34), (10, 57), (11, 56), (12, 22), (13, 33), (16, 48),
    (17, 62), (18, 58), (19, 49), (20, 34), (20, 57), (21, 45), (23, 43),
    (24, 61), (25, 51), (26, 44), (27, 50), (28, 38), (29, 46), (30, 41),
    (32, 54), (34, 57), (35, 36), (37, 40), (39, 55), (42, 53), (47, 64),
]
CHANNEL_CENTERS = {
    (1, 8): ("G", "Throat"), (2, 14): ("G", "Sacral"), (3, 60): ("Sacral", "Root"),
    (4, 63): ("Ajna", "Head"), (5, 15): ("Sacral", "G"), (6, 59): ("Solar Plexus", "Sacral"),
    (7, 31): ("G", "Throat"), (9, 52): ("Sacral", "Root"), (10, 20): ("G", "Throat"),
    (10, 34): ("G", "Sacral"), (10, 57): ("G", "Spleen"), (11, 56): ("Ajna", "Throat"),
    (12, 22): ("Throat", "Solar Plexus"), (13, 33): ("G", "Throat"),
    (16, 48): ("Throat", "Spleen"), (17, 62): ("Ajna", "Throat"),
    (18, 58): ("Spleen", "Root"), (19, 49): ("Root", "Solar Plexus"),
    (20, 34): ("Throat", "Sacral"), (20, 57): ("Throat", "Spleen"),
    (21, 45): ("Heart", "Throat"), (23, 43): ("Throat", "Ajna"),
    (24, 61): ("Ajna", "Head"), (25, 51): ("G", "Heart"),
    (26, 44): ("Heart", "Spleen"), (27, 50): ("Sacral", "Spleen"),
    (28, 38): ("Spleen", "Root"), (29, 46): ("Sacral", "G"),
    (30, 41): ("Solar Plexus", "Root"), (32, 54): ("Spleen", "Root"),
    (34, 57): ("Sacral", "Spleen"), (35, 36): ("Throat", "Solar Plexus"),
    (37, 40): ("Solar Plexus", "Heart"), (39, 55): ("Root", "Solar Plexus"),
    (42, 53): ("Sacral", "Root"), (47, 64): ("Ajna", "Head"),
}
ALL_CENTERS = ["Head", "Ajna", "Throat", "G", "Heart", "Sacral", "Spleen", "Solar Plexus", "Root"]
MOTORS = {"Sacral", "Heart", "Solar Plexus", "Root"}
POINTS = [
    "Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn",
    "Uranus", "Neptune", "Pluto", "Mean_North_Lunar_Node",
]
RIGHT_PROFILES = {"1/3", "1/4", "2/4", "2/5", "3/5", "3/6", "4/6"}
JUXT_PROFILES = {"4/1"}

def degree_to_gate_line(degree: float):
    adjusted = (degree - HD_START) % 360.0
    index = int(adjusted / GATE_SIZE)
    rem = adjusted % GATE_SIZE
    line = min(int(rem / LINE_SIZE) + 1, 6)
    return GATE_SEQUENCE[index], line

def subject_at(dt_local: datetime, lat, lng, tz_str, place):
    return AstrologicalSubjectFactory.from_birth_data(
        name="hd",
        year=dt_local.year, month=dt_local.month, day=dt_local.day,
        hour=dt_local.hour, minute=dt_local.minute, seconds=dt_local.second,
        city=place, nation="HK", lat=lat, lng=lng, tz_str=tz_str,
        online=False, active_points=POINTS, suppress_geonames_warning=True,
    )

def longitudes(subj):
    sun = subj.sun.abs_pos
    nn = subj.mean_north_lunar_node.abs_pos
    return {
        "Sun": sun, "Earth": (sun + 180.0) % 360.0, "Moon": subj.moon.abs_pos,
        "Mercury": subj.mercury.abs_pos, "Venus": subj.venus.abs_pos, "Mars": subj.mars.abs_pos,
        "Jupiter": subj.jupiter.abs_pos, "Saturn": subj.saturn.abs_pos, "Uranus": subj.uranus.abs_pos,
        "Neptune": subj.neptune.abs_pos, "Pluto": subj.pluto.abs_pos,
        "North Node": nn, "South Node": (nn + 180.0) % 360.0,
    }

def activations(bodies):
    out = {}
    for name, lon in bodies.items():
        g, l = degree_to_gate_line(lon)
        out[name] = {"longitude": round(lon, 4), "gate": g, "line": l, "activation": f"{g}.{l}"}
    return out

def find_design_datetime(birth_local, lat, lng, tz_str, place):
    birth_sun = subject_at(birth_local, lat, lng, tz_str, place).sun.abs_pos
    target = (birth_sun - 88.0) % 360.0
    lo = birth_local - timedelta(days=95)
    hi = birth_local - timedelta(days=80)
    mid = lo
    sun = birth_sun
    for _ in range(50):
        mid = (lo + (hi - lo) / 2).replace(microsecond=0)
        sun = subject_at(mid, lat, lng, tz_str, place).sun.abs_pos
        diff = (sun - target + 180.0) % 360.0 - 180.0
        if abs(diff) < 1e-5:
            break
        if diff > 0:
            hi = mid
        else:
            lo = mid
    return mid

def main():
    data = json.load(sys.stdin)
    lat = float(data.get("lat", 22.3193))
    lng = float(data.get("lng", 114.1694))
    tz_str = data.get("timezone") or "Asia/Hong_Kong"
    place = data.get("place") or "Hong Kong"
    birth_local = datetime(
        int(data["year"]), int(data["month"]), int(data["day"]),
        int(data.get("hour", 12)), int(data.get("minute", 0)), 0,
        tzinfo=ZoneInfo(tz_str),
    )
    design_local = find_design_datetime(birth_local, lat, lng, tz_str, place)
    pers = activations(longitudes(subject_at(birth_local, lat, lng, tz_str, place)))
    des = activations(longitudes(subject_at(design_local, lat, lng, tz_str, place)))
    all_gates = sorted({a["gate"] for a in list(pers.values()) + list(des.values())})
    gate_set = set(all_gates)
    defined_channels = []
    for a, b in CHANNELS:
        if a in gate_set and b in gate_set:
            ck = (a, b) if (a, b) in CHANNEL_CENTERS else (b, a)
            defined_channels.append({"gates": f"{min(a,b)}-{max(a,b)}", "centers": list(CHANNEL_CENTERS[ck])})
    defined_centers = set()
    graph = {c: set() for c in ALL_CENTERS}
    for ch in defined_channels:
        c1, c2 = ch["centers"]
        defined_centers.add(c1); defined_centers.add(c2)
        graph[c1].add(c2); graph[c2].add(c1)
    has_sacral = "Sacral" in defined_centers
    has_throat = "Throat" in defined_centers
    motor_to_throat = False
    if has_throat:
        visited, q = set(), ["Throat"]
        while q:
            cur = q.pop(0)
            if cur in visited: continue
            visited.add(cur)
            if cur in MOTORS:
                motor_to_throat = True
                break
            q.extend(graph[cur] - visited)
    if not defined_centers:
        hd_type = "Reflector"
    elif has_sacral and motor_to_throat:
        hd_type = "Manifesting Generator"
    elif has_sacral:
        hd_type = "Generator"
    elif motor_to_throat:
        hd_type = "Manifestor"
    else:
        hd_type = "Projector"
    strategy = {
        "Manifestor": "Inform", "Generator": "Wait to Respond",
        "Manifesting Generator": "Wait to Respond, then Inform",
        "Projector": "Wait for the Invitation", "Reflector": "Wait a Lunar Cycle",
    }[hd_type]
    auth = "Mental / Environmental"
    for center, name in [
        ("Solar Plexus", "Emotional"), ("Sacral", "Sacral"), ("Spleen", "Splenic"),
        ("Heart", "Ego"), ("G", "Self-Projected"),
    ]:
        if center in defined_centers:
            auth = name
            break
    if hd_type == "Reflector":
        auth = "Lunar"
    profile = f"{pers['Sun']['line']}/{des['Sun']['line']}"
    if profile in RIGHT_PROFILES: angle = "Right Angle"
    elif profile in JUXT_PROFILES: angle = "Juxtaposition"
    else: angle = "Left Angle"
    visited, components = set(), 0
    for c in defined_centers:
        if c in visited: continue
        components += 1
        stack = [c]
        while stack:
            x = stack.pop()
            if x in visited: continue
            visited.add(x)
            stack.extend((graph[x] & defined_centers) - visited)
    definition = {0: "No Definition", 1: "Single", 2: "Split", 3: "Triple Split", 4: "Quadruple Split"}.get(
        components, f"{components}-way Split"
    )
    type_zh = {
        "Manifestor": "顯示者", "Generator": "生產者", "Manifesting Generator": "顯示生產者",
        "Projector": "投射者", "Reflector": "反映者",
    }
    auth_zh = {
        "Emotional": "情緒權威", "Sacral": "骶骨權威", "Splenic": "脾臟權威",
        "Ego": "自我權威", "Self-Projected": "自我投射權威", "Lunar": "月亮權威",
        "Mental / Environmental": "環境／理智權威",
    }
    out = {
        "Type": hd_type, "TypeZh": type_zh.get(hd_type, hd_type),
        "Strategy": strategy, "Authority": auth, "AuthorityZh": auth_zh.get(auth, auth),
        "Profile": profile, "Definition": definition, "Angle": angle,
        "defined_centers": sorted(defined_centers),
        "undefined_centers": sorted(set(ALL_CENTERS) - defined_centers),
        "channels": defined_channels, "activated_gates": all_gates,
        "Personality_Sun": pers["Sun"]["activation"],
        "Design_Sun": des["Sun"]["activation"],
        "design_datetime_local": design_local.isoformat(),
        "birth_datetime_local": birth_local.isoformat(),
    }
    json.dump(out, sys.stdout, ensure_ascii=False)

if __name__ == "__main__":
    main()
