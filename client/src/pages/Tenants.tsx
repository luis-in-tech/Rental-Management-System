import React, { useEffect, useState } from 'react';
import { UserPlus, Star, Mail, Phone, Edit2, Trash2, Check, Clock, AlertCircle } from 'lucide-react';
import { tenantsAPI, roomsAPI, buildingsAPI, authAPI } from '../services/api';
import { Tenant, Building, Room } from '../types';

const Tenants: React.FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBuilding, setFilterBuilding] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState({ accountId: '', firstName: '', lastName: '', email: '', password: '', phone: '', isPrimary: false });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [tRes, bRes, rRes] = await Promise.all([
        tenantsAPI.getAll(),
        buildingsAPI.getAll(),
        roomsAPI.getAll(),
      ]);
      setTenants(tRes.data.tenants || []);
      setBuildings(bRes.data.buildings || []);
      setRooms(rRes.data.rooms?.filter((r: Room) => r.account) || []);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`Approve and activate tenant account for ${name}?\n\nThis confirms their identity against their contract & IDs and grants them active access to their tenant portal.`)) return;
    try {
      await tenantsAPI.update(id, { status: 'active' });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve tenant');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await tenantsAPI.update(editing.id, {
          firstName: form.firstName, lastName: form.lastName,
          email: form.email, phone: form.phone, isPrimary: form.isPrimary,
        });
      } else {
        await authAPI.registerTenant(form);
      }
      setShowModal(false); setEditing(null); loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this tenant?')) return;
    try { await tenantsAPI.delete(id); loadData(); } catch (err) { console.error(err); }
  };

  const openEdit = (t: Tenant) => {
    setEditing(t);
    setForm({ accountId: t.account_id, firstName: t.first_name, lastName: t.last_name, email: t.email, password: '', phone: t.phone || '', isPrimary: t.is_primary });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ accountId: '', firstName: '', lastName: '', email: '', password: '', phone: '', isPrimary: false });
    setShowModal(true);
  };

  const pendingCount = tenants.filter(t => t.status === 'inactive').length;

  const filtered = tenants.filter((t: any) => {
    if (filterBuilding && t.account?.room?.building?.id !== filterBuilding) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      {pendingCount > 0 && (
        <div 
          style={{ 
            background: 'rgba(245, 158, 11, 0.1)', 
            border: '1px solid rgba(245, 158, 11, 0.35)', 
            borderRadius: 'var(--radius-sm)', 
            padding: '0.75rem 1rem', 
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: '#b45309',
            fontSize: '0.85rem',
            fontWeight: 600,
          }}
        >
          <AlertCircle size={18} />
          <span>
            {pendingCount} tenant registration(s) pending landlord verification. Please check the contract and submitted IDs, then click "Approve" to activate their portal access.
          </span>
        </div>
      )}

      <div className="flex-between mb-2">
        <div className="filter-bar">
          <span className="filter-label">Filter:</span>
          <select value={filterBuilding} onChange={e => setFilterBuilding(e.target.value)}>
            <option value="">All Buildings</option>
            {buildings.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active ({tenants.filter(t => t.status === 'active').length})</option>
            <option value="inactive">Pending Approval ({pendingCount})</option>
          </select>
          <span className="text-muted text-sm">{filtered.length} tenant(s)</span>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><UserPlus size={16} /> Add Tenant</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Phone</th><th>Building / Room</th><th>Role</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t: any) => (
              <tr key={t.id} style={t.status === 'inactive' ? { background: 'rgba(245, 158, 11, 0.03)' } : {}}>
                <td><strong>{t.first_name} {t.last_name}</strong></td>
                <td><span className="flex gap-1" style={{ alignItems: 'center' }}><Mail size={13} /> {t.email}</span></td>
                <td>{t.phone ? <span className="flex gap-1" style={{ alignItems: 'center' }}><Phone size={13} /> {t.phone}</span> : <span className="text-muted">—</span>}</td>
                <td>{t.account?.room?.building?.name || '—'} / {t.account?.room?.room_number || '—'}</td>
                <td>{t.is_primary ? <span className="badge badge-warning"><Star size={10} /> Primary</span> : <span className="badge badge-muted">Member</span>}</td>
                <td>
                  {t.status === 'active' ? (
                    <span className="badge badge-success">Active</span>
                  ) : (
                    <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} /> Pending Approval
                    </span>
                  )}
                </td>
                <td>
                  <div className="flex gap-1" style={{ alignItems: 'center' }}>
                    {t.status === 'inactive' && (
                      <button 
                        className="btn btn-sm btn-success" 
                        style={{ padding: '0.22rem 0.55rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        onClick={() => handleApprove(t.id, `${t.first_name} ${t.last_name}`)}
                        title="Verify against documents & Approve Tenant"
                      >
                        <Check size={13} /> Approve
                      </button>
                    )}
                    <button className="btn-icon btn-sm" onClick={() => openEdit(t)} title="Edit Tenant"><Edit2 size={14} /></button>
                    <button className="btn-icon btn-sm" onClick={() => handleDelete(t.id)} title="Delete Tenant"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7}><div className="empty-state"><p>No tenants found</p></div></td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>{editing ? 'Edit Tenant' : 'Add New Tenant'}</h3><button className="btn-icon" onClick={() => setShowModal(false)}>✕</button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {!editing && (
                  <div className="form-group"><label className="form-label">Assign to Room *</label>
                    <select value={form.accountId} onChange={e => setForm({...form, accountId: e.target.value})} required>
                      <option value="">Select a room...</option>
                      {rooms.map((r: any) => (
                        <option key={r.account?.id} value={r.account?.id}>
                          {r.building?.name} — {r.room_number} ({r.account?.primary_email})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group"><label className="form-label">First Name *</label><input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} required /></div>
                  <div className="form-group"><label className="form-label">Last Name *</label><input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} required /></div>
                </div>
                <div className="form-group"><label className="form-label">Email *</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required /></div>
                {!editing && (
                  <div className="form-group">
                    <label className="form-label">Password *</label>
                    <input 
                      type="password" 
                      value={form.password} 
                      onChange={e => setForm({...form, password: e.target.value})} 
                      placeholder="••••••••" 
                      required 
                    />
                  </div>
                )}
                <div className="form-group"><label className="form-label">Phone</label><input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.isPrimary} onChange={e => setForm({...form, isPrimary: e.target.checked})} style={{ width: 'auto' }} />
                    <span className="form-label" style={{ margin: 0 }}>Set as primary tenant</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button><button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Add'} Tenant</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tenants;
