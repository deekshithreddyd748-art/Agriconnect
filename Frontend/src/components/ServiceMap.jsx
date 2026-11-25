import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';
import { formatNumber, hasValidCoords } from '../utils/distance';

const TYPE_COLORS = {
  equipment: '#14532D',
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
  const { t, i18n } = useTranslation();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerGroupRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialCenter = hasValidCoords(userCoords)
      ? [Number(userCoords.lat), Number(userCoords.lng)]
      : [20.5937, 78.9629];

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: hasValidCoords(userCoords) ? 11 : 5,
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
        icon: createCircleIcon('#DC2626', '•'),
      })
        .bindPopup(`<strong>${t('gps.locationSavedChip')}</strong>`)
        .addTo(layer);

      if (radiusKm > 0) {
        L.circle(center, {
          radius: radiusKm * 1000,
          color: '#22C55E',
          fillColor: '#22C55E',
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
      const distNum =
        item.distanceKm !== null && item.distanceKm !== undefined
          ? formatNumber(item.distanceKm, i18n.language, { maximumFractionDigits: 1 })
          : null;
      const distanceHtml =
        distNum !== null
          ? `<div style="color:#14532D;font-weight:600;margin-top:2px;">${t('common.kmAway', {
              distance: distNum,
            })}</div>`
          : '';

      const catLabel = t(
        `categories.${type === 'facility' ? 'facility' : type}.${item.category}`,
        item.category || type
      );

      const popupHtml = `
        <div style="min-width:170px;font-family:sans-serif;">
          <div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:700;">${catLabel}</div>
          <div style="font-size:14px;font-weight:700;color:#0f172a;margin:2px 0;">${title}</div>
          <div style="font-size:12px;color:#475569;">${item.location?.village || ''} ${item.location?.district || ''}</div>
          ${distanceHtml}
          <a href="${detailPath}" style="display:inline-block;margin-top:8px;padding:4px 10px;background:#14532D;color:#fff;border-radius:6px;text-decoration:none;font-size:12px;font-weight:600;">${t('common.viewDetails')}</a>
        </div>
      `;

      L.marker(point, {
        icon: createCircleIcon(TYPE_COLORS[type] || '#14532D', badge),
      })
        .bindPopup(popupHtml)
        .addTo(layer);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [36, 36], maxZoom: 13 });
    }
  }, [items, userCoords, radiusKm, defaultType, i18n.language, t]);

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded-2xl border border-earth-200 overflow-hidden shadow-sm bg-earth-100"
    />
  );
}

/**
 * Strictly read-only map preview displaying a GPS-captured location.
 * Does NOT allow clicking or dragging markers to override GPS coordinates.
 */
export function ReadOnlyLocationMap({ lat, lng, label = 'GPS Location', height = '200px' }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!hasValidCoords({ lat, lng })) return;

    const pos = [Number(lat), Number(lng)];
    const map = L.map(containerRef.current, {
      center: pos,
      zoom: 13,
      dragging: true,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    markerRef.current = L.marker(pos, {
      icon: createCircleIcon('#14532D', 'GPS'),
      draggable: false,
    })
      .bindPopup(`<strong>${label || 'GPS Location'}</strong>`)
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !hasValidCoords({ lat, lng })) return;
    const pos = [Number(lat), Number(lng)];
    if (markerRef.current) {
      markerRef.current.setLatLng(pos);
      markerRef.current.setPopupContent(`<strong>${label || 'GPS Location'}</strong>`);
    }
    mapRef.current.setView(pos, 13);
  }, [lat, lng, label]);

  if (!hasValidCoords({ lat, lng })) return null;

  return (
    <div
      ref={containerRef}
      style={{ height }}
      className="w-full rounded-xl border border-earth-200 overflow-hidden bg-earth-100"
    />
  );
}
