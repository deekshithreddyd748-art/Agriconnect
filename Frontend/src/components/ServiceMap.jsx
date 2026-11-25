import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { hasValidCoords } from '../utils/distance';

const TYPE_COLORS = {
  equipment: '#1B4332',
  labour: '#D97706',
  facility: '#0284C7',
};

function createCircleIcon(color, label) {
  return L.divIcon({
    className: 'custom-agri-pin',
    html: `<div style="background:${color};color:#fff;width:30px;height:30px;border-radius:9999px;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.28);">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

export default function ServiceMap({
  items = [],
  userCoords = null,
  radiusKm = 15,
  height = '440px',
  defaultType = 'equipment',
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter = hasValidCoords(userCoords)
      ? [Number(userCoords.lat), Number(userCoords.lng)]
      : [18.1517, 74.5777];

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 11,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;
    layerGroupRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerGroupRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerGroupRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const bounds = [];

    if (hasValidCoords(userCoords)) {
      const center = [Number(userCoords.lat), Number(userCoords.lng)];
      bounds.push(center);

      L.marker(center, {
        icon: createCircleIcon('#DC2626', 'Me'),
      })
        .bindPopup('<strong>Your Selected Location</strong>')
        .addTo(layer);

      if (radiusKm > 0) {
        L.circle(center, {
          radius: radiusKm * 1000,
          color: '#2D6A4F',
          fillColor: '#52B788',
          fillOpacity: 0.12,
          weight: 1.5,
        }).addTo(layer);
      }
    }

    items.forEach((item) => {
      if (!hasValidCoords(item.location)) return;
      const point = [Number(item.location.lat), Number(item.location.lng)];
      bounds.push(point);

      const type = item.serviceType || defaultType;
      const badge = type === 'equipment' ? 'M' : type === 'labour' ? 'L' : 'F';
      const detailPath =
        type === 'equipment'
          ? `/machinery/${item._id}`
          : type === 'labour'
            ? `/labour/${item._id}`
            : `/facilities/${item._id}`;

      const title = item.displayTitle || item.name || item.title || item.category;
      const distanceHtml =
        item.distanceKm !== null && item.distanceKm !== undefined
          ? `<div style="color:#1B4332;font-weight:600;margin-top:2px;">${item.distanceKm} km away</div>`
          : '';

      const popupHtml = `
        <div style="min-width:170px;font-family:sans-serif;">
          <div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;">${item.category || type}</div>
          <div style="font-size:14px;font-weight:700;color:#0f172a;margin:2px 0;">${title}</div>
          <div style="font-size:12px;color:#475569;">${item.location?.village || ''} ${item.location?.district || ''}</div>
          ${distanceHtml}
          <a href="${detailPath}" style="display:inline-block;margin-top:8px;padding:4px 10px;background:#1B4332;color:#fff;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;">View Details</a>
        </div>
      `;

      L.marker(point, {
        icon: createCircleIcon(TYPE_COLORS[type] || '#1B4332', badge),
      })
        .bindPopup(popupHtml)
        .addTo(layer);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
    }
  }, [items, userCoords, radiusKm, defaultType]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded-2xl border border-earth-200 overflow-hidden shadow-sm bg-earth-100"
    />
  );
}

/**
 * Interactive click-to-pick map for setting coordinates without typing lat/lng.
 */
export function LocationPickerMap({ lat, lng, onSelect, height = '240px' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const valid = hasValidCoords({ lat, lng });
    const center = valid ? [Number(lat), Number(lng)] : [18.1517, 74.5777];

    const map = L.map(containerRef.current, { center, zoom: valid ? 12 : 7 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    if (valid) {
      markerRef.current = L.marker(center, {
        icon: createCircleIcon('#1B4332', '★'),
      }).addTo(map);
    }

    map.on('click', (e) => {
      const pickedLat = Number(e.latlng.lat.toFixed(5));
      const pickedLng = Number(e.latlng.lng.toFixed(5));
      if (markerRef.current) {
        markerRef.current.setLatLng([pickedLat, pickedLng]);
      } else {
        markerRef.current = L.marker([pickedLat, pickedLng], {
          icon: createCircleIcon('#1B4332', '★'),
        }).addTo(map);
      }
      onSelect(pickedLat, pickedLng);
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (hasValidCoords({ lat, lng })) {
      const pos = [Number(lat), Number(lng)];
      if (markerRef.current) {
        markerRef.current.setLatLng(pos);
      } else {
        markerRef.current = L.marker(pos, {
          icon: createCircleIcon('#1B4332', '★'),
        }).addTo(mapRef.current);
      }
      mapRef.current.setView(pos, 12);
    }
  }, [lat, lng]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded-xl border border-earth-200 overflow-hidden bg-earth-100"
    />
  );
}
