"""
End-to-end upload tester for AAIE sample data.
Run from backend/ with the venv active:
    python ../sample_data/test_upload.py
"""
import requests
import json

BASE = "http://localhost:8000"

def section(title):
    print(f"\n{'='*55}")
    print(f"  {title}")
    print('='*55)

def check(label, r, expected=200):
    ok = "✓" if r.status_code == expected else "✗"
    print(f"  {ok} [{r.status_code}] {label}")
    if r.status_code not in (expected, 200, 201, 204):
        try:
            print(f"     Detail: {r.json()}")
        except Exception:
            print(f"     Body: {r.text[:200]}")
    return r.status_code in (expected, 200, 201, 204)

# ── 1. Admin login ────────────────────────────────────────────────
section("1. Admin Login")
r = requests.post(f"{BASE}/auth/login", json={"email": "admin@aaie.edu", "password": "Admin@123"})
check("POST /auth/login", r, 200)
admin_token = r.json().get("access_token", "")
admin_h = {"Authorization": f"Bearer {admin_token}"}

# ── 2. Admin dashboard ────────────────────────────────────────────
section("2. Admin Dashboard")
r = requests.get(f"{BASE}/admin/dashboard", headers=admin_h)
check("GET /admin/dashboard", r)
if r.ok:
    kpis = r.json().get("kpis", {})
    print(f"     students={kpis.get('total_students')}  staff={kpis.get('total_staff')}  depts={kpis.get('total_departments')}")

# ── 3. List departments ───────────────────────────────────────────
section("3. Departments")
r = requests.get(f"{BASE}/admin/departments", headers=admin_h)
check("GET /admin/departments", r)
depts = r.json() if r.ok else []
for d in depts:
    print(f"     [{d['code']}] {d['name']}  students={d['student_count']}  staff={d['staff_count']}")

# ── 4. Bulk upload students ───────────────────────────────────────
section("4. Bulk Upload — Students")
csv_path = r"c:\programming\AAIE\aaie\sample_data\students_upload.csv"
with open(csv_path, "rb") as f:
    r = requests.post(
        f"{BASE}/admin/bulk-upload/students",
        headers=admin_h,
        files={"file": ("students_upload.csv", f, "text/csv")},
    )
check("POST /admin/bulk-upload/students", r, 200)
if r.ok:
    res = r.json()
    print(f"     total={res.get('total')}  created={res.get('created')}  skipped={res.get('skipped')}")
    for e in res.get("errors", [])[:5]:
        print(f"     ERR row {e.get('row')}: {e.get('reason')}")

# ── 5. Staff upload CSV ───────────────────────────────────────────
section("5. Bulk Upload — Staff")
staff_csv = r"c:\programming\AAIE\aaie\sample_data\staff_upload.csv"
with open(staff_csv, "rb") as f:
    r = requests.post(
        f"{BASE}/admin/bulk-upload/staff",
        headers=admin_h,
        files={"file": ("staff_upload.csv", f, "text/csv")},
    )
check("POST /admin/bulk-upload/staff", r, 200)
if r.ok:
    res = r.json()
    print(f"     total={res.get('total')}  created={res.get('created')}  skipped={res.get('skipped')}")
    for e in res.get("errors", [])[:5]:
        print(f"     ERR row {e.get('row')}: {e.get('reason')}")

# ── 6. Staff (CS dept) login ──────────────────────────────────────
section("6. Staff Login (CS dept — staff1@aaie.edu)")
r = requests.post(f"{BASE}/auth/login", json={"email": "staff1@aaie.edu", "password": "Staff@123"})
check("POST /auth/login (staff1)", r, 200)
staff_token = r.json().get("access_token", "")
staff_h = {"Authorization": f"Bearer {staff_token}"}

# ── 7. Staff dashboard ────────────────────────────────────────────
section("7. Staff Dashboard")
r = requests.get(f"{BASE}/staff/dashboard", headers=staff_h)
check("GET /staff/dashboard", r)
if r.ok:
    kpis = r.json().get("kpis", {})
    print(f"     total_students={kpis.get('total_students')}  high_risk={kpis.get('high_risk_count')}  open_interventions={kpis.get('open_interventions')}")

# ── 8. List students ──────────────────────────────────────────────
section("8. Staff — List Students")
r = requests.get(f"{BASE}/staff/students", headers=staff_h)
check("GET /staff/students", r)
if r.ok:
    data = r.json()
    print(f"     total={data.get('total')}  returned={len(data.get('items',[]))}")
    for s in data.get("items", [])[:3]:
        print(f"     [{s.get('student_code')}] {s.get('name')}  risk={s.get('risk_level') or 'no prediction yet'}")

# ── 9. Upload performance (CS) ────────────────────────────────────
section("9. Performance Upload — CS dept")
perf_csv = r"c:\programming\AAIE\aaie\sample_data\performance_upload.csv"
with open(perf_csv, "rb") as f:
    r = requests.post(
        f"{BASE}/staff/students/upload",
        headers=staff_h,
        files={"file": ("performance_upload.csv", f, "text/csv")},
    )
check("POST /staff/students/upload", r, 200)
if r.ok:
    res = r.json()
    print(f"     total={res.get('total')}  created={res.get('created')}  updated={res.get('updated')}  failed={res.get('failed')}")
    for e in res.get("errors", [])[:5]:
        print(f"     ERR row {e.get('row')}: {e.get('reason')}")

# ── 10. Staff (EC dept) ───────────────────────────────────────────
section("10. EC Staff Performance Upload (staff2@aaie.edu)")
r = requests.post(f"{BASE}/auth/login", json={"email": "staff2@aaie.edu", "password": "Staff@123"})
check("POST /auth/login (staff2)", r, 200)
staff2_h = {"Authorization": f"Bearer {r.json().get('access_token','')}"}

perf_ec = r"c:\programming\AAIE\aaie\sample_data\performance_EC.csv"
with open(perf_ec, "rb") as f:
    r = requests.post(
        f"{BASE}/staff/students/upload",
        headers=staff2_h,
        files={"file": ("performance_EC.csv", f, "text/csv")},
    )
check("POST /staff/students/upload (EC)", r, 200)
if r.ok:
    res = r.json()
    print(f"     total={res.get('total')}  created={res.get('created')}  updated={res.get('updated')}  failed={res.get('failed')}")
    for e in res.get("errors", [])[:5]:
        print(f"     ERR row {e.get('row')}: {e.get('reason')}")

# ── 11. Staff (ME dept) ───────────────────────────────────────────
section("11. ME Staff Performance Upload (staff3@aaie.edu)")
r = requests.post(f"{BASE}/auth/login", json={"email": "staff3@aaie.edu", "password": "Staff@123"})
check("POST /auth/login (staff3)", r, 200)
staff3_h = {"Authorization": f"Bearer {r.json().get('access_token','')}"}

perf_me = r"c:\programming\AAIE\aaie\sample_data\performance_ME.csv"
with open(perf_me, "rb") as f:
    r = requests.post(
        f"{BASE}/staff/students/upload",
        headers=staff3_h,
        files={"file": ("performance_ME.csv", f, "text/csv")},
    )
check("POST /staff/students/upload (ME)", r, 200)
if r.ok:
    res = r.json()
    print(f"     total={res.get('total')}  created={res.get('created')}  updated={res.get('updated')}  failed={res.get('failed')}")
    for e in res.get("errors", [])[:5]:
        print(f"     ERR row {e.get('row')}: {e.get('reason')}")

# ── 12. Admin — batch predict all students ────────────────────────
section("12. Admin — Batch Predict All Students")
r = requests.get(f"{BASE}/admin/users?role=student&size=100", headers=admin_h)
# Get all student IDs
r2 = requests.get(f"{BASE}/staff/students?size=100", headers=staff_h)
student_ids = [s["id"] for s in r2.json().get("items", [])] if r2.ok else []

if student_ids:
    r = requests.post(f"{BASE}/ml/predict/batch", headers=admin_h, json={"student_ids": student_ids})
    check("POST /ml/predict/batch", r, 200)
    if r.ok:
        res = r.json()
        print(f"     job_id={res.get('job_id')}  count={res.get('count')}  status={res.get('status')}")
else:
    print("  ! No student IDs to predict (no students in staff1's CS dept yet?)")

# ── 13. Final state ───────────────────────────────────────────────
section("13. Final Admin Dashboard")
import time; time.sleep(2)  # wait for background predictions
r = requests.get(f"{BASE}/admin/dashboard", headers=admin_h)
check("GET /admin/dashboard", r)
if r.ok:
    data = r.json()
    kpis = data.get("kpis", {})
    risk = data.get("risk_distribution", {})
    print(f"     students={kpis.get('total_students')}  high_risk={kpis.get('high_risk_count')}  avg_gpa={kpis.get('avg_gpa')}")
    print(f"     risk: Low={risk.get('Low',0)}  Medium={risk.get('Medium',0)}  High={risk.get('High',0)}")

section("DONE")
