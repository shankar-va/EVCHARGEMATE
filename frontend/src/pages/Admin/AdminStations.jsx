import React, { useMemo, useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, Plus, Trash2, Wrench, Search } from 'lucide-react';
import './AdminStations.css';

const toConnectorsArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const Field = ({ label, children }) => (
  <label className="admin-field">
    <span className="admin-label">{label}</span>
    {children}
  </label>
);

const AdminStations = () => {
  const { user } = useAuth();
  const role = user?.role || 'user';

  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [createForm, setCreateForm] = useState({
    stationSource: 'admin',
    externalStationId: '',
    companyName: '',
    operator: '',
    longitude: '',
    latitude: '',
    address: '',
    city: '',
    country: '',
    connectors: 'Type2',
    powerKW: 50,
    operatingHours: '',
    rating: 4,
    pricePerUnit: 12,
    slotsPerHour: 100,
  });

  const [updateForm, setUpdateForm] = useState({
    address: '',
    stationSource: 'admin',
    externalStationId: '',
    companyName: '',
    operator: '',
    longitude: '',
    latitude: '',
    city: '',
    country: '',
    connectors: 'Type2',
    powerKW: 50,
    operatingHours: '',
    rating: 4,
    pricePerUnit: 12,
    slotsPerHour: 100,
  });

  const [deleteExternalStationId, setDeleteExternalStationId] = useState('');
  const [getStationId, setGetStationId] = useState('');
  const [stationDetails, setStationDetails] = useState(null);

  const canSubmit = role === 'admin';

  const createPayload = useMemo(() => {
    return {
      ...createForm,
      location: {
        type: 'Point',
        coordinates: [
          Number(createForm.longitude),
          Number(createForm.latitude),
        ],
      },
      connectors: toConnectorsArray(createForm.connectors),
      powerKW: Number(createForm.powerKW),
      rating: Number(createForm.rating),
      pricePerUnit: Number(createForm.pricePerUnit),
      slotsPerHour: Number(createForm.slotsPerHour),
      operatingHours: createForm.operatingHours
        ? Number(createForm.operatingHours)
        : undefined,
    };
  }, [createForm]);

  const updatePayload = useMemo(() => {
    return {
      ...updateForm,
      location: {
        type: 'Point',
        coordinates: [
          Number(updateForm.longitude),
          Number(updateForm.latitude),
        ],
      },
      connectors: toConnectorsArray(updateForm.connectors),
      powerKW: Number(updateForm.powerKW),
      rating: Number(updateForm.rating),
      pricePerUnit: Number(updateForm.pricePerUnit),
      slotsPerHour: Number(updateForm.slotsPerHour),
      operatingHours: updateForm.operatingHours
        ? Number(updateForm.operatingHours)
        : undefined,
    };
  }, [updateForm]);

  const handleCreate = async () => {
    setError('');
    setSuccess('');
    setActionLoading('create');

    try {
      const res = await api.adminCreateStation(createPayload);
      setSuccess(res.message || 'Station created successfully');
      setCreateForm((prev) => ({ ...prev, externalStationId: '', companyName: '', address: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading('');
    }
  };

  const handleUpdate = async () => {
    setError('');
    setSuccess('');
    setActionLoading('update');

    try {
      const payload = { ...updatePayload, address: updateForm.address };
      const res = await api.adminUpdateStation(payload);
      setSuccess(res.message || 'Station updated successfully');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading('');
    }
  };

  const handleDelete = async () => {
    setError('');
    setSuccess('');
    setActionLoading('delete');

    try {
      const res = await api.adminDeleteStation(deleteExternalStationId);
      setSuccess(res.message || 'Station deleted successfully');
      setDeleteExternalStationId('');
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading('');
    }
  };

  const handleGet = async () => {
    setError('');
    setSuccess('');
    setActionLoading('get');

    try {
      const res = await api.adminGetStation(getStationId);
      setStationDetails(res.data || null);
      setSuccess(res.message || 'Station fetched');
    } catch (err) {
      setError(err.message);
      setStationDetails(null);
    } finally {
      setActionLoading('');
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header glass-panel">
        <div>
          <h1 className="admin-title">Admin Station Management</h1>
          <p className="admin-subtitle">
            {canSubmit ? 'Create, update, delete, and fetch stations.' : 'Admin access required.'}
          </p>
        </div>
      </div>

      <div className="admin-grid">
        <motion.section
          className="admin-card glass-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="admin-card-head">
            <Plus size={20} />
            <h2>Create Station</h2>
          </div>

          <div className="admin-form-grid">
            <Field label="External Station ID">
              <input className="admin-input" value={createForm.externalStationId} onChange={(e) => setCreateForm((p) => ({ ...p, externalStationId: e.target.value }))} />
            </Field>
            <Field label="Company Name">
              <input className="admin-input" value={createForm.companyName} onChange={(e) => setCreateForm((p) => ({ ...p, companyName: e.target.value }))} />
            </Field>
            <Field label="Operator">
              <input className="admin-input" value={createForm.operator} onChange={(e) => setCreateForm((p) => ({ ...p, operator: e.target.value }))} />
            </Field>
            <Field label="Address">
              <input className="admin-input" value={createForm.address} onChange={(e) => setCreateForm((p) => ({ ...p, address: e.target.value }))} />
            </Field>
            <Field label="City">
              <input className="admin-input" value={createForm.city} onChange={(e) => setCreateForm((p) => ({ ...p, city: e.target.value }))} />
            </Field>
            <Field label="Country">
              <input className="admin-input" value={createForm.country} onChange={(e) => setCreateForm((p) => ({ ...p, country: e.target.value }))} />
            </Field>

            <Field label="Latitude">
              <input
                className="admin-input"
                type="number"
                step="any"
                value={createForm.latitude}
                onChange={(e) => setCreateForm((p) => ({ ...p, latitude: e.target.value }))}
              />
            </Field>
            <Field label="Longitude">
              <input
                className="admin-input"
                type="number"
                step="any"
                value={createForm.longitude}
                onChange={(e) => setCreateForm((p) => ({ ...p, longitude: e.target.value }))}
              />
            </Field>

            <Field label="Connectors (comma separated)">
              <input
                className="admin-input"
                value={createForm.connectors}
                onChange={(e) => setCreateForm((p) => ({ ...p, connectors: e.target.value }))}
              />
            </Field>
            <Field label="Power (kW)">
              <input
                className="admin-input"
                type="number"
                value={createForm.powerKW}
                onChange={(e) => setCreateForm((p) => ({ ...p, powerKW: e.target.value }))}
              />
            </Field>
            <Field label="Price per Unit (₹)">
              <input
                className="admin-input"
                type="number"
                value={createForm.pricePerUnit}
                onChange={(e) => setCreateForm((p) => ({ ...p, pricePerUnit: e.target.value }))}
              />
            </Field>
            <Field label="Slots per Hour">
              <input
                className="admin-input"
                type="number"
                value={createForm.slotsPerHour}
                onChange={(e) => setCreateForm((p) => ({ ...p, slotsPerHour: e.target.value }))}
              />
            </Field>

            <Field label="Rating (optional)">
              <input
                className="admin-input"
                type="number"
                value={createForm.rating}
                onChange={(e) => setCreateForm((p) => ({ ...p, rating: e.target.value }))}
              />
            </Field>
            <Field label="Operating Hours (optional)">
              <input
                className="admin-input"
                type="number"
                value={createForm.operatingHours}
                onChange={(e) => setCreateForm((p) => ({ ...p, operatingHours: e.target.value }))}
              />
            </Field>
          </div>

          <div className="admin-actions">
            <button className="btn-primary" onClick={handleCreate} disabled={!canSubmit || actionLoading === 'create'}>
              {actionLoading === 'create' ? <Loader2 size={18} className="spin" /> : 'Create'}
            </button>
          </div>
        </motion.section>

        <motion.section
          className="admin-card glass-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <div className="admin-card-head">
            <Wrench size={20} />
            <h2>Update Station</h2>
          </div>

          <div className="admin-form-grid">
            <Field label="Address (used to locate station)">
              <input className="admin-input" value={updateForm.address} onChange={(e) => setUpdateForm((p) => ({ ...p, address: e.target.value }))} />
            </Field>

            <Field label="External Station ID">
              <input className="admin-input" value={updateForm.externalStationId} onChange={(e) => setUpdateForm((p) => ({ ...p, externalStationId: e.target.value }))} />
            </Field>
            <Field label="Company Name">
              <input className="admin-input" value={updateForm.companyName} onChange={(e) => setUpdateForm((p) => ({ ...p, companyName: e.target.value }))} />
            </Field>
            <Field label="Operator">
              <input className="admin-input" value={updateForm.operator} onChange={(e) => setUpdateForm((p) => ({ ...p, operator: e.target.value }))} />
            </Field>

            <Field label="City">
              <input className="admin-input" value={updateForm.city} onChange={(e) => setUpdateForm((p) => ({ ...p, city: e.target.value }))} />
            </Field>
            <Field label="Country">
              <input className="admin-input" value={updateForm.country} onChange={(e) => setUpdateForm((p) => ({ ...p, country: e.target.value }))} />
            </Field>

            <Field label="Latitude">
              <input
                className="admin-input"
                type="number"
                step="any"
                value={updateForm.latitude}
                onChange={(e) => setUpdateForm((p) => ({ ...p, latitude: e.target.value }))}
              />
            </Field>
            <Field label="Longitude">
              <input
                className="admin-input"
                type="number"
                step="any"
                value={updateForm.longitude}
                onChange={(e) => setUpdateForm((p) => ({ ...p, longitude: e.target.value }))}
              />
            </Field>

            <Field label="Connectors (comma separated)">
              <input className="admin-input" value={updateForm.connectors} onChange={(e) => setUpdateForm((p) => ({ ...p, connectors: e.target.value }))} />
            </Field>
            <Field label="Power (kW)">
              <input className="admin-input" type="number" value={updateForm.powerKW} onChange={(e) => setUpdateForm((p) => ({ ...p, powerKW: e.target.value }))} />
            </Field>
            <Field label="Price per Unit (₹)">
              <input className="admin-input" type="number" value={updateForm.pricePerUnit} onChange={(e) => setUpdateForm((p) => ({ ...p, pricePerUnit: e.target.value }))} />
            </Field>
            <Field label="Slots per Hour">
              <input className="admin-input" type="number" value={updateForm.slotsPerHour} onChange={(e) => setUpdateForm((p) => ({ ...p, slotsPerHour: e.target.value }))} />
            </Field>
            <Field label="Rating (optional)">
              <input className="admin-input" type="number" value={updateForm.rating} onChange={(e) => setUpdateForm((p) => ({ ...p, rating: e.target.value }))} />
            </Field>
            <Field label="Operating Hours (optional)">
              <input className="admin-input" type="number" value={updateForm.operatingHours} onChange={(e) => setUpdateForm((p) => ({ ...p, operatingHours: e.target.value }))} />
            </Field>
          </div>

          <div className="admin-actions">
            <button className="btn-primary" onClick={handleUpdate} disabled={!canSubmit || actionLoading === 'update'}>
              {actionLoading === 'update' ? <Loader2 size={18} className="spin" /> : 'Update'}
            </button>
          </div>

          <div className="admin-divider" />

          <div className="admin-actions-row">
            <Field label="Delete by External Station ID">
              <input className="admin-input" value={deleteExternalStationId} onChange={(e) => setDeleteExternalStationId(e.target.value)} />
            </Field>
            <button className="btn-secondary" onClick={handleDelete} disabled={!canSubmit || actionLoading === 'delete'}>
              {actionLoading === 'delete' ? <Loader2 size={18} className="spin" /> : <Trash2 size={18} />}
              <span style={{ marginLeft: 8 }}>Delete</span>
            </button>
          </div>
        </motion.section>

        <motion.section
          className="admin-card glass-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <div className="admin-card-head">
            <Search size={20} />
            <h2>Fetch Station</h2>
          </div>

          <div className="admin-actions-row">
            <Field label="Mongo Station ID">
              <input className="admin-input" value={getStationId} onChange={(e) => setGetStationId(e.target.value)} placeholder="e.g. 65f...abc" />
            </Field>
            <button className="btn-primary" onClick={handleGet} disabled={!canSubmit || actionLoading === 'get'}>
              {actionLoading === 'get' ? <Loader2 size={18} className="spin" /> : 'Get'}
            </button>
          </div>

          {stationDetails ? (
            <pre className="admin-json">{JSON.stringify(stationDetails, null, 2)}</pre>
          ) : (
            <div className="admin-empty glass-panel">No station fetched yet.</div>
          )}
        </motion.section>
      </div>

      {(error || success) && (
        <div className="admin-toast glass-panel" role="status" aria-live="polite">
          {error && <div className="admin-error">{error}</div>}
          {success && <div className="admin-success">{success}</div>}
        </div>
      )}
    </div>
  );
};

export default AdminStations;

