const nowIso = () => new Date().toISOString()

const DEMO_CREDENTIALS = {
  "admin@aaie.edu": "Admin@123",
  "staff1@aaie.edu": "Staff@123",
  "staff2@aaie.edu": "Staff@123",
  "student1@aaie.edu": "Student@123",
  "student2@aaie.edu": "Student@123",
}

const settings = {
  medium_risk_threshold: 0.45,
  high_risk_threshold: 0.72,
  placement_gpa_floor: 7.0,
  placement_attendance_floor: 75,
  placement_reward_floor: 60,
  placement_activity_floor: 45,
  attendance_weight: 0.35,
  gpa_weight: 0.4,
  reward_weight: 0.15,
  activity_weight: 0.1,
}

const departments = [
  { id: 1, code: "CS", name: "Computer Science", description: "Core computing", mentor_id: 2, mentor_name: "Dr. Raj Kumar", student_count: 2, staff_count: 2 },
  { id: 2, code: "EC", name: "Electronics", description: "Electronics and communication", mentor_id: 3, mentor_name: "Dr. Preet Kaur", student_count: 2, staff_count: 1 },
  { id: 3, code: "ME", name: "Mechanical", description: "Mechanical engineering", mentor_id: null, mentor_name: null, student_count: 1, staff_count: 1 },
]

const users = [
  { id: 1, name: "System Admin", email: "admin@aaie.edu", role: "admin", is_active: true, department_name: "Administration", created_at: "2026-01-05T09:00:00Z" },
  { id: 2, name: "Dr. Raj Kumar", email: "staff1@aaie.edu", role: "staff", is_active: true, department_id: 1, department_name: "Computer Science", created_at: "2026-01-08T10:00:00Z" },
  { id: 3, name: "Dr. Preet Kaur", email: "staff2@aaie.edu", role: "staff", is_active: true, department_id: 2, department_name: "Electronics", created_at: "2026-01-08T10:10:00Z" },
  { id: 101, name: "Aarav Sharma", email: "student1@aaie.edu", role: "student", is_active: true, department_id: 1, department_name: "Computer Science", created_at: "2026-01-12T11:00:00Z" },
  { id: 102, name: "Priya Singh", email: "student2@aaie.edu", role: "student", is_active: true, department_id: 2, department_name: "Electronics", created_at: "2026-01-12T11:05:00Z" },
  { id: 103, name: "Rohit Verma", email: "rohit@aaie.edu", role: "student", is_active: true, department_id: 1, department_name: "Computer Science", created_at: "2026-01-12T11:10:00Z" },
  { id: 104, name: "Nisha Kapoor", email: "nisha@aaie.edu", role: "student", is_active: true, department_id: 3, department_name: "Mechanical", created_at: "2026-01-12T11:20:00Z" },
  { id: 105, name: "Sanjay Mishra", email: "sanjay@aaie.edu", role: "student", is_active: true, department_id: 2, department_name: "Electronics", created_at: "2026-01-12T11:30:00Z" },
]

const studentMetrics = {
  101: { student_code: "CS2023001", department: "Computer Science", department_name: "Computer Science", gpa: 8.6, attendance_pct: 93.2, reward_points: 118, activity_points: 91, risk_level: "Low", confidence: 0.84 },
  102: { student_code: "EC2023002", department: "Electronics", department_name: "Electronics", gpa: 7.1, attendance_pct: 79.4, reward_points: 62, activity_points: 53, risk_level: "Medium", confidence: 0.73 },
  103: { student_code: "CS2023008", department: "Computer Science", department_name: "Computer Science", gpa: 4.1, attendance_pct: 58.6, reward_points: 19, activity_points: 13, risk_level: "High", confidence: 0.88 },
  104: { student_code: "ME2023004", department: "Mechanical", department_name: "Mechanical", gpa: 6.0, attendance_pct: 72.1, reward_points: 46, activity_points: 34, risk_level: "Medium", confidence: 0.69 },
  105: { student_code: "EC2023006", department: "Electronics", department_name: "Electronics", gpa: 3.8, attendance_pct: 62.2, reward_points: 20, activity_points: 16, risk_level: "High", confidence: 0.81 },
}

const performanceHistory = {
  101: [
    { semester: "2024-ODD", gpa: 8.1, attendance_pct: 90.2, reward_points: 100, activity_points: 80, recorded_at: "2025-06-01T10:00:00Z" },
    { semester: "2024-EVEN", gpa: 8.4, attendance_pct: 92.1, reward_points: 110, activity_points: 86, recorded_at: "2025-12-01T10:00:00Z" },
    { semester: "2025-ODD", gpa: 8.6, attendance_pct: 93.2, reward_points: 118, activity_points: 91, recorded_at: "2026-03-01T10:00:00Z" },
  ],
  102: [
    { semester: "2024-ODD", gpa: 6.4, attendance_pct: 74.0, reward_points: 43, activity_points: 33, recorded_at: "2025-06-01T10:00:00Z" },
    { semester: "2024-EVEN", gpa: 6.8, attendance_pct: 76.5, reward_points: 52, activity_points: 41, recorded_at: "2025-12-01T10:00:00Z" },
    { semester: "2025-ODD", gpa: 7.1, attendance_pct: 79.4, reward_points: 62, activity_points: 53, recorded_at: "2026-03-01T10:00:00Z" },
  ],
  103: [
    { semester: "2024-ODD", gpa: 5.1, attendance_pct: 67.1, reward_points: 28, activity_points: 22, recorded_at: "2025-06-01T10:00:00Z" },
    { semester: "2024-EVEN", gpa: 4.5, attendance_pct: 62.4, reward_points: 24, activity_points: 18, recorded_at: "2025-12-01T10:00:00Z" },
    { semester: "2025-ODD", gpa: 4.1, attendance_pct: 58.6, reward_points: 19, activity_points: 13, recorded_at: "2026-03-01T10:00:00Z" },
  ],
  104: [
    { semester: "2024-ODD", gpa: 5.7, attendance_pct: 69.5, reward_points: 35, activity_points: 26, recorded_at: "2025-06-01T10:00:00Z" },
    { semester: "2024-EVEN", gpa: 5.9, attendance_pct: 71.0, reward_points: 40, activity_points: 30, recorded_at: "2025-12-01T10:00:00Z" },
    { semester: "2025-ODD", gpa: 6.0, attendance_pct: 72.1, reward_points: 46, activity_points: 34, recorded_at: "2026-03-01T10:00:00Z" },
  ],
  105: [
    { semester: "2024-ODD", gpa: 4.4, attendance_pct: 66.0, reward_points: 27, activity_points: 20, recorded_at: "2025-06-01T10:00:00Z" },
    { semester: "2024-EVEN", gpa: 4.1, attendance_pct: 63.8, reward_points: 23, activity_points: 18, recorded_at: "2025-12-01T10:00:00Z" },
    { semester: "2025-ODD", gpa: 3.8, attendance_pct: 62.2, reward_points: 20, activity_points: 16, recorded_at: "2026-03-01T10:00:00Z" },
  ],
}

let interventions = [
  { id: 1, student_id: 103, student_name: "Rohit Verma", type: "academic_support", description: "Weekly tutoring for core subjects.", status: "open", created_at: "2026-03-05T08:00:00Z", closed_at: null, scheduled_date: "2026-04-10" },
  { id: 2, student_id: 105, student_name: "Sanjay Mishra", type: "counselling", description: "Attendance and motivation counselling.", status: "in_progress", created_at: "2026-03-08T08:00:00Z", closed_at: null, scheduled_date: "2026-04-12" },
  { id: 3, student_id: 102, student_name: "Priya Singh", type: "peer_mentoring", description: "Assigned peer mentor for revision planning.", status: "closed", created_at: "2026-02-20T08:00:00Z", closed_at: "2026-03-30T09:30:00Z", scheduled_date: "2026-03-01" },
]

let recommendationsByStudent = {
  101: [{ id: 5001, content: "Maintain your current consistency. Aim GPA > 8.7 and attendance above 94%.", generated_at: "2026-03-30T09:00:00Z" }],
  102: [{ id: 5002, content: "Improve attendance by 5%. Use two focused study blocks each day to push GPA to 7.4+.", generated_at: "2026-03-30T09:05:00Z" }],
  103: [{ id: 5003, content: "Urgent plan: attend remedial sessions, submit weekly progress logs, and target attendance above 70% in 6 weeks.", generated_at: "2026-03-30T09:10:00Z" }],
  104: [{ id: 5004, content: "Stabilize risk by adding one extra lab prep session weekly and reducing missed classes.", generated_at: "2026-03-30T09:12:00Z" }],
  105: [{ id: 5005, content: "Focus on attendance recovery and structured revision timetable. Seek mentor feedback every week.", generated_at: "2026-03-30T09:15:00Z" }],
}

let modelVersions = [
  {
    version_id: "v2026.03.20",
    model_type: "RandomForest",
    accuracy: 0.89,
    macro_recall: 0.86,
    trained_at: "2026-03-20T06:00:00Z",
    is_active: true,
    feature_importances: { attendance_pct: 0.36, gpa: 0.34, reward_points: 0.18, activity_points: 0.12 },
  },
  {
    version_id: "v2026.02.08",
    model_type: "DecisionTree",
    accuracy: 0.82,
    macro_recall: 0.79,
    trained_at: "2026-02-08T06:00:00Z",
    is_active: false,
    feature_importances: { attendance_pct: 0.41, gpa: 0.31, reward_points: 0.15, activity_points: 0.13 },
  },
]

const tokenToUser = new Map()

const parseBody = (raw) => {
  if (!raw) return {}
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw)
    } catch {
      return {}
    }
  }
  return raw
}

const getAuthHeader = (config) => {
  const h = config?.headers || {}
  if (typeof h.get === "function") {
    return h.get("Authorization") || h.get("authorization")
  }
  return h.Authorization || h.authorization
}

const getCurrentUser = (config) => {
  const auth = getAuthHeader(config)
  if (!auth || !auth.startsWith("Bearer ")) return users.find((u) => u.role === "student")
  const token = auth.slice("Bearer ".length)
  return tokenToUser.get(token) || users.find((u) => u.role === "student")
}

const ok = (config, data, status = 200) => ({
  data,
  status,
  statusText: "OK",
  headers: {},
  config,
})

const fail = (config, status, detail) => {
  const error = new Error(detail)
  error.response = {
    data: { detail },
    status,
    statusText: "Error",
    headers: {},
    config,
  }
  error.config = config
  throw error
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getStudentsForStaffTable = () =>
  users
    .filter((u) => u.role === "student")
    .map((u) => {
      const m = studentMetrics[u.id]
      const studentInterventions = interventions.filter((iv) => iv.student_id === u.id)
      const latest = studentInterventions[0]
      return {
        id: u.id,
        name: u.name,
        student_code: m.student_code,
        department_name: m.department_name,
        gpa: m.gpa,
        attendance_pct: m.attendance_pct,
        risk_level: m.risk_level,
        confidence: m.confidence,
        reward_points: m.reward_points,
        activity_points: m.activity_points,
        open_interventions: studentInterventions.filter((iv) => iv.status !== "closed").length,
        latest_intervention_status: latest?.status || null,
        latest_intervention_type: latest?.type || null,
        placement_eligible:
          m.gpa >= settings.placement_gpa_floor &&
          m.attendance_pct >= settings.placement_attendance_floor &&
          m.reward_points >= settings.placement_reward_floor &&
          m.activity_points >= settings.placement_activity_floor,
      }
    })

const buildStudentDetail = (studentId) => {
  const user = users.find((u) => u.id === Number(studentId) && u.role === "student")
  if (!user) return null
  const m = studentMetrics[user.id]
  const perf = performanceHistory[user.id] || []
  const latestPerf = perf[perf.length - 1] || {}
  const studentInterventions = interventions.filter((iv) => iv.student_id === user.id)
  return {
    id: user.id,
    name: user.name,
    student_code: m.student_code,
    department_name: m.department_name,
    latest_performance: latestPerf,
    performance_history: perf,
    latest_prediction: {
      risk_level: m.risk_level,
      confidence: m.confidence,
      explanation: "Risk is driven mostly by attendance trend and GPA trajectory.",
      top_factors: [
        { feature: "attendance_pct", importance: 0.36 },
        { feature: "gpa", importance: 0.34 },
        { feature: "reward_points", importance: 0.18 },
      ],
    },
    interventions: studentInterventions,
  }
}

const createRecommendation = (studentId) => {
  const student = users.find((u) => u.id === Number(studentId) && u.role === "student")
  const m = studentMetrics[student?.id]
  const risk = m?.risk_level || "Medium"
  const text =
    risk === "High"
      ? "Priority plan: improve attendance by 10%, complete two remedial sessions weekly, and report progress each Friday."
      : risk === "Medium"
        ? "Stabilization plan: maintain attendance above 82%, increase weekly revision hours, and seek mentor feedback."
        : "Growth plan: keep consistency, target GPA uplift by 0.2, and maintain strong co-curricular activity."

  const rec = { id: Date.now(), content: text, generated_at: nowIso() }
  recommendationsByStudent[studentId] = [rec, ...(recommendationsByStudent[studentId] || [])]
  return rec
}

const getRiskDistribution = () => {
  const dist = { Low: 0, Medium: 0, High: 0 }
  Object.values(studentMetrics).forEach((m) => {
    dist[m.risk_level] += 1
  })
  return dist
}

const handleAuth = (config, method, path, body) => {
  if (method === "post" && path === "/auth/login") {
    const email = String(body.email || "").toLowerCase()
    const password = String(body.password || "")
    const user = users.find((u) => u.email.toLowerCase() === email)
    if (!user || DEMO_CREDENTIALS[email] !== password) {
      return fail(config, 401, "Invalid demo credentials")
    }
    const access_token = `mock-token-${user.id}-${Date.now()}`
    const refresh_token = `mock-refresh-${user.id}-${Date.now()}`
    tokenToUser.set(access_token, user)
    return ok(config, { access_token, refresh_token, user })
  }
  if (method === "post" && path === "/auth/refresh") {
    const current = users.find((u) => u.role === "admin")
    const access_token = `mock-token-${current.id}-${Date.now()}`
    tokenToUser.set(access_token, current)
    return ok(config, { access_token })
  }
  if (method === "post" && path === "/auth/logout") {
    return ok(config, { message: "Logged out" })
  }
  return null
}

const handleAdmin = (config, method, path, body, params) => {
  if (method === "get" && path === "/admin/dashboard") {
    const students = getStudentsForStaffTable()
    const highRisk = students
      .filter((s) => s.risk_level === "High")
      .map((s) => ({
        name: s.name,
        student_code: s.student_code,
        department: s.department_name,
        gpa: s.gpa,
        attendance_pct: s.attendance_pct,
        risk_level: s.risk_level,
        confidence: s.confidence,
      }))

    return ok(config, {
      kpis: {
        total_students: students.length,
        high_risk_count: students.filter((s) => s.risk_level === "High").length,
        total_staff: users.filter((u) => u.role === "staff" && u.is_active).length,
      },
      risk_distribution: getRiskDistribution(),
      top_risk_students: highRisk,
      recent_audit_logs: [
        { id: 1, action: "user_login", actor_name: "System Admin", created_at: "2026-04-01T07:00:00Z", summary: "Admin signed in" },
        { id: 2, action: "model_promoted", actor_name: "System Admin", created_at: "2026-03-31T16:00:00Z", summary: "Promoted model v2026.03.20" },
      ],
    })
  }

  if (path === "/admin/users") {
    if (method === "get") {
      const role = params?.role
      const items = role ? users.filter((u) => u.role === role) : [...users]
      return ok(config, { items, total: items.length })
    }
    if (method === "post") {
      const id = Math.max(...users.map((u) => u.id)) + 1
      const dept = departments.find((d) => d.id === Number(body.department_id))
      const newUser = {
        id,
        name: body.name,
        email: body.email,
        role: body.role || "student",
        is_active: true,
        department_id: body.department_id ? Number(body.department_id) : undefined,
        department_name: dept?.name || (body.role === "admin" ? "Administration" : "General"),
        created_at: nowIso(),
      }
      users.push(newUser)
      return ok(config, newUser, 201)
    }
  }

  const userIdMatch = path.match(/^\/admin\/users\/(\d+)(?:\/(block|reset-password|set-password))?$/)
  if (userIdMatch) {
    const userId = Number(userIdMatch[1])
    const action = userIdMatch[2]
    const target = users.find((u) => u.id === userId)
    if (!target) return fail(config, 404, "User not found")

    if (method === "put" && !action) {
      Object.assign(target, body)
      if (body.department_id) {
        const dept = departments.find((d) => d.id === Number(body.department_id))
        target.department_name = dept?.name || target.department_name
      }
      return ok(config, target)
    }
    if (method === "delete" && !action) {
      if (target.role === "admin") return fail(config, 400, "Cannot delete admin in demo")
      const idx = users.findIndex((u) => u.id === userId)
      users.splice(idx, 1)
      return ok(config, { deleted: true })
    }
    if (method === "post" && action === "block") {
      target.is_active = !target.is_active
      return ok(config, { is_active: target.is_active })
    }
    if (method === "post" && (action === "reset-password" || action === "set-password")) {
      return ok(config, { message: "Password updated in demo" })
    }
  }

  if (path === "/admin/departments") {
    if (method === "get") return ok(config, departments)
    if (method === "post") {
      const id = Math.max(...departments.map((d) => d.id)) + 1
      const dept = { id, code: String(body.code || "").toUpperCase(), name: body.name, description: body.description || "", mentor_id: null, mentor_name: null, student_count: 0, staff_count: 0 }
      departments.push(dept)
      return ok(config, dept, 201)
    }
  }

  const deptMatch = path.match(/^\/admin\/departments\/(\d+)(?:\/(assign-mentor))?$/)
  if (deptMatch) {
    const deptId = Number(deptMatch[1])
    const action = deptMatch[2]
    const dept = departments.find((d) => d.id === deptId)
    if (!dept) return fail(config, 404, "Department not found")

    if (method === "put" && !action) {
      Object.assign(dept, { code: String(body.code || dept.code).toUpperCase(), name: body.name ?? dept.name, description: body.description ?? dept.description })
      return ok(config, dept)
    }
    if (method === "delete" && !action) {
      const idx = departments.findIndex((d) => d.id === deptId)
      departments.splice(idx, 1)
      return ok(config, { deleted: true })
    }
    if (method === "post" && action === "assign-mentor") {
      const mentor = users.find((u) => u.id === Number(body.staff_id))
      dept.mentor_id = mentor?.id || null
      dept.mentor_name = mentor?.name || null
      return ok(config, dept)
    }
  }

  if (method === "get" && path === "/admin/settings") return ok(config, settings)
  if (method === "put" && path === "/admin/settings") {
    Object.assign(settings, body)
    return ok(config, settings)
  }
  if (method === "post" && path === "/admin/settings/recalculate") return ok(config, { message: "Risk recalculated using demo data" })

  if (method === "post" && (path === "/admin/bulk-upload/students" || path === "/admin/bulk-upload/staff")) {
    return ok(config, { total: 12, created: 9, skipped: 2, failed: 1, errors: [{ row: 7, reason: "Duplicate email" }] })
  }

  if (method === "get" && path === "/admin/model/versions") return ok(config, { versions: modelVersions })

  const promoteMatch = path.match(/^\/admin\/model\/promote\/(.+)$/)
  if (method === "post" && promoteMatch) {
    const versionId = decodeURIComponent(promoteMatch[1])
    modelVersions = modelVersions.map((m) => ({ ...m, is_active: m.version_id === versionId }))
    return ok(config, { message: `Model ${versionId} promoted` })
  }

  if (method === "get" && path === "/admin/audit-logs") {
    return ok(config, {
      items: [
        { id: 1001, action: "user_login", actor_name: "System Admin", created_at: nowIso() },
        { id: 1002, action: "user_update", actor_name: "System Admin", created_at: nowIso() },
      ],
      total: 2,
    })
  }

  return null
}

const handleStaff = (config, method, path, body, params) => {
  if (method === "get" && path === "/staff/dashboard") {
    const students = getStudentsForStaffTable()
    return ok(config, {
      kpis: {
        total_students: students.length,
        high_risk_count: students.filter((s) => s.risk_level === "High").length,
        open_interventions: interventions.filter((i) => i.status !== "closed").length,
        closed_this_month: interventions.filter((i) => i.status === "closed").length,
      },
      risk_distribution: getRiskDistribution(),
      recent_risk_changes: [
        { student_id: 103, name: "Rohit Verma", from_risk: "Medium", to_risk: "High", changed_at: "2026-03-29T10:00:00Z" },
        { student_id: 102, name: "Priya Singh", from_risk: "High", to_risk: "Medium", changed_at: "2026-03-28T12:30:00Z" },
      ],
    })
  }

  if (method === "get" && path === "/staff/students") {
    let items = getStudentsForStaffTable()
    if (params?.risk_level) items = items.filter((s) => s.risk_level === params.risk_level)
    return ok(config, { items, total: items.length })
  }

  const studentDetailMatch = path.match(/^\/staff\/students\/(\d+)$/)
  if (method === "get" && studentDetailMatch) {
    const detail = buildStudentDetail(studentDetailMatch[1])
    if (!detail) return fail(config, 404, "Student not found")
    return ok(config, detail)
  }

  const recMatch = path.match(/^\/staff\/students\/(\d+)\/recommendations(?:\/generate)?$/)
  if (recMatch) {
    const studentId = Number(recMatch[1])
    if (method === "get") return ok(config, { recommendations: recommendationsByStudent[studentId] || [] })
    if (method === "post") {
      createRecommendation(studentId)
      return ok(config, { message: "Recommendation generated" })
    }
  }

  if (method === "get" && path === "/staff/interventions") {
    let items = [...interventions]
    if (params?.status) items = items.filter((i) => i.status === params.status)
    return ok(config, { items, total: items.length })
  }

  if (method === "post" && path === "/staff/interventions") {
    const studentId = Number(body.student_id)
    const student = users.find((u) => u.id === studentId)
    const iv = {
      id: Date.now(),
      student_id: studentId,
      student_name: student?.name || "Unknown",
      type: body.type,
      description: body.description,
      status: "open",
      created_at: nowIso(),
      closed_at: null,
      scheduled_date: null,
    }
    interventions = [iv, ...interventions]
    return ok(config, iv, 201)
  }

  const interventionMatch = path.match(/^\/staff\/interventions\/(\d+)$/)
  if (method === "put" && interventionMatch) {
    const id = Number(interventionMatch[1])
    const iv = interventions.find((x) => x.id === id)
    if (!iv) return fail(config, 404, "Intervention not found")
    Object.assign(iv, body)
    if (iv.status === "closed" && !iv.closed_at) iv.closed_at = nowIso()
    return ok(config, iv)
  }

  if (method === "post" && (path === "/staff/students/upload" || path === "/staff/students/bulk-upload" || /\/staff\/students\/\d+\/upload$/.test(path))) {
    return ok(config, { total: 20, created: 18, updated: 1, failed: 1, errors: [{ row: 11, reason: "Unknown student code" }] })
  }

  return null
}

const handleStudent = (config, method, path, body) => {
  const currentUser = getCurrentUser(config)
  const studentId = currentUser?.role === "student" ? currentUser.id : 101
  const detail = buildStudentDetail(studentId)

  if (method === "get" && path === "/student/dashboard") {
    return ok(config, {
      latest_prediction: detail.latest_prediction,
      latest_performance: detail.latest_performance,
      quick_links: 4,
    })
  }

  if (method === "get" && path === "/student/performance") {
    return ok(config, { performance_history: performanceHistory[studentId] || [] })
  }

  if (method === "post" && path === "/student/what-if") {
    const attendance = Number(body.attendance_pct || 0)
    const gpa = Number(body.gpa || 0)
    const reward = Number(body.reward_points || 0)
    const activity = Number(body.activity_points || 0)
    const score = attendance * 0.35 + gpa * 10 * 0.4 + reward * 0.15 + activity * 0.1
    const projected_risk = score >= 70 ? "Low" : score >= 52 ? "Medium" : "High"
    return ok(config, {
      current_risk: detail.latest_prediction.risk_level,
      projected_risk,
      projected_confidence: Math.min(0.95, Math.max(0.55, score / 100)),
      probability_breakdown: {
        Low: projected_risk === "Low" ? 0.72 : 0.18,
        Medium: projected_risk === "Medium" ? 0.64 : 0.2,
        High: projected_risk === "High" ? 0.7 : 0.12,
      },
      explanation: "Attendance and GPA shifts have the largest impact in this simulation.",
    })
  }

  if (method === "get" && path === "/student/recommendations") {
    return ok(config, { recommendations: recommendationsByStudent[studentId] || [] })
  }

  if (method === "post" && path === "/student/recommendations/generate") {
    createRecommendation(studentId)
    return ok(config, { message: "Recommendation generated" })
  }

  if (method === "get" && path === "/student/interventions") {
    return ok(config, { interventions: interventions.filter((iv) => iv.student_id === studentId) })
  }

  return null
}

const handleMl = (config, method, path, body) => {
  if (method === "post" && path === "/ml/train") {
    const newVersion = {
      version_id: `v${new Date().toISOString().slice(0, 10).replace(/-/g, ".")}`,
      model_type: "RandomForest",
      accuracy: 0.9,
      macro_recall: 0.87,
      trained_at: nowIso(),
      is_active: true,
      feature_importances: { attendance_pct: 0.35, gpa: 0.35, reward_points: 0.17, activity_points: 0.13 },
    }
    modelVersions = [newVersion, ...modelVersions.map((m) => ({ ...m, is_active: false }))]
    return ok(config, { message: "Demo training completed", version_id: newVersion.version_id })
  }

  if (method === "post" && (path === "/ml/predict" || path === "/ml/predict/simulate")) {
    return ok(config, {
      risk_level: "Medium",
      confidence: 0.78,
      explanation: "Predicted from attendance and GPA trend.",
      input: body,
    })
  }

  if (method === "get" && path === "/ml/model/info") {
    const active = modelVersions.find((m) => m.is_active)
    return ok(config, { active_version: active?.version_id || null, ready: true })
  }

  if (method === "get" && path === "/ml/health") return ok(config, { status: "ok", ready: true })
  if (method === "get" && (path === "/ml/versions" || path === "/admin/model/versions")) return ok(config, { versions: modelVersions })

  return null
}

export const mockAdapter = async (config) => {
  await delay(150)

  const method = String(config.method || "get").toLowerCase()
  const path = new URL(config.url, "http://mock.local").pathname
  const body = parseBody(config.data)
  const params = config.params || {}

  const handlers = [handleAuth, handleAdmin, handleStaff, handleStudent, handleMl]
  for (const handler of handlers) {
    const result = handler(config, method, path, body, params)
    if (result) return result
  }

  return ok(config, { message: `Mock endpoint not implemented: ${method.toUpperCase()} ${path}` }, 200)
}

export const DEMO_ACCOUNTS = [
  { role: "Admin Portal", email: "admin@aaie.edu", password: "Admin@123" },
  { role: "Staff Portal", email: "staff1@aaie.edu", password: "Staff@123" },
  { role: "Student Portal", email: "student1@aaie.edu", password: "Student@123" },
]
