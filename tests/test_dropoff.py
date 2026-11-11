"""Nearest drop-off (web/app/dropoff.js, dropoff_data.js, tools/fetch_osm_dropoff.py): the data is only what OpenStreetMap returned, the page says it is incomplete, and nothing leaves the browser."""
import json
import re

DATA = open("web/app/dropoff_data.js", encoding="utf-8").read()
JS = open("web/app/dropoff.js", encoding="utf-8").read()
TOOL = open("tools/fetch_osm_dropoff.py", encoding="utf-8").read()
D = json.loads(re.search(r"window\.KS_DROPOFF = (.*);\s*$", DATA, re.S).group(1))


def test_data_carries_its_licence_and_date():
    assert "OpenStreetMap contributors" in D["source"] and "Open Database Licence" in D["source"]
    assert re.fullmatch(r"\d{4}-\d{2}-\d{2}", D["retrieved"]) and "Not verified on the ground" in D["method"]
    assert len(D["cities"]) >= 5


def test_every_city_is_ok_with_points_or_says_why_not():
    for name, c in D["cities"].items():
        assert c["status"] in ("ok", "not_checked"), name
        if c["status"] == "ok":
            assert c["osm_base"] and isinstance(c["points"], list), name
        else:
            assert c["reason"] and c["points"] == [], name        # a failed query is "not checked", never "zero points"
    assert any(c["status"] == "ok" and len(c["points"]) > 0 for c in D["cities"].values())


def test_points_are_plain_osm_records_inside_their_rectangle():
    seen = set()
    for name, c in D["cities"].items():
        s, w, n, e = c["bbox"]
        for p in c["points"]:
            assert set(p) == {"id", "lat", "lon", "name", "kinds", "operator", "hours"}, p
            assert re.fullmatch(r"(node|way)/\d+", p["id"]) and p["id"] not in seen
            seen.add(p["id"])
            assert s <= p["lat"] <= n and w <= p["lon"] <= e, (name, p["id"])
            assert p["kinds"] == sorted(p["kinds"]) and all(isinstance(k, str) for k in p["kinds"])
            assert p["name"] is None or isinstance(p["name"], str)


def test_page_says_it_is_incomplete_and_credits_openstreetmap():
    assert "incomplete" in JS and "We have not visited or checked any of them" in JS
    assert "openstreetmap.org/copyright" in JS and "Open Database Licence" in JS
    assert "not that the city has few drop-off points" in JS         # a sparse count is a gap in the map, not in the city
    assert 'rel="noopener"' in JS


def test_page_sends_nothing_and_location_is_opt_in():
    for banned in ("fetch(", "XMLHttpRequest", "sendBeacon", "localStorage", "sessionStorage", "document.cookie"):
        assert banned not in JS, banned
    assert "getCurrentPosition" in JS and 'id="dp-here"' in JS and "not sent or stored anywhere" in JS


def test_fetch_tool_uses_a_generic_client_name_and_never_turns_a_failure_into_zero():
    ua = re.search(r'UA = "([^"]+)"', TOOL).group(1)
    assert "@" not in ua and "gmail" not in ua.lower()
    assert 'status="ok"' in TOOL and '"not_checked"' in TOOL
