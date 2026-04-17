import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { QrCode, Clock, MapPin, Zap, FileText } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkInLoadingId, setCheckInLoadingId] = useState(null);
  const [cancelLoadingId, setCancelLoadingId] = useState(null);
  const [checkInError, setCheckInError] = useState('');
  const [confirmBooking, setConfirmBooking] = useState(null);

  const displayName = user?.name || user?.username || 'EV Driver';

  // 🔥 FETCH BOOKINGS
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setCheckInError('');

      const res = await api.getUserBookings();
      const data = res.data || res.bookings || [];

      console.log("BOOKINGS FROM API:", data); // DEBUG

      setBookings(data);
    } catch (err) {
      console.error(err);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchBookings();
    }
  }, [user?._id]);

  // 🔥 OPEN MODAL WITH LATEST DATA
  const openBookingModal = async (booking) => {
    try {
      const res = await api.getUserBookings();
      const latestBookings = res.data || res.bookings || [];

      const latestBooking = latestBookings.find(
        (b) => String(b._id) === String(booking._id)
      );

      console.log("LATEST BOOKING:", latestBooking);

      setConfirmBooking(latestBooking || booking);
    } catch (err) {
      console.error(err);
      setConfirmBooking(booking);
    }
  };

  // 🔥 CHECK-IN
  const handleCheckIn = async (booking) => {
    if (!booking?._id || !booking?.stationId) return;

    setCheckInLoadingId(String(booking._id));
    setCheckInError('');

    try {
      const qrData = JSON.stringify({
        bookingId: booking._id,
        stationId: booking.stationId,
        timeSlot: booking.timeSlots,
        date: booking.date,
      });

      const res = await api.verifyQR(qrData);

      await fetchBookings();

      alert(res.message || 'Charging Started Successfully!');
      setConfirmBooking(null);
    } catch (err) {
      console.error(err);
      setCheckInError(err.message || 'Check-in failed.');
    } finally {
      setCheckInLoadingId(null);
    }
  };

  // 🔥 CANCEL BOOKING
  const handleCancel = async (id) => {
    setCancelLoadingId(id);
    setCheckInError('');

    try {
      const resp = await api.cancelBooking(id);

      alert(resp.message || 'Booking cancelled successfully');

      await fetchBookings();

      setConfirmBooking(null);
    } catch (err) {
      console.error(err);
      setCheckInError(err.message || 'Cancel failed.');
    } finally {
      setCancelLoadingId(null);
    }
  };

  const getStatusPill = (booking) => {
    const status = booking?.status?.toLowerCase?.() || '';
    if (status === 'booked') return { className: 'active', label: 'Active' };
    if (status === 'cancelled') return { className: 'expired', label: 'Cancelled' };
    if (status === 'completed') return { className: 'completed', label: 'Completed' };
    if (status === 'active') return { className: 'active', label: 'Charging' };
    return { className: 'confirmed', label: booking?.status || 'Confirmed' };
  };

  const activeCount = bookings.filter(
    (b) => (b?.status || '').toLowerCase() === 'active'
  ).length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header glass-panel">
        <div className="user-profile">
          <div className="avatar">
            <Zap size={32} color="var(--accent-neon-blue)" />
          </div>
          <div>
            <h1>Dashboard</h1>
            <p>
              Welcome back{' '}
              <span className="text-gradient font-bold">{displayName}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="stats-row">
          <div className="stat-card glass-panel">
            <Clock size={28} />
            <div className="stat-info">
              <h3>{bookings.length}</h3>
              <p>Total Bookings</p>
            </div>
          </div>

          <div className="stat-card glass-panel">
            <Zap size={28} />
            <div className="stat-info">
              <h3>{activeCount}</h3>
              <p>Active Sessions</p>
            </div>
          </div>
        </div>

        <h2 className="section-title mt-40">Your Bookings</h2>

        {loading ? (
          <div className="loader">Loading your data...</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state glass-panel">
            <FileText size={48} />
            <h3>No bookings yet.</h3>
          </div>
        ) : (
          <div className="bookings-grid">
            {bookings.map((booking) => (
              <motion.div key={booking._id} className="booking-card glass-panel">
                <div className="booking-header">
                  <span className={`status-pill ${getStatusPill(booking).className}`}>
                    {getStatusPill(booking).label}
                  </span>
                  <span className="booking-date">
                    {new Date(booking.date).toLocaleDateString()}
                  </span>
                </div>

                <h3 className="station-name">
                  <MapPin size={18} />
                  {booking.companyName || booking.stationId}
                </h3>

                <div className="qr-container">
                  {booking.qrCode ? (
                    <img src={booking.qrCode} alt="QR" className="qr-image" />
                  ) : (
                    <div className="qr-placeholder">
                      <QrCode size={40} />
                      <p>QR generated after payment</p>
                    </div>
                  )}
                </div>

                {booking.status !== 'completed' && (
                  <button
                    className="btn-primary"
                    disabled={!booking.qrCode}
                    onClick={() => openBookingModal(booking)}
                  >
                    View QR Code
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      {confirmBooking && (
        <div className="modal-overlay">
          <motion.div className="booking-modal glass-panel" style={{ maxWidth: 600, textAlign: 'center' }}>
            <h2>Cryptographic Access Token</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Show this encrypted hardware payload at the Station Kiosk to initiate your check-in dynamically.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div>
                {confirmBooking.qrCode ? (
                  <img
                    src={confirmBooking.qrCode}
                    alt="QR"
                    style={{ width: 350, height: 350, background: 'white', padding: '15px', borderRadius: '12px' }}
                  />
                ) : (
                  <div style={{ width: 350, height: 350, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                    <p>No QR available</p>
                  </div>
                )}
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', width: '100%', textAlign: 'left' }}>
                <p><b>Station ID:</b> {confirmBooking.stationId}</p>
                <p><b>Date:</b> {confirmBooking.date}</p>
                <p><b>Time Slots:</b> {confirmBooking.timeSlots?.join(', ')}</p>
                <p><b>Payment Status:</b> <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>{confirmBooking.paymentStatus}</span></p>
                <p><b>Booking Status:</b> <span style={{ color: 'var(--accent-neon-blue)', fontWeight: 'bold' }}>{confirmBooking.status}</span></p>
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'center', marginTop: '25px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
              <button 
                className="btn-secondary"
                onClick={() => setConfirmBooking(null)}
                style={{ minWidth: '200px' }}
              >
                Close / Back
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;