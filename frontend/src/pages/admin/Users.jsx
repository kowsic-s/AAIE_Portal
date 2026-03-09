import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  listUsers, createUser, updateUser, toggleUserActive,
  resetUserPassword, deleteUser,
} from '../../api/admin'
import { formatDate } from '../../utils/formatters'
import { toast } from '../../store/toastStore'

const ROLES = ['admin', 'staff', 'student']
const TABS = [
  { key: '', label: 'All Users' },
  { key: 'admin', label: 'Admins' },
  { key: 'staff', label: 'Staff' },
  { key: 'student', label: 'Students' },
]

const roleBadge = (role) => {
  const m = {
    admin: { bg: 'rgba(124,106,247,0.12)', c: 'var(--accent-2)', bc: 'rgba(124,106,247,0.25)' },
    staff: { bg: 'rgba(79,142,247,0.12)', c: 'var(--accent)', bc: 'rgba(79,142,247,0.25)' },
    student: { bg: 'rgba(52,211,153,0.12)', c: 'var(--risk-low)', bc: 'rgba(52,211,153,0.25)' },
  }
  const s = m[role] || m.student
  return (
    <span className="text-[0.67rem] font-bold px-2 py-[3px] rounded-full capitalize"
      style={{ background: s.bg, color: s.c, border: `1px solid ${s.bc}` }}>{role}</span>
  )
}

const statusDot = (active) => (
  <span className="flex items-center gap-1.5">
    <span className="w-[6px] h-[6px] rounded-full" style={{ background: active ? 'var(--risk-low)' : 'var(--risk-high)' }} />
    <span className="text-[0.82rem]" style={{ color: active ? 'var(--risk-low)' : 'var(--risk-high)' }}>{active ? 'Active' : 'Blocked'}</span>
  </span>
)

const defaultForm = { name: '', email: '', password: '', role: 'staff', department_id: '' }

const AdminUsers = () => {
  const qc = useQueryClient()
  const [tab, setTab] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [formError, setFormError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', tab],
    queryFn: () => listUsers({ role: tab || undefined, page: 1, size: 500 }),
    staleTime: 60 * 1000,
  })

  const allUsers = data?.data?.items ?? []
  const total = data?.data?.total ?? 0

  const roleCounts = useMemo(() => {
    const c = { admin: 0, staff: 0, student: 0 }
    allUsers.forEach(u => { if (c[u.role] !== undefined) c[u.role]++ })
    return c
  }, [allUsers])

  const users = useMemo(() => {
    let list = allUsers
    if (statusFilter === 'active') list = list.filter(u => u.is_active)
    else if (statusFilter === 'blocked') list = list.filter(u => !u.is_active)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(u => u.name?.toLowerCase().includes(s) || u.email?.toLowerCase().includes(s))
    }
    return list
  }, [allUsers, statusFilter, search])

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-users'] })

  const createMut = useMutation({ mutationFn: createUser, onSuccess: () => { invalidate(); closeModal(); toast.success('User created') } })
  const updateMut = useMutation({ mutationFn: ({ id, payload }) => updateUser(id, payload), onSuccess: () => { invalidate(); closeModal(); toast.success('User updated') } })
  const toggleMut = useMutation({ mutationFn: toggleUserActive, onSuccess: () => { invalidate(); toast.success('Status updated') } })
  const resetMut = useMutation({ mutationFn: resetUserPassword, onSuccess: () => { invalidate(); toast.success('Password reset') } })
  const deleteMut = useMutation({ mutationFn: deleteUser, onSuccess: () => { invalidate(); toast.success('User deleted') } })

  const openCreate = () => { setEditingUser(null); setForm(defaultForm); setFormError(''); setShowModal(true) }
  const openEdit = (u) => {
    setEditingUser(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role, department_id: u.department_id ?? '' })
    setFormError(''); setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditingUser(null); setFormError('') }

  const handleSubmit = (e) => {
    e.preventDefault(); setFormError('')
    if (!form.name || !form.email || (!editingUser && !form.password)) { setFormError('Required fields missing.'); return }
    if (editingUser) {
      const payload = { name: form.name, department_id: form.department_id || undefined }
      if (editingUser.role !== 'student') payload.role = form.role
      updateMut.mutate({ id: editingUser.id, payload })
    } else {
      createMut.mutate({ ...form, department_id: form.department_id || undefined })
    }
  }

  const initials = (name) => (name || '').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input className="input-field pl-9 w-full" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
        </select>
        <button className="btn-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add User
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        {TABS.map(t => {
          const cnt = t.key ? roleCounts[t.key] ?? 0 : total
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[0.82rem] font-semibold transition-all flex-1 justify-center"
              style={tab === t.key
                ? { background: 'var(--accent)', color: '#fff', boxShadow: '0 0 12px var(--glow-a)' }
                : { color: 'var(--text-3)' }}>
              {t.label}
              <span className="text-[0.65rem] font-bold px-1.5 py-[1px] rounded-full"
                style={{ background: tab === t.key ? 'rgba(255,255,255,0.2)' : 'var(--surface-2)', color: tab === t.key ? '#fff' : 'var(--text-3)' }}>{cnt}</span>
            </button>
          )
        })}
      </div>

      {/* Table card */}
      <div className="overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow), var(--inset)' }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Name', 'Email', 'Role', 'Department', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[0.68rem] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={7} className="px-5 py-4"><div className="h-5 rounded animate-pulse" style={{ background: 'var(--surface-2)', width: `${70 + i * 5}%` }} /></td></tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-3)' }}>No users found.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="transition-colors hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[0.7rem] font-display font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-2))' }}>{initials(u.name)}</div>
                        <span className="text-[0.85rem] font-semibold" style={{ color: 'var(--text-1)' }}>{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[0.82rem]" style={{ color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{u.email}</td>
                    <td className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>{roleBadge(u.role)}</td>
                    <td className="px-5 py-3 text-[0.82rem]" style={{ color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{u.department_name || '—'}</td>
                    <td className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>{statusDot(u.is_active)}</td>
                    <td className="px-5 py-3 text-[0.82rem]" style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>{formatDate(u.created_at)}</td>
                    <td className="px-5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
                      <div className="flex gap-1">
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                          title="Edit" onClick={() => openEdit(u)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                          title={u.is_active ? 'Block' : 'Unblock'} onClick={() => toggleMut.mutate(u.id)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={u.is_active ? 'var(--risk-med)' : 'var(--risk-low)'} strokeWidth="2">
                            {u.is_active ? <><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></> : <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}
                          </svg>
                        </button>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                          title="Reset password" onClick={() => { if (window.confirm('Reset password to Auto@1234?')) resetMut.mutate(u.id) }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--risk-med)" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
                        </button>
                        <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}
                          title="Delete" onClick={() => { if (window.confirm('Delete this user?')) deleteMut.mutate(u.id) }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--risk-high)" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[440px] overflow-hidden"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.55)' }}>
              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="font-display font-bold text-[0.95rem]" style={{ color: 'var(--text-1)' }}>{editingUser ? 'Edit User' : 'Create New User'}</div>
                <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-5 flex flex-col gap-3.5">
                  {formError && <p className="text-[0.8rem]" style={{ color: 'var(--risk-high)' }}>{formError}</p>}
                  <div>
                    <label className="block text-[0.72rem] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>Full Name</label>
                    <input className="input-field w-full" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-[0.72rem] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>Email</label>
                    <input className="input-field w-full" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required disabled={!!editingUser} />
                  </div>
                  {!editingUser && (
                    <div>
                      <label className="block text-[0.72rem] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>Password</label>
                      <input className="input-field w-full" type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
                    </div>
                  )}
                  {!(editingUser && editingUser.role === 'student') && (
                    <div>
                      <label className="block text-[0.72rem] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>Role</label>
                      <select className="input-field w-full" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                        {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2.5 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={createMut.isPending || updateMut.isPending}>
                    {createMut.isPending || updateMut.isPending ? 'Saving...' : editingUser ? 'Update' : 'Create User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminUsers
