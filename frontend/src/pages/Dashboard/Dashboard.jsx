import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { QrCode, Clock, MapPin, Map, Zap, FileText } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch user bookings. Assuming the backend gives full object info
    api.getUserBookings()
      .then(res => {
        setBookings(res.data || res.bookings || []);
      })
      .catch(err => {
        console.error("Dashboard error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="dashboard-container">
      <div className="dashboard-header glass-panel">
        <div className="user-profile">
          <div className="avatar">
            <Zap size={32} color="var(--accent-neon-blue)" />
          </div>
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, <span className="text-gradient font-bold">{user?.name || 'EV Driver'}</span></p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="stats-row">
          <div className="stat-card glass-panel">
            <Clock className="text-gradient" size={28} />
            <div className="stat-info">
              <h3>{bookings.length}</h3>
              <p>Total Bookings</p>
            </div>
          </div>
          <div className="stat-card glass-panel">
            <Zap className="text-gradient" color="var(--accent-neon-green)" size={28} />
            <div className="stat-info">
              <h3>{bookings.filter(b => b.status === 'Active').length || 0}</h3>
              <p>Active Sessions</p>
            </div>
          </div>
        </div>

        <h2 className="section-title mt-40">Your Bookings</h2>
        
        {loading ? (
          <div className="loader">Loading your data...</div>
        ) : bookings.length === 0 ? (
          <div className="empty-state glass-panel">
            <FileText size={48} color="var(--text-secondary)" />
            <h3>No bookings yet.</h3>
            <p>Book a slot at a nearby charging station to get started.</p>
          </div>
        ) : (
          <div className="bookings-grid">
            {bookings.map((booking, i) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                key={booking._id || i} 
                className="booking-card glass-panel"
              >
                <div className="booking-header">
                  <span className={`status-pill ${booking.status?.toLowerCase() || 'confirmed'}`}>
                    {booking.status || 'Confirmed'}
                  </span>
                  <span className="booking-date">
                    {new Date(booking.date || booking.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="station-name">
                  <MapPin size={18} /> 
                  {booking.station?.name || 'Charging Station'}
                </h3>
                
                <div className="qr-container">
                  {booking.qrCode ? (
                    <>
                      <img src={booking.qrCode} alt="Access QR Code" className="qr-image" />
                      <p className="qr-hint">Scan at the station pad to activate charging.</p>
                    </>
                  ) : (
                    <div className="qr-placeholder">
                      <QrCode size={40} />
                      <p>QR Code generated upon check-in.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
