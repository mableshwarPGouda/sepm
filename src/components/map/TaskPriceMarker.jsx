// src/components/map/TaskPriceMarker.jsx
import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { getCategoryMeta } from '../../constants/categories';

export const createTaskPriceIcon = (price, category) => {
  const meta = getCategoryMeta(category);
  const color = meta.markerBg || '#0f172a';
  return L.divIcon({
    className: 'custom-task-price-pin',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background-color: #09090b; color: white; font-weight: 800; font-size: 11px; font-family: sans-serif; padding: 4px 9px; border-radius: 9999px; border: 2px solid white; box-shadow: 0 4px 12px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 5px; white-space: nowrap;">
          <span style="width: 7px; height: 7px; border-radius: 9999px; background-color: ${color};"></span>
          <span>₹${Math.round(price)}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 5px solid transparent; border-right: 5px solid transparent; border-top: 6px solid #09090b; margin-top: -1px;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

export function TaskPriceMarker({ task, userRole = 'WORKER' }) {
  const navigate = useNavigate();

  // Coordinates can be direct properties or in PostGIS GeoJSON location
  let lat = task.latitude ?? task.lat;
  let lng = task.longitude ?? task.lng;

  if ((lat === undefined || lng === undefined) && task.location?.coordinates) {
    lng = task.location.coordinates[0];
    lat = task.location.coordinates[1];
  }

  if (lat === undefined || lng === undefined || lat === null || lng === null) {
    return null;
  }

  const price = task.budget || task.agreed_price || 0;
  const icon = createTaskPriceIcon(price, task.category);

  const handleOpenDetail = () => {
    const route = userRole === 'REQUESTER' ? `/requester/tasks/${task.id}` : `/worker/tasks/${task.id}`;
    navigate(route);
  };

  return (
    <Marker position={[lat, lng]} icon={icon}>
      <Popup>
        <div className="p-1 min-w-[190px]">
          <span className="text-[10px] uppercase font-black text-brand-600 tracking-wider">
            {getCategoryMeta(task.category).label}
          </span>
          <h4 className="font-black text-slate-950 text-xs mt-0.5">{task.title}</h4>
          <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
            {task.address || task.description || 'Local task'}
          </p>
          <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="font-black text-slate-950 text-sm font-mono">₹{price}</span>
            <button
              onClick={handleOpenDetail}
              className="text-[11px] bg-slate-950 hover:bg-slate-800 text-white font-bold px-3 py-1 rounded-lg transition-colors"
            >
              View Gig
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default TaskPriceMarker;
