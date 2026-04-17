import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { QrCode, Power, ShieldAlert, Loader2, BatteryCharging, History, CheckCircle2, XCircle, Camera } from 'lucide-react';
import CryptoJS from 'crypto-js';
import { Scanner } from '@yudiel/react-qr-scanner';

const StationPortal = () => {
  const [stationId, setStationId] = useState('');
  const [stationSecret, setStationSecret] = useState('');
  const [qrInput, setQrInput] = useState('');
  const [cameraOpen, setCameraOpen] = useState(false);
  
  const [booted, setBooted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [scannedData, setScannedData] = useState(null);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const savedAuth = localStorage.getItem("stationAuth");
    if (savedAuth) {
      const { id, secret } = JSON.parse(savedAuth);
      setStationId(id);
      setStationSecret(secret);
      setBooted(true);
    }
  }, []);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [{ time: new Date().toLocaleTimeString(), message, type }, ...prev].slice(0, 10));
  };

  const handleBoot = async (e) => {
    e.preventDefault();
    
    const cleanId = stationId?.trim();
    const cleanSecret = stationSecret?.trim();

    if (!cleanId || !cleanSecret) {
      setError('Both Station ID and Cryptographic Secret are required to initialize node.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.bootStation({ stationId: cleanId, stationSecret: cleanSecret });
      
      localStorage.setItem("stationAuth", JSON.stringify({ id: cleanId, secret: cleanSecret }));
      setStationId(cleanId);
      setStationSecret(cleanSecret);
      setBooted(true);
      addLog(`System Initialization Complete. Bound to: ${cleanId}`, 'success');
    } catch (err) {
      setError(err.message || "Boot Authorization Failed. Please verify Hardware ID and Secret.");
      addLog("Node explicitly rejected invalid configuration matrix seamlessly.", 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("stationAuth");
    setStationId('');
    setStationSecret('');
    setBooted(false);
    setActiveSession(null);
    setScannedData(null);
    setLogs([]);
    setError('');
    setCameraOpen(false);
  };

  const executeDecryption = (qrValue) => {
    if (!qrValue) return;
    setError('');
    addLog(`Physical QR Scan Intercepted. Decrypting securely...`);

    try {
      const stableSymmetricKey = CryptoJS.SHA256(stationSecret).toString(CryptoJS.enc.Hex);
      
      let cleanInput = qrValue.trim();
      if (cleanInput.startsWith('"') && cleanInput.endsWith('"')) {
          cleanInput = cleanInput.slice(1, -1);
      }

      const bytes = CryptoJS.AES.decrypt(cleanInput, stableSymmetricKey);
      const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedString) throw new Error("Tampered Payload or Invalid Station Secret Key");

      const parsedJSON = JSON.parse(decryptedString);
      if (!parsedJSON.bookingId) throw new Error("Invalid Format");

      setQrInput(cleanInput);
      setScannedData(parsedJSON);
      addLog(`Cryptographic signature resolved successfully. Ready for manual operator execution.`, 'success');

    } catch (err) {
      setError('Invalid QR Payload, or you Booted this Station Node with the INCORRECT Secret Key! Restart Node with Exact Key.');
      addLog('Failed decoding raw encrypted QR payload locally.', 'error');
    }
  };

  const handleScan = async (e) => {
    if (e) e.preventDefault();
    executeDecryption(qrInput);
  };

  const checkInScannerResult = (result) => {
    if (result && result.length > 0) {
      const scanCode = result[0].rawValue;
      if (scanCode) {
         setCameraOpen(false);
         executeDecryption(scanCode);
      }
    }
  };

  const executeConfirmation = async () => {
    setLoading(true);
    setError('');
    addLog(`Operator authorized session. Transmitting command securely...`);

    try {
      const res = await api.confirmQR({ bookingId: scannedData.bookingId, stationId, stationSecret });
      const sessionMsg = res.message || 'Charging Started Successfully';
      setActiveSession(sessionMsg);
      addLog(`Relays opened globally. (Status = ACTIVE)`, 'success');
      setQrInput('');
      setScannedData(null);
    } catch (err) {
      const failMsg = err.response?.data?.message || err.message || 'Terminal verification failed securely.';
      setError(failMsg);
      addLog(`Execution Failed: ${failMsg}`, 'error');
      setActiveSession(null);
    } finally {
      setLoading(false);
    }
  };

  const executeCancellation = async () => {
    setLoading(true);
    setError('');
    addLog(`Operator demanded forced refund and cancellation. Contacting ledgers...`);

    try {
      const res = await api.cancelQRByStation({ bookingId: scannedData.bookingId, stationId, stationSecret });
      addLog(`Booking explicitly cancelled. Slot wiped. Funds refunding.`, 'error');
      setQrInput('');
      setScannedData(null);
    } catch (err) {
      const failMsg = err.response?.data?.message || err.message || 'Cancellation override failed securely.';
      setError(failMsg);
      addLog(`Cancel Failed: ${failMsg}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClearSession = () => {
    setActiveSession(null);
    setScannedData(null);
    setError('');
    setQrInput('');
    setCameraOpen(false);
    addLog('Operator dismissed active charging screen.', 'info');
  };

  return (
    <div style={{ padding: '80px 20px', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '1000px', width: '100%' }}>
        
        {/* Header Ribbon */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
             <div>
                 <h1 style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Station Operations Kiosk</h1>
                 <p style={{ color: 'var(--text-secondary)' }}>Physical hardware simulator integrating natively against production algorithms.</p>
             </div>
             {booted && (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(34, 197, 94, 0.1)', padding: '8px 16px', borderRadius: '50px', border: '1px solid rgba(34,197,94,0.3)', color: 'var(--success)' }}>
                         <span style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 10px var(--success)' }}></span>
                         Node Online
                    </div>
                    <button onClick={handleDisconnect} className="btn-secondary" style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Power size={18} /> Disconnect
                    </button>
                 </div>
             )}
        </div>

        {/* SETUP SCREEN */}
        {!booted ? (
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel" style={{ padding: '40px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
               <ShieldAlert size={48} style={{ color: 'var(--accent-purple)', marginBottom: '20px' }} />
               <h2 style={{ marginBottom: '10px' }}>Configure Hardware Node</h2>
               <p style={{ color: 'var(--text-secondary)', marginBottom: '30px' }}>Enter the unique cryptographic boundaries issued dynamically by the Admin dashboard during station generation.</p>
               
               <form onSubmit={handleBoot} style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'left' }}>
                  <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Station Access ID</label>
                      <input 
                         type="text" 
                         value={stationId}
                         onChange={e => setStationId(e.target.value)}
                         style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
                         placeholder="e.g. 64b8e2..."
                      />
                  </div>
                  <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Station Secret Key</label>
                      <input 
                         type="password" 
                         value={stationSecret}
                         onChange={e => setStationSecret(e.target.value)}
                         style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
                         placeholder="Secure 8-Byte Hardware Key"
                      />
                      <small style={{ color: 'var(--accent-neon-blue)', marginTop: '8px', display: 'block', fontSize: '0.8rem' }}>
                         *Developer Mode: Use <strong>EV_MOCK_SECRET</strong> for any external OpenChargeMap stations.
                      </small>
                  </div>
                  {error && <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</p>}
                  <button type="submit" className="btn-primary" style={{ marginTop: '10px' }}>Initialize Secure Connection</button>
               </form>
           </motion.div>
        ) : (
           /* DASHBOARD SCREEN */
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
               
               {/* Primary Scan & Status Flow */}
               <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                   
                   {/* Scanning Panel */}
                   <div className="glass-panel" style={{ padding: '30px' }}>
                       <h3 style={{ display: 'flex', alignItems: 'center', justifySpace: 'between', marginBottom: '20px' }}>
                           <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><QrCode size={24} color="var(--accent-neon-blue)" /> Scan Vehicle Code</div>
                       </h3>
                       
                       {cameraOpen && (
                         <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '15px', border: '2px solid var(--accent-neon-blue)' }}>
                            <Scanner onScan={checkInScannerResult} allowMultiple={false} />
                         </div>
                       )}

                       <form onSubmit={handleScan}>
                           <textarea
                              value={qrInput}
                              onChange={(e) => setQrInput(e.target.value)}
                              placeholder="Aim Hardware Scanner or Paste AES Encrypted Character Array..."
                              rows="4"
                              style={{ width: '100%', padding: '15px', borderRadius: '8px', background: 'rgba(0,0,0,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', resize: 'none', outline: 'none', marginBottom: '15px', fontFamily: 'monospace' }}
                              disabled={loading || activeSession || scannedData || cameraOpen}
                           />
                           {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '15px', borderRadius: '8px', color: 'var(--danger)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldAlert size={18}/> {error}</div>}
                           
                           {!scannedData && !activeSession && (
                             <div style={{ display: 'flex', gap: '10px' }}>
                               <button type="button" onClick={() => setCameraOpen(!cameraOpen)} className="btn-secondary" style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                 <Camera size={20} /> {cameraOpen ? 'Close Camera' : 'Open Lens'}
                               </button>
                               <button type="submit" className="btn-primary" disabled={loading || !qrInput || !!activeSession} style={{ flex: 1, opacity: (loading || !qrInput || activeSession) ? 0.6 : 1, display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                 {loading ? <Loader2 className="spin" size={20} /> : <QrCode size={20} />} 
                                 {loading ? 'Processing...' : 'Decrypt Text'}
                               </button>
                             </div>
                           )}
                       </form>

                       {scannedData && !activeSession && (
                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: '20px', padding: '20px', background: 'rgba(0,0,0,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                            <h4 style={{ color: 'var(--accent-neon-blue)', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                               <CheckCircle2 size={18} /> Decrypted Payload Succeeded
                            </h4>
                            <div style={{ marginBottom: '20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <p><strong>Booking ID:</strong> {scannedData.bookingId}</p>
                                <p><strong>Date:</strong> {new Date(scannedData.date).toLocaleDateString()}</p>
                                <p><strong>Time Slots:</strong> {scannedData.timeSlot?.join(', ')}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button className="btn-primary" onClick={executeConfirmation} disabled={loading} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: loading ? 0.6 : 1 }}>
                                  {loading ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />} Confirm Charging
                                </button>
                                <button className="btn-danger" onClick={executeCancellation} disabled={loading} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', opacity: loading ? 0.6 : 1, background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '8px' }}>
                                  {loading ? <Loader2 className="spin" size={16} /> : <XCircle size={16} />} Cancel / Refund
                                </button>
                            </div>
                         </motion.div>
                       )}
                   </div>

                   {/* Active Session Display */}
                   <div className="glass-panel" style={{ padding: '30px', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: activeSession ? 'rgba(34, 197, 94, 0.05)' : 'var(--glass-bg)' }}>
                        {activeSession ? (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                                <CheckCircle2 size={64} style={{ color: 'var(--success)', marginBottom: '15px', margin: '0 auto' }} />
                                <h2 style={{ color: 'var(--success)', marginBottom: '10px' }}>CHARGING ACTIVE</h2>
                                <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>{activeSession}</p>
                                <button className="btn-secondary" onClick={handleClearSession}>Dismiss Screen</button>
                            </motion.div>
                        ) : (
                            <div style={{ color: 'var(--text-secondary)' }}>
                                <BatteryCharging size={48} style={{ opacity: 0.3, marginBottom: '15px', margin: '0 auto' }} />
                                {scannedData ? <h3>Awaiting Operator</h3> : <h3>Hardware Idle</h3>}
                                <p>Awaiting validated check-in structures.</p>
                            </div>
                        )}
                   </div>
               </div>

               {/* Right Side Logging Array */}
               <div className="glass-panel" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
                   <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
                       <History size={20} /> Operations Log
                   </h3>
                   <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                       {logs.length === 0 ? (
                           <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '40px' }}>No logs recorded yet.</p>
                       ) : (
                           logs.map((log, index) => (
                               <div key={index} style={{ fontSize: '0.85rem', padding: '10px', borderRadius: '6px', background: 'rgba(0,0,0,0.02)', borderLeft: `3px solid ${log.type === 'error' ? 'var(--danger)' : log.type === 'success' ? 'var(--success)' : 'var(--accent-neon-blue)'}` }}>
                                   <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '4px' }}>[{log.time}]</div>
                                   <div style={{ color: log.type === 'error' ? 'var(--danger)' : 'var(--text-primary)' }}>{log.message}</div>
                               </div>
                           ))
                       )}
                   </div>
               </div>

           </motion.div>
        )}
      </div>
    </div>
  );
};

export default StationPortal;
