"""Ward pages: garbage uptime calendar, QR one-tap flow, green ward badge (web/app/ward.js, run in Node)."""
import json
import os
import shutil
import subprocess

import pandas as pd
import pytest

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="node not installed")

JS = r"""
const W = require(process.cwd() + '/web/app/ward.js');
const Q = require(process.cwd() + '/web/app/vendor/qrcode.js');
const out = {};
const id = W.wardId('Kerala', 'Kochi', 'Ward 12');
out.id = id; out.parsed = W.parseWardId(id); out.badId = W.parseWardId('Kerala~Kochi');
out.cleaned = W.cleanPart('a/b?c#d%e~f');
const T = '2026-11-10', base = {ward: id, today: T, device: 'dev1'};
out.future = W.recordTap([], {...base, date: '2026-11-11', status: 'collected'}).error;
out.old = W.recordTap([], {...base, date: '2026-09-01', status: 'collected'}).error;
out.badStatus = W.recordTap([], {...base, date: T, status: 'maybe'}).error;
out.badDate = W.recordTap([], {...base, date: '2026-02-30', status: 'collected'}).error;
out.noWard = W.recordTap([], {...base, ward: '', date: T, status: 'collected'}).error;
let r1 = W.recordTap([], {...base, date: T, status: 'collected'});
let r2 = W.recordTap(r1.list, {...base, date: T, status: 'not_collected'});
out.replace = {n: r2.list.length, status: r2.list[0].status, replaced: r2.replaced, first: r1.replaced};
out.month = W.lastDays('2026-03-02', 4);
// summaries and badge thresholds
function mk(nReported, nCollected) {
  let list = [];
  for (let i = 0; i < nReported; i++) list.push({ward: id, date: W.addDays(T, -i), status: i < nCollected ? 'collected' : 'not_collected', saved_at: 'x', device: 'd'});
  return W.summarise(list, id, T);
}
const empty = W.summarise([], id, T);
out.empty = {reported: empty.reported, noReport: empty.noReport, badge: W.badge(empty).state, days: empty.days.length};
out.b19 = W.badge(mk(19, 19)); out.b20_18 = W.badge(mk(20, 18)); out.b20_17 = W.badge(mk(20, 17)); out.b30_30 = W.badge(mk(30, 30));
// reports for another ward or outside the window are not counted
const other = W.summarise([{ward: 'X~Y~Z', date: T, status: 'collected'}, {ward: id, date: '2025-01-01', status: 'collected'}], id, T);
out.other = other.reported;
out.csv = W.toCSV(r2.list, id).split('\n');
// QR: a long ward URL still fits, and the SVG has real content
const url = 'https://example.org/web/app/index.html#/ward/' + encodeURIComponent(id);
const q = Q(0, 'M'); q.addData(url); q.make();
out.qr = {modules: q.getModuleCount(), svg: q.createSvgTag({cellSize: 6, margin: 4, scalable: true}).slice(0, 4), dark: (() => { let n = 0; for (let r = 0; r < q.getModuleCount(); r++) for (let c = 0; c < q.getModuleCount(); c++) if (q.isDark(r, c)) n++; return n; })()};
const KS = JSON.parse(require('fs').readFileSync('web/trust/data.js', 'utf8').slice('window.KS = '.length).replace(/;\s*$/, ''));
out.official = W.officialFor(KS, 'Maharashtra'); out.officialNone = W.officialFor(KS, 'Nowhere');
console.log(JSON.stringify(out));
"""


@pytest.fixture(scope="module")
def r():
    p = subprocess.run(["node", "-e", JS], capture_output=True, text=True, cwd=os.path.join(os.path.dirname(__file__), ".."), timeout=60)
    assert p.returncode == 0, p.stderr
    return json.loads(p.stdout)


def test_ward_id_round_trip_and_cleaning(r):
    assert r["id"] == "Kerala~Kochi~Ward 12"
    assert r["parsed"] == {"state": "Kerala", "city": "Kochi", "ward": "Ward 12", "id": r["id"]}
    assert r["badId"] is None
    assert not any(ch in r["cleaned"] for ch in "/?#%~")        # characters that would break the #/ward/<id> route


def test_taps_are_validated_and_never_invented(r):
    assert "not happened" in r["future"] and "at most" in r["old"] and r["badStatus"] and r["badDate"] and r["noWard"]
    # a later tap for the same day replaces the earlier one (our on-device duplicate rule)
    assert r["replace"] == {"n": 1, "status": "not_collected", "replaced": True, "first": False}
    assert r["month"] == ["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]


def test_empty_ward_says_no_reports_and_is_not_failed(r):
    assert r["empty"] == {"reported": 0, "noReport": 30, "badge": "not_enough", "days": 30}
    assert r["other"] == 0                                       # other wards' taps and old taps are not counted


def test_badge_rules(r):
    assert r["b19"]["state"] == "not_enough" and r["b19"]["need"] == 1       # 19 reported days: not enough, never "failed"
    assert r["b20_18"]["state"] == "green"                                  # exactly 90% on 20 days
    assert r["b20_17"]["state"] == "not_yet" and round(r["b20_17"]["pct"]) == 85
    assert r["b30_30"]["state"] == "green"


def test_csv_export_labels_reports_unverified(r):
    head, row = r["csv"][0], r["csv"][1]
    assert head == "state,city,ward,date,status,saved_at,note"
    assert row.startswith("Kerala,Kochi,Ward 12,2026-11-10,not_collected,") and "unverified" in row


def test_qr_code_is_generated(r):
    assert r["qr"]["svg"] == "<svg" and r["qr"]["modules"] >= 29 and r["qr"]["dark"] > 300


def test_official_figure_is_read_from_data(r):
    w = pd.read_csv("data/waste_clean.csv")
    m = w[(w.state == "Maharashtra") & (w.year == "2023-24") & (w.source_name == "CPCB")].set_index("metric").value_tpd
    assert r["official"]["state"]["pct"] == round(m["collected"] / m["generated"] * 100, 1)
    assert r["official"]["mohua"]["pct"] == 97 and r["official"]["wards"]["pct"] == 86.2
    assert r["officialNone"]["state"] is None
