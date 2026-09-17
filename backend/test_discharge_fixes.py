"""End-to-end check of every fix, against a real SQLite DB + real routers."""
import os, sys, tempfile
os.environ["DATABASE_URL"] = "sqlite:///" + tempfile.mktemp(suffix=".db")
os.environ["AUTO_SEED"] = "false"
sys.path.insert(0, ".")

from datetime import datetime, timedelta, date
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.hospital import Hospital
from app.models.agent import Agent
from app.models.patient_case import PatientCase, PatientCaseStatus, DailyOfficerAssignment
from app.core.security import hash_password

c = TestClient(app)
db = SessionLocal()
admin = User(full_name="Admin", phone="9000000001", hashed_password=hash_password("pass123"), role=UserRole.admin)
hosp = Hospital(name="Test Hospital", per_patient_daily_rate=500.0)
db.add_all([admin, hosp]); db.commit()
staff = User(full_name="Nurse Asha", phone="9000000002", hashed_password=hash_password("pass123"),
             role=UserRole.hospital_staff, hospital_id=hosp.id)
ag1 = Agent(full_name="RO Ravi", phone="9111111111")
ag2 = Agent(full_name="RO Meena", phone="9222222222")
db.add_all([staff, ag1, ag2]); db.commit()
A1, A2, HID = ag1.id, ag2.id, hosp.id
db.close()

from app.core import deps
from app.db.session import get_db
app.dependency_overrides[deps.require_admin] = lambda: SessionLocal().query(User).filter(User.role==UserRole.admin).first()
app.dependency_overrides[deps.require_hospital_staff] = lambda: SessionLocal().query(User).filter(User.role==UserRole.hospital_staff).first()

def new_case(name, admission=None, expected=None):
    d = SessionLocal()
    case = PatientCase(hospital_id=HID, patient_name=name, attendant_phone="9333333333",
                       admission_date=admission or date.today(), expected_discharge_date=expected,
                       daily_rate=500.0)
    d.add(case); d.commit(); cid = case.id; d.close()
    return cid

def show(label, r):
    ok = r.status_code < 300
    print(f"{'PASS' if ok else 'FAIL'} [{r.status_code}] {label}" + ("" if ok else f" -> {r.text[:160]}"))
    return r.json() if ok else None

print("\n=== #1 No RO ever assigned: hospital confirmation alone must close the case ===")
cid = new_case("Deadlock Patient")
j = show("hospital confirms discharge (no RO)", c.post(f"/api/hospital-console/patients/{cid}/discharge", json={}))
print("   status =", j["status"], "| officer_confirmation_required =", j["officer_confirmation_required"])
assert j["status"] == "discharged", "STILL DEADLOCKED"
assert j["officer_confirmation_required"] is False

print("\n=== #2 'To' date expired: today's officer must fall back to the assigned RO ===")
cid = new_case("Fallback Patient", admission=date.today() - timedelta(days=8))
past = (date.today() - timedelta(days=8)).isoformat()
past2 = (date.today() - timedelta(days=7)).isoformat()
show("admin assigns RO for 8-7 days ago only", c.post(f"/api/admin/hospital-program/patients/{cid}/assign",
     json={"agent_id": A1, "start_date": past, "end_date": past2}))
j = c.get(f"/api/admin/hospital-program/patients/{cid}").json()
print("   admin board today_officer_name =", j["today_officer_name"], "| fallback =", j["today_officer_is_fallback"])
assert j["today_officer_name"] == "RO Ravi", "STILL SHOWS UNASSIGNED"
h = c.get(f"/api/hospital-console/patients/{cid}").json()
assert h["today_officer_name"] == "RO Ravi"
d = c.get("/api/hospital-console/dashboard").json()
print("   hospital dashboard today_unassigned =", d["today_unassigned"], "(was wrongly >0 before)")
FALLBACK_CID = cid

print("\n=== #3 RO never responds: admin force-close override ===")
cid = new_case("Stuck Patient")
show("assign RO", c.post(f"/api/admin/hospital-program/patients/{cid}/assign", json={"agent_id": A1}))
j = show("hospital confirms", c.post(f"/api/hospital-console/patients/{cid}/discharge", json={}))
print("   status after hospital only =", j["status"], "| waiting_on =", j["discharge_waiting_on"])
assert j["status"] == "pending_discharge"
r = c.post(f"/api/admin/hospital-program/patients/{cid}/force-close-discharge", json={"reason": ""})
print(f"   {'PASS' if r.status_code==422 or r.status_code==400 else 'FAIL'} empty reason rejected [{r.status_code}]")
j = show("admin force-closes with reason", c.post(f"/api/admin/hospital-program/patients/{cid}/force-close-discharge",
     json={"reason": "RO left the job, unreachable for 5 days"}))
print("   status =", j["status"], "| forced by =", j["discharge_force_closed_by_name"], "| reason =", j["discharge_force_close_reason"])
assert j["status"] == "discharged" and j["discharge_force_closed_at"]

print("\n=== #4 Discharge date/time validation ===")
cid = new_case("Validation Patient", admission=date.today() - timedelta(days=10))
c.post(f"/api/admin/hospital-program/patients/{cid}/assign", json={"agent_id": A1})
r = c.post(f"/api/hospital-console/patients/{cid}/discharge",
           json={"discharge_datetime": (datetime.utcnow() - timedelta(days=20)).isoformat() + "Z"})
print(f"   {'PASS' if r.status_code==400 else 'FAIL'} before-admission rejected: {r.json().get('detail','')[:80]}")
r = c.post(f"/api/hospital-console/patients/{cid}/discharge",
           json={"discharge_datetime": (datetime.utcnow() + timedelta(days=2)).isoformat() + "Z"})
print(f"   {'PASS' if r.status_code==400 else 'FAIL'} future date rejected: {r.json().get('detail','')[:80]}")
show("valid time accepted", c.post(f"/api/hospital-console/patients/{cid}/discharge", json={}))
tok = c.get(f"/api/admin/hospital-program/patients/{cid}").json()["officer_discharge_token"]
r = c.post(f"/api/officer/discharge/{tok}",
           json={"discharge_datetime": (datetime.utcnow() - timedelta(days=6)).isoformat() + "Z"})
print(f"   {'PASS' if r.status_code==400 else 'FAIL'} >72h gap between the two sides rejected: {r.json().get('detail','')[:90]}")

print("\n=== #12 (latent) naive vs tz-aware datetime crash ===")
j = show("officer confirms with explicit Z timestamp after hospital used utcnow()",
         c.post(f"/api/officer/discharge/{tok}", json={"discharge_datetime": datetime.utcnow().isoformat() + "Z"}))
print("   status =", j["status"], "(this used to raise TypeError on max())")
assert j["status"] == "discharged"

print("\n=== #5 Who confirmed on the hospital side ===")
j = c.get(f"/api/admin/hospital-program/patients/{cid}").json()
print("   hospital_discharge_by_name =", j["hospital_discharge_by_name"])
assert j["hospital_discharge_by_name"] == "Nurse Asha"

print("\n=== #6 Link expiry + regenerate kills the old link ===")
cid = new_case("Link Patient")
c.post(f"/api/admin/hospital-program/patients/{cid}/assign", json={"agent_id": A1})
old_tok = c.get(f"/api/admin/hospital-program/patients/{cid}").json()["officer_discharge_token"]
show("old link works", c.get(f"/api/officer/discharge/{old_tok}"))
j = show("admin regenerates link", c.post(f"/api/admin/hospital-program/patients/{cid}/discharge-link"))
new_tok = j["officer_discharge_token"]
print("   expires_at =", j["expires_at"])
r = c.get(f"/api/officer/discharge/{old_tok}")
print(f"   {'PASS' if r.status_code==404 else 'FAIL'} leaked/old link now dead [{r.status_code}]")
show("new link works", c.get(f"/api/officer/discharge/{new_tok}"))
d = SessionLocal(); case = d.query(PatientCase).get(cid)
case.officer_discharge_token_expires_at = datetime.utcnow() - timedelta(minutes=1); d.commit(); d.close()
r = c.get(f"/api/officer/discharge/{new_tok}")
print(f"   {'PASS' if r.status_code==404 else 'FAIL'} expired link rejected [{r.status_code}]")

print("\n=== #7 Undo a mis-clicked confirmation (both sides) ===")
cid = new_case("Undo Patient")
c.post(f"/api/admin/hospital-program/patients/{cid}/assign", json={"agent_id": A1})
c.post(f"/api/hospital-console/patients/{cid}/discharge", json={})
j = show("hospital undoes its confirmation", c.delete(f"/api/hospital-console/patients/{cid}/discharge"))
print("   status back to =", j["status"], "| hospital_discharge_at =", j["hospital_discharge_at"])
assert j["status"] == "active" and j["hospital_discharge_at"] is None
tok = c.get(f"/api/admin/hospital-program/patients/{cid}").json()["officer_discharge_token"]
c.post(f"/api/officer/discharge/{tok}", json={})
j = show("officer undoes theirs", c.delete(f"/api/officer/discharge/{tok}"))
print("   status back to =", j["status"])

print("\n=== #8 / #10 Alerts feed (in-app reminders, expected-discharge overdue) ===")
cid = new_case("Overdue Patient", admission=date.today() - timedelta(days=6),
               expected=date.today() - timedelta(days=3))
c.post(f"/api/admin/hospital-program/patients/{cid}/assign", json={"agent_id": A1})
j = c.get(f"/api/admin/hospital-program/patients/{cid}").json()
for a in j["alerts"]:
    print(f"   [{a['severity']}] {a['code']}: {a['message']}")
assert any(a["code"] == "expected_discharge_passed" for a in j["alerts"])
d = SessionLocal(); case = d.query(PatientCase).get(cid)
case.hospital_discharge_at = datetime.utcnow() - timedelta(hours=100)
case.status = PatientCaseStatus.pending_discharge; d.commit(); d.close()
j = c.get(f"/api/admin/hospital-program/patients/{cid}").json()
for a in j["alerts"]:
    print(f"   [{a['severity']}] {a['code']}: {a['message']}")
feed = show("GET /discharge-alerts", c.get("/api/admin/hospital-program/discharge-alerts"))
print(f"   {len(feed)} case(s) need attention, worst first:",
      [(x['patient_name'], x['alerts'][0]['severity']) for x in feed])

print("\n=== #9 completed / no_show are now settable, and no_show un-covers that day ===")
cid = FALLBACK_CID
j = c.get(f"/api/admin/hospital-program/patients/{cid}").json()
aid = j["assignments"][0]["id"]
j = show("mark day completed", c.patch(f"/api/admin/hospital-program/assignments/{aid}", json={"status": "completed"}))
print("   day status now =", j["assignments"][0]["status"])
cid2 = new_case("NoShow Patient")
c.post(f"/api/admin/hospital-program/patients/{cid2}/assign", json={"agent_id": A1})
j = c.get(f"/api/admin/hospital-program/patients/{cid2}").json()
aid2 = [a for a in j["assignments"] if a["date"] == date.today().isoformat()][0]["id"]
j = show("mark today no_show", c.patch(f"/api/admin/hospital-program/assignments/{aid2}", json={"status": "no_show"}))
print("   no_show_days =", j["no_show_days"], "| today_officer fallback =", j["today_officer_is_fallback"])
assert j["no_show_days"] == 1

print("\n=== #11 Re-assign RO while case is pending_discharge ===")
cid = new_case("Reassign Patient")
c.post(f"/api/admin/hospital-program/patients/{cid}/assign", json={"agent_id": A1})
tok_old = c.get(f"/api/admin/hospital-program/patients/{cid}").json()["officer_discharge_token"]
c.post(f"/api/officer/discharge/{tok_old}", json={})
j = c.get(f"/api/admin/hospital-program/patients/{cid}").json()
print("   before: status =", j["status"], "| officer_discharge_at set =", bool(j["officer_discharge_at"]))
j = show("swap to RO Meena mid-discharge", c.post(f"/api/admin/hospital-program/patients/{cid}/assign", json={"agent_id": A2}))
print("   after: officer =", j["assigned_agent_name"], "| status =", j["status"],
      "| old confirmation cleared =", j["officer_discharge_at"] is None)
assert j["assigned_agent_name"] == "RO Meena" and j["officer_discharge_at"] is None and j["status"] == "active"
r = c.get(f"/api/officer/discharge/{tok_old}")
print(f"   {'PASS' if r.status_code==404 else 'FAIL'} outgoing officer's link revoked [{r.status_code}]")

print("\nALL CHECKS DONE")
