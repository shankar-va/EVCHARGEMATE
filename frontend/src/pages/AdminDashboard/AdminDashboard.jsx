import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { BarChart3, MapPin, TicketCheck, Settings, Loader2 } from 'lucide-react';
import AdminStations from '../Admin/AdminStations';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let intervalId;
    
    const fetchGlobalData = async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true);
        const [analyticsRes, bookingsRes] = await Promise.all([
          api.adminGetAnalytics(),
          api.adminGetBookings()
        ]);
        setAnalytics(analyticsRes.data);
        setBookings(bookingsRes.data);
      } catch (err) {
        console.error("Admin data fetch error:", err);
      } finally {
        if (!isBackground) setLoading(false);
      }
    };
    
    if (activeTab === 'overview' || activeTab === 'bookings') {
      fetchGlobalData();
      
      // Real-time Dashboard Polling (every 10 seconds) natively avoiding manual refreshes
      intervalId = setInterval(() => {
        fetchGlobalData(true);
      }, 10000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeTab]);

  return (
    <div style={{ padding: '80px 20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-primary)' }}>
      <header style={{ marginBottom: '40px', background: 'var(--glass-bg)', padding: '25px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '10px' }}>Global Command Center</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome to the Admin environment. Monitor live sessions and manage hardware nodes.</p>
        
        <div style={{ display: 'flex', gap: '15px', marginTop: '30px', flexWrap: 'wrap' }}>
          <button 
             onClick={() => setActiveTab('overview')} 
             className={activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'} 
             style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', padding: '14px 28px' }}
          >
            <BarChart3 size={20} /> Analytics & Overview
          </button>
          
          <button 
             onClick={() => setActiveTab('stations')} 
             className={activeTab === 'stations' ? 'btn-primary' : 'btn-secondary'} 
             style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', padding: '14px 28px' }}
          >
            <MapPin size={20} /> Manage Stations
          </button>
          
          <button 
             onClick={() => setActiveTab('bookings')} 
             className={activeTab === 'bookings' ? 'btn-primary' : 'btn-secondary'} 
             style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.1rem', padding: '14px 28px' }}
          >
            <TicketCheck size={20} /> Global Bookings
          </button>
        </div>
      </header>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <Loader2 size={40} className="spin" style={{ color: 'var(--primary)' }} />
        </div>
      )}

      {/* OVERVIEW TAB */}
      {!loading && activeTab === 'overview' && analytics && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div style={{ background: 'var(--glass-bg)', padding: '25px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '1rem' }}>Total System Revenue</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-neon-green)' }}>₹{analytics.totalRevenue?.toLocaleString()}</p>
            </div>
            <div style={{ background: 'var(--glass-bg)', padding: '25px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '1rem' }}>Active Live Sessions</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>{analytics.activeSessions}</p>
            </div>
            <div style={{ background: 'var(--glass-bg)', padding: '25px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '1rem' }}>Hardware Stations</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 700 }}>{analytics.totalStations}</p>
            </div>
            <div style={{ background: 'var(--glass-bg)', padding: '25px', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ color: 'var(--text-secondary)', marginBottom: '10px', fontSize: '1rem' }}>Total Bookings Volume</h3>
              <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--accent-neon-blue)' }}>{analytics.totalBookings}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* MANAGE STATIONS TAB */}
      {activeTab === 'stations' && (
         <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
            <AdminStations />
         </motion.div>
      )}

      {/* GLOBAL BOOKINGS TAB */}
      {!loading && activeTab === 'bookings' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--glass-bg)', padding: '25px', borderRadius: '16px', border: '1px solid var(--glass-border)', overflowX: 'auto' }}>
          <h2 style={{ marginBottom: '20px', fontSize: '1.5rem' }}>Full Booking Ledger</h2>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>ID</th>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>Station</th>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>Date</th>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>Status</th>
                <th style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '15px 10px', fontSize: '0.9rem' }}>{String(b._id).slice(-6)}</td>
                  <td style={{ padding: '15px 10px', fontSize: '0.9rem' }}>{b.stationId}</td>
                  <td style={{ padding: '15px 10px', fontSize: '0.9rem' }}>{new Date(b.date).toLocaleDateString()}</td>
                  <td style={{ padding: '15px 10px', fontSize: '0.9rem' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                      background: b.status === 'active' ? 'rgba(0,255,0,0.1)' : b.status === 'completed' ? 'rgba(255,255,255,0.1)' : 'rgba(255,165,0,0.1)',
                      color: b.status === 'active' ? 'var(--accent-neon-green)' : b.status === 'completed' ? '#aaa' : 'orange'
                    }}>
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding: '15px 10px', fontSize: '0.9rem', fontWeight: 600 }}>₹{b.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {bookings.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No active bookings on the ledger.</p>}
        </motion.div>
      )}
    </div>
  );
};

export default AdminDashboard;
