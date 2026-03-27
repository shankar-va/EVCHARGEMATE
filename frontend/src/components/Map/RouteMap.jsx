import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zap } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Create custom SVG markers
const createCustomIcon = (color, bg = 'var(--bg-dark)') => {
  const iconMarkup = renderToStaticMarkup(
    <div style={{
      background: bg,
      border: `2px solid ${color}`,
      borderRadius: '50%',
      width: '30px', 
      height: '30px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: `0 0 10px ${color}`
    }}>
      <Zap size={16} color={color} />
    </div>
  );
  return L.divIcon({
    html: iconMarkup,
    className: 'custom-leaflet-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

const stationIcon = createCustomIcon('var(--text-primary)', 'var(--bg-dark-secondary)');

const MapClickProcessor = ({ onClickMode, onLocationSelected }) => {
  useMapEvents({
    click(e) {
      if (onClickMode !== 'none') {
        const { lat, lng } = e.latlng;
        onLocationSelected(onClickMode, [lat, lng]);
      }
    }
  });
  return null;
};

// Prevents standard map-scroll layout trapping, but intelligently allows pure "Pinch-To-Zoom" (ctrlKey trackpad wheels)
const PinchZoomHandler = () => {
  const map = useMap();
  useEffect(() => {
    map.scrollWheelZoom.disable(); // Ensure standard scroll traps are absolutely dead
    
    let zoomTimeout;
    const handleWheel = (e) => {
      // Browsers register trackpad "pinches" strictly as wheel events with ctrlKey=true
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault(); // Stop the entire browser website from zooming in!
        
        if (!zoomTimeout) {
          const delta = e.deltaY > 0 ? -1 : 1;
          map.setZoom(map.getZoom() + delta, { animate: true });
          zoomTimeout = setTimeout(() => { zoomTimeout = null; }, 100); 
        }
      }
    };
    const container = map.getContainer();
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [map]);
  return null;
};

const MapUpdater = ({ srcCoords, destCoords, routePoints, stations }) => {
  const map = useMap();
  useEffect(() => {
    if (routePoints && routePoints.length > 0) {
      const bounds = L.latLngBounds(routePoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (srcCoords && !destCoords) {
      map.setView(srcCoords, 13);
    } else if (srcCoords && destCoords) {
      const bounds = L.latLngBounds([srcCoords, destCoords]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (stations && stations.length > 0) {
      const bounds = L.latLngBounds(stations.map(s => [
        s.latitude || s.location?.coordinates[1],
        s.longitude || s.location?.coordinates[0]
      ]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [srcCoords, destCoords, routePoints, stations, map]);
  return null;
};

const getClosestPoint = (lat, lng, routePoints) => {
  if (!routePoints || routePoints.length === 0) return [lat, lng];
  let minDiff = Infinity;
  let closest = routePoints[0];
  for (let pt of routePoints) {
    const diff = Math.pow(pt[0] - lat, 2) + Math.pow(pt[1] - lng, 2);
    if (diff < minDiff) {
      minDiff = diff;
      closest = pt;
    }
  }
  return closest;
};

const RouteMap = ({ srcCoords, destCoords, routePoints, allStations, paginatedStations, onStationClick, clickMode, onMapLocationSelect }) => {
  const [subRoutes, setSubRoutes] = useState({}); // mapped by station ID

  // Autocalculate OSRM Sub-routes strictly for paginated stations to secure API limits
  useEffect(() => {
    if (!paginatedStations || !routePoints || routePoints.length === 0) return;
    
    // Wipe old subroutes when page flips
    setSubRoutes({});

    const fetchSubRoutes = async () => {
      const newSubRoutes = {};
      for (let station of paginatedStations) {
        // Build foolproof keys
        const id = station._id || station.externalStationId;
        const lat = station.latitude || (station.location && station.location.coordinates[1]);
        const lng = station.longitude || (station.location && station.location.coordinates[0]);
        if (!lat || !lng || !id) continue;

        const closestNode = getClosestPoint(lat, lng, routePoints);
        
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${closestNode[1]},${closestNode[0]};${lng},${lat}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data && data.routes && data.routes[0]) {
            newSubRoutes[id] = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
          } else {
            newSubRoutes[id] = [closestNode, [lat, lng]]; // Solid straight if blocked
          }
        } catch (e) {
          newSubRoutes[id] = [closestNode, [lat, lng]];
        }
      }
      setSubRoutes(newSubRoutes);
    };

    fetchSubRoutes();
  }, [paginatedStations, routePoints]);

  return (
    <div style={{ height: '500px', width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
      <MapContainer 
        center={[20.5937, 78.9629]} 
        zoom={5} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        />

        <MapClickProcessor onClickMode={clickMode} onLocationSelected={onMapLocationSelect} />
        <PinchZoomHandler />

        {/* Core Highway Polyline */}
        {routePoints && routePoints.length > 0 && (
          <Polyline 
            positions={routePoints} 
            color="var(--accent-neon-blue)" 
            weight={6} 
            opacity={0.8}
          />
        )}

        {/* Realistic Station Exits purely for active paginated view */}
        {Object.entries(subRoutes).map(([id, route], idx) => {
          if (!route) return null;
          return (
            <Polyline 
              key={`subroute-${id}-${idx}`}
              positions={route} 
              color="orange" 
              weight={5} 
              opacity={1}
              dashArray={route.length === 2 ? '5,10' : null} 
            />
          );
        })}

        {srcCoords && (
          <Marker position={srcCoords} icon={createCustomIcon('#3b82f6', '#fff')}>
            <Popup>Source</Popup>
          </Marker>
        )}

        {destCoords && (
          <Marker position={destCoords} icon={createCustomIcon('#ef4444', '#fff')}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {/* Base Map Points for globally found stations */}
        {allStations?.map((station, idx) => {
          const lat = station.latitude || (station.location && station.location.coordinates[1]);
          const lng = station.longitude || (station.location && station.location.coordinates[0]);
          if (!lat || !lng) return null;

          return (
            <Marker key={station.id || station._id || idx} position={[lat, lng]} icon={stationIcon} eventHandlers={{ click: () => onStationClick && onStationClick(station) }}>
              <Popup>
                <div style={{ color: '#000', fontWeight: 'bold' }}>
                  {station.companyName || station.name || 'Charging Station'}
                  <br />
                  <button onClick={() => onStationClick && onStationClick(station)} style={{ marginTop: '5px', padding: '4px 8px', background: 'var(--accent-neon-blue)', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>View Details</button>
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <MapUpdater srcCoords={srcCoords} destCoords={destCoords} routePoints={routePoints} stations={allStations} />
      </MapContainer>
    </div>
  );
};

export default RouteMap;
