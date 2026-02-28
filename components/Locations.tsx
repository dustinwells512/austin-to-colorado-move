'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Location {
  id: string;
  name: string;
  type: string;
  status: string;
  notes: string | null;
}

const STATUSES = ['Not Started', 'Packing', 'Packed', 'Loaded', 'In Transit', 'Delivered'];
const STATUS_PROGRESS: Record<string, number> = {
  'Not Started': 0, Packing: 20, Packed: 40, Loaded: 60, 'In Transit': 80, Delivered: 100,
};
const STATUS_COLORS: Record<string, string> = {
  'Not Started': '#bbb', Packing: '#e17055', Packed: '#fdcb6e', Loaded: '#74b9ff',
  'In Transit': '#a29bfe', Delivered: '#00b894',
};

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
    <div>
      <div className="bg-white rounded-lg shadow-sm p-5 mb-4">
        <h2 className="text-lg font-semibold text-mountain mb-1">Location Tracker</h2>
        <p className="text-sm text-gray-400 mb-0">5 source locations → 1 destination in Montrose</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((loc) => {
          const pct = STATUS_PROGRESS[loc.status] || 0;
          const color = STATUS_COLORS[loc.status] || '#bbb';
          return (
            <div
              key={loc.id}
              className="bg-white rounded-lg shadow-sm p-4"
              style={{ borderLeft: `4px solid ${loc.type === 'destination' ? '#6b8f71' : '#3d5a80'}` }}
            >
              <h3 className="text-sm font-semibold mb-2">
                {loc.type === 'destination' ? '🏠 ' : '📦 '}
                {loc.name}
              </h3>
              <select
                value={loc.status}
                onChange={(e) => updateStatus(loc.id, e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-sm mb-2 focus:outline-none focus:border-sky cursor-pointer"
              >
                {STATUSES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full rounded-full transition-all duration-400"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
              <textarea
                value={loc.notes || ''}
                onChange={(e) => updateNotes(loc.id, e.target.value)}
                placeholder="Notes..."
                className="w-full text-xs p-2 border border-gray-100 rounded min-h-[40px] resize-y font-sans focus:outline-none focus:border-sky"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
