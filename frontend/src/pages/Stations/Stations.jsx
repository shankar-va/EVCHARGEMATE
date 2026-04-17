import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Battery, Calendar, Zap, ArrowRight, ShieldCheck, Search, Navigation, Map as MapIcon, Crosshair, Loader2 } from 'lucide-react';
import RouteMap from '../../components/Map/RouteMap';
import './Stations.css';

const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const scriptId = "razorpay-js-script";
    let script = document.getElementById(scriptId);

    if (script) {
      // Script already injected but window.Razorpay not ready yet (or blocked)
      script.addEventListener('load', () => resolve(true));
      script.addEventListener('error', () => resolve(false));
      return;
    }

    script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;

    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);

    document.body.appendChild(script);
  });
};

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

const AutocompleteInput = ({
  label,
  icon: Icon,
  mapClickToggled,
  onToggleMapClick,
  currentCoords,
  onSelect,
  query,
  setQuery,
  onUseCurrentLocation,
  useCurrentLocationLoading,
}) => {
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
          style={{ paddingRight: onUseCurrentLocation ? '90px' : '40px', background: 'transparent' }}
        />
        {onUseCurrentLocation && (
          <button
            type="button"
            title="Use Current Location"
            onClick={(e) => {
              e.preventDefault();
              onUseCurrentLocation();
            }}
            disabled={useCurrentLocationLoading}
            style={{
              position: 'absolute',
              right: '46px',
              top: '12px',
              background: 'transparent',
              border: 'none',
              color: useCurrentLocationLoading ? 'var(--text-secondary)' : 'var(--accent-neon-blue)',
              cursor: useCurrentLocationLoading ? 'not-allowed' : 'pointer',
            }}
          >
            {useCurrentLocationLoading ? <Loader2 size={18} className="spin" /> : <Crosshair size={20} />}
          </button>
        )}
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
  const [bookingValidationError, setBookingValidationError] = useState('');

  // Station details modal (covers: GET /api/stations/user/search/?externalStationId=...)
  const [stationDetailsOpen, setStationDetailsOpen] = useState(false);
  const [stationDetailsLoading, setStationDetailsLoading] = useState(false);
  const [stationDetailsError, setStationDetailsError] = useState('');
  const [stationDetailsData, setStationDetailsData] = useState(null);

  // QR check-in modal (covers: POST /api/qr/scan)
  const [qrCheckInOpen, setQrCheckInOpen] = useState(false);
  const [paidBooking, setPaidBooking] = useState(null);
  const [paidQrCode, setPaidQrCode] = useState(null);
  const [qrCheckInLoading, setQrCheckInLoading] = useState(false);
  const [qrCheckInError, setQrCheckInError] = useState('');
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [checkInConfirmOpen, setCheckInConfirmOpen] = useState(false);
  const [geoLoadingFor, setGeoLoadingFor] = useState(null); // 'source' | 'dest' | null
  const [geoError, setGeoError] = useState('');
  const { user, fetchUserData } = useAuth();

  const getTodayISO = () => new Date().toISOString().split('T')[0];
  const getNowHHMM = () => {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const isFutureSlot = (dateStr, startHHMM) => {
    if (!dateStr || !startHHMM) return false;
    const [h, m] = startHHMM.split(':').map(Number);
    const dt = new Date(`${dateStr}T00:00:00`);
    dt.setHours(h, m, 0, 0);
    return dt.getTime() > Date.now();
  };

  useEffect(() => {
    setLoading(true);
    setError('');

    const load = async () => {
      try {
        if (!navigator.geolocation) {
          setStations([]);
          setError('Geolocation is not supported by your browser.');
          return;
        }

        const pos = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000,
          });
        });

        const { latitude, longitude } = pos.coords;
        const res = await api.getStations(latitude, longitude, radius);
        setStations(res.data || res.stations || []);
      } catch (err) {
        setStations([]);
        setError(err.message || 'Unable to fetch your location. Please drop pins and calculate a route.');
      } finally {
        setLoading(false);
      }
    };

    load();
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

  const handleUseCurrentLocation = async (mode) => {
    setGeoError('');
    setGeoLoadingFor(mode);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser.');
      }

      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        });
      });

      const { latitude, longitude } = pos.coords;
      const coords = [latitude, longitude];

      const pretty = `Current Location: [${latitude.toFixed(2)}, ${longitude.toFixed(2)}]`;

      if (mode === 'source') {
        setSrcCoords(coords);
        setSrcQuery(pretty);
      } else if (mode === 'dest') {
        setDestCoords(coords);
        setDestQuery(pretty);
      }

      setClickMode('none');
    } catch (err) {
      // Geolocation errors: 1=PermissionDenied, 2=PositionUnavailable, 3=Timeout
      if (err?.code === 1) {
        setGeoError('Location permission denied. Please enable location permissions and try again.');
      } else {
        setGeoError(err?.message || 'Unable to get current location. Please try again.');
      }
    } finally {
      setGeoLoadingFor(null);
    }
  };

  const handleStationDetails = async (station) => {
    const stationId = station?.externalStationId || station?._id || station?.id;
    if (!stationId) return;

    setStationDetailsOpen(true);
    setStationDetailsLoading(true);
    setStationDetailsError('');
    setStationDetailsData(null);

    try {
      const res = await api.getStationDetails(stationId);
      const data = res.data || res.station || null;
      const normalized = Array.isArray(data) ? data[0] : data;
      setStationDetailsData(normalized || null);
    } catch (err) {
      setStationDetailsError(err.message || 'Failed to fetch station details.');
    } finally {
      setStationDetailsLoading(false);
    }
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
  setBookingValidationError('');

  if (!bookingDate || !bookingStartTime || !bookingEndTime) {
    setBookingValidationError('Please select date and time.');
    return;
  }

  if (!isFutureSlot(bookingDate, bookingStartTime)) {
    setBookingValidationError('Cannot select past time slots.');
    return;
  }

  setBookingLoading(true);

  try {
    const scriptLoaded = await loadRazorpay();

    if (!scriptLoaded) {
      alert("Razorpay failed to load ❌");
      return;
    }

    const data = await api.createBooking({
      stationId: selectedStation._id || selectedStation.externalStationId,
      date: bookingDate,
      startTime: bookingStartTime,
      endTime: bookingEndTime,
      units: bookingUnits
    });

    if (!data.order) throw new Error("Booking failed");

    const options = {
      key: "rzp_test_SVQ4XAJ7F8kFzz",
      amount: data.order.amount,
      currency: "INR",
      name: "EV-ChargeMate",
      description: "Booking Payment",
      order_id: data.order.id,

      handler: async function (response) {
        const verifyRes = await api.verifyPayment(response);

        if (!verifyRes.success) {
          alert("Payment verification failed");
          return;
        }

        setPaidBooking(verifyRes.booking);
        setPaidQrCode(verifyRes.qrCode);
        setPaymentVerified(true);
        setQrCheckInOpen(true);
        setSelectedStation(null);
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error(err);
    alert("Payment error");
  } finally {
    setBookingLoading(false);
  }
};
  
  const handleQrCheckIn = async () => {
  if (!paidBooking?._id) {
    setQrCheckInError('Missing booking');
    return;
  }

  setQrCheckInLoading(true);
  setQrCheckInError('');

  try {
    const stationId = localStorage.getItem("stationId");
    const stationSecret = localStorage.getItem("stationSecret");

    if (!stationId || !stationSecret) {
      throw new Error("Station not initialized");
    }

    const res = await api.confirmQR({
      bookingId: paidBooking._id,
      stationId,
      stationSecret
    });

    if (fetchUserData) {
      await fetchUserData();
    }

    setQrCheckInOpen(false);
    setPaidBooking(null);
    setPaidQrCode(null);
    setPaymentVerified(false);

    alert(res.message || "Charging started");

  } catch (err) {
    setQrCheckInError(err.message || "Check-in failed");
  } finally {
    setQrCheckInLoading(false);
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
            onStationDetails={handleStationDetails}
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
              onUseCurrentLocation={() => handleUseCurrentLocation('source')}
              useCurrentLocationLoading={geoLoadingFor === 'source'}
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
              onUseCurrentLocation={() => handleUseCurrentLocation('dest')}
              useCurrentLocationLoading={geoLoadingFor === 'dest'}
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

          {geoError && <p className="error-text" style={{ marginTop: '1rem', color: 'var(--danger)' }}>{geoError}</p>}
          {error && <p className="error-text" style={{ marginTop: geoError ? '0.5rem' : '1rem', color: 'var(--danger)' }}>{error}</p>}
        </div>

        <div className="station-results-container">
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.2rem', fontWeight: 600 }}>
            {loading && stations.length === 0
              ? 'Loading stations...'
              : stations.length > 0
                ? `${stations.length} Map Waypoints Found`
                : 'No stations in this area.'}
          </h4>
          {loading && stations.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '24px 0' }}>
              Please wait while we load nearby charging stations.
            </div>
          )}
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
                <input
                  type="date"
                  value={bookingDate}
                  min={getTodayISO()}
                  onChange={(e) => {
                    setBookingDate(e.target.value);
                    setBookingValidationError('');
                    // If user switches to today and start time is in the past, auto-bump to now
                    if (e.target.value === getTodayISO() && bookingStartTime < getNowHHMM()) {
                      setBookingStartTime(getNowHHMM());
                    }
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="input-group" style={{ flexDirection: 'column', alignItems: 'flex-start', flex: 1, background: 'transparent', border: 'none' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Start Time</label>
                  <input
                    type="time"
                    value={bookingStartTime}
                    min={bookingDate === getTodayISO() ? getNowHHMM() : undefined}
                    onChange={(e) => {
                      const v = e.target.value;
                      setBookingStartTime(v);
                      setBookingValidationError('');
                      if (bookingDate === getTodayISO() && v < getNowHHMM()) {
                        setBookingValidationError('Cannot select past time slots.');
                      }
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                  />
                </div>
                <div className="input-group" style={{ flexDirection: 'column', alignItems: 'flex-start', flex: 1, background: 'transparent', border: 'none' }}>
                  <label style={{ fontSize: '13px', fontWeight: 'bold' }}>End Time</label>
                  <input
                    type="time"
                    value={bookingEndTime}
                    min={bookingStartTime || (bookingDate === getTodayISO() ? getNowHHMM() : undefined)}
                    onChange={(e) => {
                      setBookingEndTime(e.target.value);
                      setBookingValidationError('');
                    }}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                  />
                </div>
              </div>

              <div className="input-group" style={{ flexDirection: 'column', alignItems: 'flex-start', background: 'transparent', border: 'none' }}>
                <label style={{ fontSize: '13px', fontWeight: 'bold' }}>Estimated Units (kWh)</label>
                <input type="number" value={bookingUnits} onChange={(e) => setBookingUnits(Number(e.target.value))} min="1" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }} />
              </div>
            </div>

            {bookingValidationError && (
              <p style={{ marginBottom: 14, color: 'var(--danger)', fontWeight: 800 }}>
                {bookingValidationError}
              </p>
            )}

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

      {/* Station details modal */}
      {stationDetailsOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.className === 'modal-overlay') {
              setStationDetailsOpen(false);
              setStationDetailsData(null);
              setStationDetailsError('');
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="booking-modal glass-panel"
          >
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Station Details</h2>

            {stationDetailsLoading ? (
              <p style={{ color: 'var(--text-secondary)' }}>Loading station...</p>
            ) : stationDetailsError ? (
              <p style={{ color: 'var(--danger)', fontWeight: 700 }}>{stationDetailsError}</p>
            ) : stationDetailsData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {stationDetailsData.companyName || stationDetailsData.name || 'EV Hub'}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 13 }}>
                    {stationDetailsData.address || 'Location Details N/A'}
                  </div>
                </div>

                <div className="station-detail-grid" style={{ marginBottom: 0, padding: 0 }}>
                  <div className="detail-item">
                    <span className="detail-label">Operator</span>
                    <span className="detail-value">{stationDetailsData.operator || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Power (kW)</span>
                    <span className="detail-value">{stationDetailsData.powerKW ? `${stationDetailsData.powerKW} kW` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Rating</span>
                    <span className="detail-value">{stationDetailsData.rating ? `⭐ ${stationDetailsData.rating}/5` : '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Price (₹/kWh)</span>
                    <span className="detail-value">{stationDetailsData.pricePerUnit ?? '-'}</span>
                  </div>
                </div>

                <div>
                  <div className="detail-label" style={{ marginBottom: 8 }}>Connectors</div>
                  <div>
                    {(stationDetailsData.connectors || []).length > 0 ? (
                      stationDetailsData.connectors.map((c, idx) => (
                        <span key={`${c}-${idx}`} className="connector-chip">{c}</span>
                      ))
                    ) : (
                      <span className="connector-chip">Standard</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No station details found.</p>
            )}

            <div className="modal-actions" style={{ marginTop: 18 }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setStationDetailsOpen(false);
                  setStationDetailsData(null);
                  setStationDetailsError('');
                }}
                disabled={stationDetailsLoading}
                style={{ flex: 1 }}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Cryptographic Payment Confirmation UI */}
      {qrCheckInOpen && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.className === 'modal-overlay') {
              setQrCheckInOpen(false);
              setPaidBooking(null);
              setPaidQrCode(null);
              setQrCheckInError('');
              setPaymentVerified(false);
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="booking-modal glass-panel"
            style={{ maxWidth: 600, textAlign: 'center' }}
          >
            <h2 style={{ color: 'var(--text-primary)', marginBottom: '10px' }}>Cryptographic Access Token</h2>
            <p className="modal-desc" style={{ marginBottom: 16 }}>
              Payment successfully validated. Hand over this AES-encrypted payload to the Station Operator exclusively.
            </p>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 700, marginTop: -6, marginBottom: 14 }}>
              {paymentVerified ? 'Booking Confirmed Securely' : 'Payment pending'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
              {paidQrCode ? (
                <img
                  src={paidQrCode}
                  alt="QR Code"
                  style={{ width: 350, height: 350, borderRadius: 14, background: 'white', padding: 8, objectFit: 'contain' }}
                />
              ) : (
                <div className="qr-placeholder" style={{ height: 350, width: 350 }}>
                  <p style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>QR not available</p>
                </div>
              )}

              {paidBooking && (
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px', width: '100%', textAlign: 'left' }}>
                  <p><b>Station Operator:</b> {paidBooking.companyName || paidBooking.stationId || '-'}</p>
                  <p><b>Reservation Date:</b> {paidBooking.date || '-'}</p>
                  <p><b>Global Ledger Key:</b> {paidBooking._id || '-'}</p>
                </div>
              )}
            </div>

            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'center', marginTop: '25px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setQrCheckInOpen(false);
                  setPaidBooking(null);
                  setPaidQrCode(null);
                  setQrCheckInError('');
                  setPaymentVerified(false);
                }}
                disabled={qrCheckInLoading}
                style={{ minWidth: '200px' }}
              >
                Close / Return 
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Stations;
