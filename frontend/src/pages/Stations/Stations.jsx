import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Battery, Calendar, Zap, ArrowRight, ShieldCheck, Search, Navigation, Map as MapIcon } from 'lucide-react';
import RouteMap from '../../components/Map/RouteMap';
import './Stations.css';

// Nominatim Geocoding API Backup
const geocode = async (query) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (e) { }
  return null;
};

// Autocomplete Hook
const useNominatimAutocomplete = (query) => {
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 3) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
        const data = await res.json();
        setSuggestions(data);
      } catch (err) {
        console.error("Autocomplete failed:", err);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  return { suggestions, setSuggestions };
};

const fetchRouteLine = async (src, dest) => {
  try {
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${src[1]},${src[0]};${dest[1]},${dest[0]}?overview=full&geometries=geojson`);
    const data = await res.json();
    if (data && data.routes && data.routes[0]) {
      return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
    }
  } catch (err) {
    console.error("OSRM failed", err);
  }
  return [src, dest];
};

const AutocompleteInput = ({ label, icon: Icon, mapClickToggled, onToggleMapClick, currentCoords, onSelect, query, setQuery }) => {
  const { suggestions, setSuggestions } = useNominatimAutocomplete(query);
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (currentCoords) {
      setDisplayValue(`Selected: [${currentCoords[0].toFixed(2)}, ${currentCoords[1].toFixed(2)}]`);
    } else {
      setDisplayValue('');
    }
  }, [currentCoords]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [suggestions]);

  const handleKeyDown = (e) => {
    if (!suggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const s = suggestions[selectedIndex];
        const coords = [parseFloat(s.lat), parseFloat(s.lon)];
        setDisplayValue(s.display_name);
        setQuery(s.display_name);
        setSuggestions([]);
        onSelect(coords);
        e.target.blur();
      }
    }
  };

  return (
    <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>{label}</label>
      <div className="input-group" style={{ marginBottom: '5px' }}>
        <div className="input-icon"><Icon size={20} /></div>
        <input
          type="text"
          placeholder={`Search ${label}...`}
          value={isFocused ? query : (displayValue || query)}
          onChange={e => {
            setQuery(e.target.value);
            setDisplayValue('');
            onSelect(null);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          style={{ paddingRight: '40px', background: 'transparent' }}
        />
        <button
          type="button"
          title="Pick from Map"
          onClick={(e) => { e.preventDefault(); onToggleMapClick(); }}
          style={{ position: 'absolute', right: '10px', top: '12px', background: 'transparent', border: 'none', color: mapClickToggled ? 'var(--accent-neon-blue)' : 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <MapIcon size={20} />
        </button>
      </div>

      {isFocused && suggestions.length > 0 && (
        <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--bg-dark)', border: '1px solid var(--glass-border)', borderRadius: '8px', zIndex: 50, listStyle: 'none', padding: 0, margin: 0, boxShadow: 'var(--glass-shadow)', maxHeight: '250px', overflowY: 'auto' }}>
          {suggestions.map((s, i) => (
            <li
              key={i}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => {
                const coords = [parseFloat(s.lat), parseFloat(s.lon)];
                setDisplayValue(s.display_name);
                setQuery(s.display_name);
                setSuggestions([]);
                onSelect(coords);
              }}
              style={{
                padding: '10px', 
                borderBottom: '1px solid var(--glass-border)', 
                cursor: 'pointer', 
                color: 'var(--text-primary)', 
                fontSize: '13px',
                background: selectedIndex === i ? 'rgba(37, 99, 235, 0.1)' : 'transparent'
              }}
            >
              {s.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Haversine Distance Calc
const haversineDistance = (coords1, coords2) => {
  const toRad = p => p * Math.PI / 180;
  const R = 6371; // km
  const dLat = toRad(coords2[0] - coords1[0]);
  const dLon = toRad(coords2[1] - coords1[1]);
  const lat1 = toRad(coords1[0]);
  const lat2 = toRad(coords2[0]);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

const Stations = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [srcQuery, setSrcQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');

  const [srcCoords, setSrcCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);
  const [routeLine, setRouteLine] = useState(null);

  const [radius, setRadius] = useState(50);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Map click interaction state
  const [clickMode, setClickMode] = useState('none'); // 'none', 'source', 'dest'

  // Booking Modal
  const [selectedStation, setSelectedStation] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingStartTime, setBookingStartTime] = useState('10:00');
  const [bookingEndTime, setBookingEndTime] = useState('11:00');
  const [bookingUnits, setBookingUnits] = useState(10);
  const [bookingLoading, setBookingLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setLoading(true);
    api.getStations()
      .then(data => setStations(data.stations || data.data || []))
      .catch()
      .finally(() => setLoading(false));
  }, []);

  const handleRouteSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    let finalSrc = srcCoords;
    let finalDest = destCoords;

    try {
      if (!finalSrc && srcQuery) {
        finalSrc = await geocode(srcQuery);
        if (finalSrc) setSrcCoords(finalSrc);
      }
      if (!finalDest && destQuery) {
        finalDest = await geocode(destQuery);
        if (finalDest) setDestCoords(finalDest);
      }

      if (!finalSrc || !finalDest) {
        throw new Error("Could not compute source and destination correctly. Try dropping a map pin!");
      }

      const roadGeometry = await fetchRouteLine(finalSrc, finalDest);
      setRouteLine(roadGeometry);

      const res = await api.getStationRoutes(finalSrc[0], finalSrc[1], finalDest[0], finalDest[1], radius, 1000);
      if (res.success && res.data) {
        // Recalculate straight distance from source origin naturally
        const updatedStations = res.data.map(st => {
          const lat = st.latitude || (st.location && st.location.coordinates[1]);
          const lng = st.longitude || (st.location && st.location.coordinates[0]);
          return {
            ...st,
            distance: haversineDistance(finalSrc, [lat, lng]) // Save directly in km natively
          };
        }).sort((a,b) => a.distance - b.distance); // Sort smoothly by distance from start naturally!
        setStations(updatedStations);
        setCurrentPage(1); // Auto reset pagination
      } else {
        setStations([]);
      }
    } catch (err) {
      setError(err.message || "Failed to route search.");
    } finally {
      setLoading(false);
    }
  };

  const handleMapSelection = (mode, coords) => {
    if (mode === 'source') {
      setSrcCoords(coords);
      setSrcQuery(`Map Pin: [${coords[0].toFixed(2)}, ${coords[1].toFixed(2)}]`);
    }
    if (mode === 'dest') {
      setDestCoords(coords);
      setDestQuery(`Map Pin: [${coords[0].toFixed(2)}, ${coords[1].toFixed(2)}]`);
    }
    setClickMode('none');
  };

  const handleBookingClick = (station) => {
    if (!user) {
      alert("Please login to book a slot.");
      return;
    }
    setSelectedStation(station);
    setBookingDate(new Date().toISOString().split('T')[0]);
  };

  const handleMapPinClick = (station) => {
    const stationId = station._id || station.externalStationId || station.id;
    const stationIndex = stations.findIndex(s => (s._id || s.externalStationId || s.id) === stationId);
    
    if (stationIndex === -1) return;

    const targetPage = Math.floor(stationIndex / itemsPerPage) + 1;

    if (currentPage !== targetPage) {
      setCurrentPage(targetPage);
      setTimeout(() => {
        const el = document.getElementById(`station-${stationId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150); // Let React render the new page elements first
    } else {
      const el = document.getElementById(`station-${stationId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handlePayment = async () => {
    if (!bookingDate || !bookingStartTime || !bookingEndTime) return alert("Select all date and time parameters.");
    setBookingLoading(true);
    try {
      const data = await api.createBooking({
        stationId: selectedStation._id || selectedStation.externalStationId,
        date: bookingDate,
        startTime: bookingStartTime,
        endTime: bookingEndTime,
        units: bookingUnits
      });
      if (!data.order) throw new Error(data.message || "Booking creation failed.");

      const options = {
        key: "rzp_test_SVQ4XAJ7F8kFzz",
        amount: data.order.amount,
        currency: "INR",
        name: "EV-ChargeMate",
        description: `Booking at ${selectedStation.companyName || selectedStation.name || 'EV Station'}`,
        order_id: data.order.id,
        handler: async function (response) {
          try {
            const verifyRes = await api.verifyPayment(response);
            if (verifyRes.qrCode || verifyRes.booking?.qrCode || verifyRes.success) {
              alert("Payment Successful! Slot verified completely.");
              setSelectedStation(null);
            }
          } catch (err) {
            alert("Payment verification failed.");
          }
        },
        theme: { color: "#2563eb" } 
      };
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) { alert("Payment failed."); });
      rzp.open();
    } catch (err) {
      alert(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  const totalPages = Math.ceil(stations.length / itemsPerPage);
  const paginatedStations = stations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="stations-container">
      <div className="stations-header text-center max-w-2xl mx-auto">
        <h1 className="section-title" style={{ color: 'var(--text-primary)' }}>En Route. <span className="text-secondary" style={{ color: 'var(--accent-neon-blue)' }}>On Point.</span></h1>
        <p style={{ color: 'var(--text-secondary)' }}>Type a city or drop a pin directly on the map to start planning.</p>
      </div>

      <div className="route-planner-grid">
        <div className="map-panel">
          <RouteMap
            srcCoords={srcCoords}
            destCoords={destCoords}
            routePoints={routeLine}
            allStations={stations}
            paginatedStations={paginatedStations}
            onStationClick={handleMapPinClick}
            clickMode={clickMode}
            onMapLocationSelect={handleMapSelection}
          />
        </div>

        <div className="search-panel glass-panel">
          <h3>Configure Journey Parameters</h3>
          {clickMode !== 'none' && (
            <div style={{ background: 'var(--accent-neon-blue)', color: 'white', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '14px', textAlign: 'center', animation: 'pulse 2s infinite' }}>
              Click anywhere on the map to drop the {clickMode === 'source' ? 'Source' : 'Destination'} pin!
            </div>
          )}

          <form className="route-form">
            <AutocompleteInput
              label="Source Origin"
              icon={MapPin}
              mapClickToggled={clickMode === 'source'}
              onToggleMapClick={() => setClickMode(clickMode === 'source' ? 'none' : 'source')}
              currentCoords={srcCoords}
              onSelect={(coords) => setSrcCoords(coords)}
              query={srcQuery}
              setQuery={setSrcQuery}
            />
            <AutocompleteInput
              label="Destination Point"
              icon={Navigation}
              mapClickToggled={clickMode === 'dest'}
              onToggleMapClick={() => setClickMode(clickMode === 'dest' ? 'none' : 'dest')}
              currentCoords={destCoords}
              onSelect={(coords) => setDestCoords(coords)}
              query={destQuery}
              setQuery={setDestQuery}
            />

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="input-group" style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start', background: 'transparent', border: 'none' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Search Radius (km)</label>
                <input 
                  type="number" 
                  value={radius} 
                  onChange={e => setRadius(Number(e.target.value))} 
                  min="1" 
                  style={{ padding: '0.8rem 1rem', width: '100%', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}
                />
              </div>
              <div className="input-group" style={{ flex: 1, flexDirection: 'column', alignItems: 'flex-start', background: 'transparent', border: 'none' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>Stations Per Page</label>
                <input 
                  type="number" 
                  value={itemsPerPage} 
                  onChange={e => { setItemsPerPage(Number(e.target.value) || 10); setCurrentPage(1); }} 
                  min="1" 
                  max="50"
                  style={{ padding: '0.8rem 1rem', width: '100%', border: '1px solid var(--glass-border)', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }}
                />
              </div>
            </div>

            <button type="button" onClick={handleRouteSearch} className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Routing...' : 'Calculate Journey Map'}
            </button>
          </form>

          {error && <p className="error-text" style={{ marginTop: '1rem', color: 'var(--danger)' }}>{error}</p>}
        </div>

        <div className="station-results-container">
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 600 }}>
            {stations.length > 0 ? `${stations.length} Map Waypoints Found` : 'No stations in this area.'}
          </h4>
          <div className="stations-mini-stack">
            {paginatedStations.map((st, i) => (
              <div key={st._id || st.externalStationId || i} id={`station-${st._id || st.externalStationId || st.id}`} className="station-detail-card">
                <div className="station-detail-header">
                  <div>
                    <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.3rem' }}>{st.companyName || st.name || 'EV Hub'}</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>{st.address || 'Location Details N/A'}</p>
                  </div>
                  <button className="btn-primary btn-sm" onClick={() => handleBookingClick(st)}>Book Slot</button>
                </div>

                <div className="station-detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">City</span>
                    <span className="detail-value">{st.city || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Power (kW)</span>
                    <span className="detail-value">{st.powerKW ? `${st.powerKW} kW` : 'Standard'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Rating</span>
                    <span className="detail-value">{st.rating ? `⭐ ${st.rating}/5` : 'New'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Driving Distance</span>
                    <span className="detail-value">{st.distance ? `${st.distance.toFixed(2)} km` : '-'}</span>
                  </div>
                </div>

                <div className="station-connectors">
                  <span className="detail-label" style={{ display: 'block', marginBottom: '8px' }}>Available Connectors</span>
                  <div>
                    {st.connectors && st.connectors.length > 0 ? (
                      st.connectors.map((c, cIdx) => (
                        <span key={cIdx} className="connector-chip">{c}</span>
                      ))
                    ) : (
                      <span className="connector-chip">Standard Type 2</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', padding: '1rem', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span style={{ fontWeight: '600', color: 'var(--text-secondary)' }}>Page {currentPage} of {totalPages}</span>
              <button 
                className="btn-primary" 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                style={{ padding: '12px 24px' }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fully Restored Booking Modal Component */}
      {selectedStation && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target.className === 'modal-overlay') setSelectedStation(null);
        }}>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="booking-modal glass-panel"
          >
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Secure Slot Reservation</h2>
            <p className="modal-desc" style={{ marginBottom: '15px' }}>
              Reserve your charging module at <b style={{ color: 'var(--text-primary)' }}>{selectedStation.companyName || selectedStation.name || 'EV Hub'}</b>.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              <div className="input-group" style={{ flexDirection: 'column', alignItems: 'flex-start', background: 'transparent', border: 'none' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Reservation Date</label>
                <input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="input-group" style={{ flexDirection: 'column', alignItems: 'flex-start', flex: 1, background: 'transparent', border: 'none' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Start Time</label>
                  <input type="time" value={bookingStartTime} onChange={(e) => setBookingStartTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                </div>
                <div className="input-group" style={{ flexDirection: 'column', alignItems: 'flex-start', flex: 1, background: 'transparent', border: 'none' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>End Time</label>
                  <input type="time" value={bookingEndTime} onChange={(e) => setBookingEndTime(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
                </div>
              </div>

              <div className="input-group" style={{ flexDirection: 'column', alignItems: 'flex-start', background: 'transparent', border: 'none' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Estimated Units (kWh)</label>
                <input type="number" value={bookingUnits} onChange={(e) => setBookingUnits(Number(e.target.value))} min="1" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
              </div>
            </div>

            <div className="modal-actions" style={{ display: 'flex', gap: '15px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setSelectedStation(null)} 
                disabled={bookingLoading}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handlePayment} 
                disabled={bookingLoading}
                style={{ flex: 2, background: 'var(--accent-neon-blue)', color: 'white' }}
              >
                {bookingLoading ? 'Processing Request...' : 'Proceed To Checkout'} <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Stations;
