import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  listUsers,
  createUser,
  updateUser,
  toggleUserActive,
  resetUserPassword,
  deleteUser,
} from '../../api/admin'
import DataTable from '../../components/DataTable'
import RiskBadge from '../../components/RiskBadge'
import { formatDate } from '../../utils/formatters'
import { toast } from '../../store/toastStore'

const ROLE_OPTIONS = ['admin', 'staff', 'student']

const COLUMNS = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'role', label: 'Role', render: (v) => <span className="badge badge-blue">{v}</span> },
  { key: 'department_name', label: 'Department' },
  {
    key: 'is_active',
    label: 'Status',
    render: (v) => (
      <span className={`badge ${v ? 'badge-green' : 'badge-red'}`}>{v ? 'Active' : 'Blocked'}</span>
    ),
  },
  { key: 'created_at', label: 'Joined', render: (v) => formatDate(v) },
]

const defaultForm = { name: '', email: '', password: '', role: 'staff', department_id: '' }

const AdminUsers = () => {
  const qc = useQueryClient()
  const [roleFilter, setRoleFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [form, setForm] = useState(defaultForm)
  const [formError, setFormError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', roleFilter],
    queryFn: () => listUsers({ role: roleFilter || undefined, page: 1, size: 500 }),
    staleTime: 60 * 1000,
  })

  const users = data?.data?.items ?? []
  const total = data?.data?.total ?? 0

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-users'] })

  const createMut = useMutation({ mutationFn: createUser, onSuccess: () => { invalidate(); closeModal(); toast.success('User created successfully') } })
  const updateMut = useMutation({ mutationFn: ({ id, payload }) => updateUser(id, payload), onSuccess: () => { invalidate(); closeModal(); toast.success('User updated') } })
  const toggleMut = useMutation({ mutationFn: toggleUserActive, onSuccess: () => { invalidate(); toast.success('User status updated') } })
  const resetMut = useMutation({ mutationFn: resetUserPassword, onSuccess: () => { invalidate(); toast.success('Password reset to default') } })
  const deleteMut = useMutation({ mutationFn: deleteUser, onSuccess: () => { invalidate(); toast.success('User deleted') } })

  const openCreate = () => { setEditingUser(null); setForm(defaultForm); setFormError(''); setShowModal(true) }
  const openEdit = (u) => {
    setEditingUser(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role, department_id: u.department_id ?? '' })
    setFormError('')
    setShowModal(true)
  }
  const closeModal = () => { setShowModal(false); setEditingUser(null); setFormError('') }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.name || !form.email || (!editingUser && !form.password)) {
      setFormError('Name, email and password are required.')
      return
    }
    if (editingUser) {
      const payload = { name: form.name, department_id: form.department_id || undefined }
      if (editingUser.role !== 'student') payload.role = form.role
      updateMut.mutate({ id: editingUser.id, payload })
    } else {
      const payload = {
        ...form,
        department_id: form.department_id || undefined,
        student_code: form.student_code || undefined,
        employee_code: form.employee_code || undefined,
        batch_year: form.batch_year || undefined,
      }
      createMut.mutate(payload)
    }
  }

  const rowActions = (row) => (
    <div className="flex gap-2">
      <button className="btn-sm btn-ghost" onClick={() => openEdit(row)}>Edit</button>
      <button className="btn-sm btn-ghost" onClick={() => toggleMut.mutate(row.id)}>
        {row.is_active ? 'Block' : 'Unblock'}
      </button>
      <button className="btn-sm btn-ghost text-[#f59e0b]" onClick={() => {
        if (window.confirm('Reset password to Auto@1234?')) resetMut.mutate(row.id)
      }}>Reset PW</button>
      <button className="btn-sm btn-ghost text-[#ef4444]" onClick={() => {
        if (window.confirm('Delete this user?')) deleteMut.mutate(row.id)
      }}>Delete</button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0f4ff]">Users</h1>
          <p className="text-[#94a3b8] mt-1">{total} total accounts</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ New User</button>
      </div>

      {/* Role Filter */}
      <div className="flex gap-2">
        {['', ...ROLE_OPTIONS].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              roleFilter === r ? 'bg-[#3b82f6] text-white border-[#3b82f6]' : 'text-[#94a3b8] border-white/10 hover:border-[#3b82f6]/40 bg-white/[0.05]'
            }`}
          >
            {r || 'All'}
          </button>
        ))}
      </div>

      <div className="card">
        <DataTable
          columns={[...COLUMNS, { key: '_actions', label: 'Actions', render: (_, row) => rowActions(row) }]}
          data={users}
          loading={isLoading}
          pageSize={20}
        />
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal title={editingUser ? 'Edit User' : 'Create User'} onClose={closeModal}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && <p className="text-[#ef4444] text-sm">{formError}</p>}
              <Field label="Full Name">
                <input className="input-field" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
              </Field>
              <Field label="Email">
                <input className="input-field" type="email" value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} required disabled={!!editingUser} />
              </Field>
              {!editingUser && (
                <Field label="Password">
                  <input className="input-field" type="password" value={form.password} onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))} required />
                </Field>
              )}
              {!(editingUser && editingUser.role === 'student') && (
                <Field label="Role">
                  <select className="input-field" value={form.role} onChange={(e) => setForm(p => ({ ...p, role: e.target.value }))}>
                    {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </Field>
              )}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="btn-primary flex-1">
                  {createMut.isPending || updateMut.isPending ? 'Saving...' : 'Save'}
                </button>
                <button type="button" className="btn-secondary flex-1" onClick={closeModal}>Cancel</button>
              </div>
            </form>
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

export default AdminUsers
