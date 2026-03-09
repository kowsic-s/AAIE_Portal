import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  listDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  assignMentor,
} from '../../api/admin'
import { listUsers } from '../../api/admin'
import DataTable from '../../components/DataTable'
import { toast } from '../../store/toastStore'

const COLUMNS = [
  { key: 'code', label: 'Code' },
  { key: 'name', label: 'Name' },
  { key: 'mentor_name', label: 'Mentor' },
  { key: 'student_count', label: 'Students' },
  { key: 'staff_count', label: 'Staff' },
]

const defaultForm = { code: '', name: '', description: '' }

const AdminDepartments = () => {
  const qc = useQueryClient()
  const [showModal, setShowModal] = useState(false)
  const [showMentorModal, setShowMentorModal] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [mentorDept, setMentorDept] = useState(null)
  const [selectedMentor, setSelectedMentor] = useState('')
  const [form, setForm] = useState(defaultForm)
  const [formError, setFormError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: listDepartments,
    staleTime: 60 * 1000,
  })

  const { data: staffData } = useQuery({
    queryKey: ['admin-users', 'staff'],
    queryFn: () => listUsers({ role: 'staff', page: 1, size: 100 }),
  })

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
    e.preventDefault()
    setFormError('')
    if (!form.code || !form.name) { setFormError('Code and name are required.'); return }
    if (editingDept) {
      updateMut.mutate({ id: editingDept.id, payload: form })
    } else {
      createMut.mutate(form)
    }
  }

  const rowActions = (row) => (
    <div className="flex gap-2">
      <button className="btn-sm btn-ghost" onClick={() => openEdit(row)}>Edit</button>
      <button className="btn-sm btn-ghost text-[#3b82f6]" onClick={() => openMentor(row)}>Assign Mentor</button>
      <button className="btn-sm btn-ghost text-[#ef4444]" onClick={() => {
        if (window.confirm('Delete this department?')) deleteMut.mutate(row.id)
      }}>Delete</button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f4ff]">Departments</h1>
          <p className="text-[#94a3b8] mt-1">{depts.length} departments</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ New Department</button>
      </div>

      <div className="card">
        <DataTable
          columns={[...COLUMNS, { key: '_actions', label: 'Actions', render: (_, row) => rowActions(row) }]}
          data={depts}
          loading={isLoading}
        />
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal title={editingDept ? 'Edit Department' : 'New Department'} onClose={closeModal}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && <p className="text-[#ef4444] text-sm">{formError}</p>}
              <Field label="Code (e.g. CS)">
                <input className="input-field" value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} required />
              </Field>
              <Field label="Name">
                <input className="input-field" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
              </Field>
              <Field label="Description">
                <textarea className="input-field min-h-[80px]" value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} />
              </Field>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="btn-primary flex-1">
                  {createMut.isPending || updateMut.isPending ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="btn-secondary flex-1" onClick={closeModal}>Cancel</button>
              </div>
            </form>
          </Modal>
        )}

        {showMentorModal && mentorDept && (
          <Modal title={`Assign Mentor — ${mentorDept.name}`} onClose={() => setShowMentorModal(false)}>
            <div className="space-y-4">
              <Field label="Select Staff Member">
                <select className="input-field" value={selectedMentor} onChange={(e) => setSelectedMentor(e.target.value)}>
                  <option value="">-- None --</option>
                  {staffList.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                </select>
              </Field>
              <div className="flex gap-3 pt-2">
                <button
                  className="btn-primary flex-1"
                  disabled={mentorMut.isPending}
                  onClick={() => mentorMut.mutate({ deptId: mentorDept.id, staffId: selectedMentor || null })}
                >
                  {mentorMut.isPending ? 'Saving...' : 'Assign'}
                </button>
                <button className="btn-secondary flex-1" onClick={() => setShowMentorModal(false)}>Cancel</button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

const Field = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-[#94a3b8] mb-1">{label}</label>
    {children}
  </div>
)

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-2xl w-full max-w-md p-6 border border-white/10"
      style={{ background: 'rgba(15,23,42,0.95)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#f0f4ff]">{title}</h2>
        <button onClick={onClose} className="text-[#475569] hover:text-[#f0f4ff] text-xl transition-colors">×</button>
      </div>
      {children}
    </motion.div>
  </div>
)

export default AdminDepartments
