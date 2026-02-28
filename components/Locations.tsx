'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Location {
  id: string;
  name: string;
  type: string;
  status: string;
  notes: string | null;
  address: string | null;
}

const STATUSES = ['Not Started', 'Packing', 'Packed', 'Loaded', 'In Transit', 'Delivered'];
const STATUS_PROGRESS: Record<string, number> = {
  'Not Started': 0, Packing: 20, Packed: 40, Loaded: 60, 'In Transit': 80, Delivered: 100,
};
const STATUS_COLORS: Record<string, string> = {
  'Not Started': '#bbb', Packing: '#e17055', Packed: '#fdcb6e', Loaded: '#74b9ff',
  'In Transit': '#a29bfe', Delivered: '#00b894',
};

function mapsUrl(address: string) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);

  async function load() {
    const { data } = await supabase.from('move_locations').select('*');
    setLocations(data || []);
  }

  useEffect(() => { load(); }, []);

  async function updateStatus(id: string, status: string) {
    await supabase.from('move_locations').update({ status }).eq('id', id);
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  }

  async function updateNotes(id: string, notes: string) {
    setLocations((prev) => prev.map((l) => (l.id === id ? { ...l, notes } : l)));
    await supabase.from('move_locations').update({ notes }).eq('id', id);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h2 className="text-lg font-semibold text-mountain mb-1">Location Tracker</h2>
      <p className="text-sm text-gray-400 mb-4">5 source locations → 1 destination in Montrose</p>

      <div className="flex flex-col gap-1">
        {locations.map((loc) => {
          const pct = STATUS_PROGRESS[loc.status] || 0;
          const color = STATUS_COLORS[loc.status] || '#bbb';
          return (
            <div
              key={loc.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-3 px-3 -mx-3 rounded-lg border-b border-gray-50 last:border-b-0 transition-colors hover:bg-snow"
            >
              {/* Left: name + address */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-1 h-8 rounded-full shrink-0"
                    style={{ background: loc.type === 'destination' ? '#6b8f71' : '#3d5a80' }}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">
                      {loc.type === 'destination' ? '🏠 ' : '📦 '}
                      {loc.name}
                    </div>
                    {loc.address && (
                      <a
                        href={mapsUrl(loc.address)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-sky hover:text-mountain underline"
                      >
                        📍 {loc.address}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Middle: status + progress */}
              <div className="flex items-center gap-2 sm:w-[220px] shrink-0">
                <select
                  value={loc.status}
                  onChange={(e) => updateStatus(loc.id, e.target.value)}
                  className="px-2 py-1 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-sky cursor-pointer"
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
                  <div
                    className="h-full rounded-full transition-all duration-400"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>

              {/* Right: notes */}
              <div className="sm:w-[180px] shrink-0">
                <input
                  type="text"
                  value={loc.notes || ''}
                  onChange={(e) => updateNotes(loc.id, e.target.value)}
                  placeholder="Notes..."
                  className="w-full text-xs px-2 py-1.5 border border-gray-100 rounded font-sans focus:outline-none focus:border-sky"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
