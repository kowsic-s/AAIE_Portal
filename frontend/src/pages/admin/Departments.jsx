import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  listDepartments, createDepartment, updateDepartment,
  deleteDepartment, assignMentor, listUsers,
} from '../../api/admin'
import { toast } from '../../store/toastStore'

const defaultForm = { code: '', name: '', description: '' }

const deptColors = [
  { bg: 'rgba(79,142,247,0.12)', bc: 'rgba(79,142,247,0.25)', c: 'var(--accent)' },
  { bg: 'rgba(124,106,247,0.12)', bc: 'rgba(124,106,247,0.25)', c: 'var(--accent-2)' },
  { bg: 'rgba(52,211,153,0.12)', bc: 'rgba(52,211,153,0.25)', c: 'var(--risk-low)' },
  { bg: 'rgba(251,191,36,0.12)', bc: 'rgba(251,191,36,0.25)', c: 'var(--risk-med)' },
  { bg: 'rgba(34,211,238,0.12)', bc: 'rgba(34,211,238,0.25)', c: 'var(--accent-3)' },
]

const AdminDepartments = () => {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [showMentorModal, setShowMentorModal] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [mentorDept, setMentorDept] = useState(null)
  const [selectedMentor, setSelectedMentor] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [formError, setFormError] = useState('')

  const { data, isLoading } = useQuery({ queryKey: ['admin-departments'], queryFn: listDepartments, staleTime: 60 * 1000 })
  const { data: staffData } = useQuery({ queryKey: ['admin-users', 'staff'], queryFn: () => listUsers({ role: 'staff', page: 1, size: 100 }) })

  const depts = Array.isArray(data?.data) ? data.data : (data?.data?.departments ?? [])
  const staffList = staffData?.data?.items ?? []

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-departments'] })

  const createMut = useMutation({ mutationFn: createDepartment, onSuccess: () => { invalidate(); closeModal(); toast.success('Department created') } })
  const updateMut = useMutation({ mutationFn: ({ id, payload }) => updateDepartment(id, payload), onSuccess: () => { invalidate(); closeModal(); toast.success('Department updated') } })
  const deleteMut = useMutation({ mutationFn: deleteDepartment, onSuccess: () => { invalidate(); toast.success('Department deleted') } })
  const mentorMut = useMutation({ mutationFn: ({ deptId, staffId }) => assignMentor(deptId, { staff_id: Number(staffId), student_ids: [] }), onSuccess: () => { invalidate(); setShowMentorModal(false); toast.success('Mentor assigned') } })

  const openCreate = () => { setEditingDept(null); setForm(defaultForm); setFormError(''); setShowModal(true) }
  const openEdit = (d) => { setEditingDept(d); setForm({ code: d.code, name: d.name, description: d.description ?? '' }); setFormError(''); setShowModal(true) }
  const openMentor = (d) => { setMentorDept(d); setSelectedMentor(d.mentor_id ?? ''); setShowMentorModal(true) }
  const closeModal = () => { setShowModal(false); setEditingDept(null) }

  const handleSubmit = (e) => {
    e.preventDefault(); setFormError('')
    if (!form.code || !form.name) { setFormError('Code and name are required.'); return }
    editingDept ? updateMut.mutate({ id: editingDept.id, payload: form }) : createMut.mutate(form)
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <span className="text-[0.82rem]" style={{ color: 'var(--text-2)' }}>{depts.length} departments</span>
        <button className="btn-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Department
        </button>
      </div>

      {/* Table */}
      <div className="overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: 'var(--shadow), var(--inset)' }}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Department', 'Code', 'Mentor', 'Students', 'Staff', 'Actions'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-[0.68rem] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-3)', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}><td colSpan={6} className="px-5 py-4"><div className="h-5 rounded animate-pulse" style={{ background: 'var(--surface-2)', width: `${65 + i * 10}%` }} /></td></tr>
                ))
              ) : depts.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-3)' }}>No departments yet.</td></tr>
              ) : (
                depts.map((d, i) => {
                  const dc = deptColors[i % deptColors.length]
                  return (
                    <tr key={d.id} className="transition-colors hover:bg-[var(--surface-2)]">
                      <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[0.7rem] font-display font-bold flex-shrink-0"
                            style={{ background: dc.bg, border: `1px solid ${dc.bc}`, color: dc.c }}>
                            {(d.code || '??').slice(0, 2)}
                          </div>
                          <span className="text-[0.85rem] font-semibold" style={{ color: 'var(--text-1)' }}>{d.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[0.82rem]" style={{ color: 'var(--text-2)', borderBottom: '1px solid var(--border)' }}>{d.code}</td>
                      <td className="px-5 py-3.5 text-[0.82rem]" style={{ color: d.mentor_name ? 'var(--text-2)' : 'var(--text-3)', borderBottom: '1px solid var(--border)' }}>
                        {d.mentor_name || 'Unassigned'}
                      </td>
                      <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                        <span className="font-display text-[0.88rem] font-bold" style={{ color: 'var(--text-1)' }}>{d.student_count ?? 0}</span>
                      </td>
                      <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                        <span className="font-display text-[0.88rem] font-bold" style={{ color: 'var(--text-1)' }}>{d.staff_count ?? 0}</span>
                      </td>
                      <td className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--border)' }}>
                        <div className="flex gap-1">
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                            title="Edit" onClick={() => openEdit(d)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-2)" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.15)' }}
                            title="Assign Mentor" onClick={() => openMentor(d)}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          </button>
                          <button className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
                            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)' }}
                            title="Delete" onClick={() => { if (window.confirm('Delete this department?')) deleteMut.mutate(d.id) }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--risk-high)" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'color-mix(in srgb, var(--bg) 72%, #000 28%)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[440px] overflow-hidden"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.55)' }}>
              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="font-display font-bold text-[0.95rem]" style={{ color: 'var(--text-1)' }}>{editingDept ? 'Edit Department' : 'New Department'}</div>
                <button onClick={closeModal} className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>×</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-5 flex flex-col gap-3.5">
                  {formError && <p className="text-[0.8rem]" style={{ color: 'var(--risk-high)' }}>{formError}</p>}
                  <div>
                    <label className="block text-[0.72rem] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>Code</label>
                    <input className="input-field w-full" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} required />
                  </div>
                  <div>
                    <label className="block text-[0.72rem] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>Name</label>
                    <input className="input-field w-full" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-[0.72rem] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>Description</label>
                    <textarea className="input-field w-full min-h-[80px]" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                  </div>
                </div>
                <div className="flex justify-end gap-2.5 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn-secondary" onClick={closeModal}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={createMut.isPending || updateMut.isPending}>
                    {createMut.isPending || updateMut.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showMentorModal && mentorDept && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'color-mix(in srgb, var(--bg) 72%, #000 28%)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-[440px] overflow-hidden"
              style={{ background: 'var(--bg-2)', border: '1px solid var(--border-2)', borderRadius: 20, boxShadow: '0 24px 64px rgba(0,0,0,0.55)' }}>
              <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="font-display font-bold text-[0.95rem]" style={{ color: 'var(--text-1)' }}>Assign Mentor — {mentorDept.name}</div>
                <button onClick={() => setShowMentorModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>×</button>
              </div>
              <div className="px-6 py-5">
                <label className="block text-[0.72rem] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-3)' }}>Select Staff</label>
                <select className="input-field w-full" value={selectedMentor} onChange={e => setSelectedMentor(e.target.value)}>
                  <option value="">— None —</option>
                  {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2.5 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
                <button className="btn-secondary" onClick={() => setShowMentorModal(false)}>Cancel</button>
                <button className="btn-primary" disabled={mentorMut.isPending}
                  onClick={() => mentorMut.mutate({ deptId: mentorDept.id, staffId: selectedMentor || null })}>
                  {mentorMut.isPending ? 'Saving...' : 'Assign'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AdminDepartments
