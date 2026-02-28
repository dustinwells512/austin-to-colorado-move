'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const STATUS_PROGRESS: Record<string, number> = {
  'Not Started': 0, Packing: 20, Packed: 40, Loaded: 60, 'In Transit': 80, Delivered: 100,
};

interface Stats {
  checklistDone: number;
  checklistTotal: number;
  locationsDelivered: number;
  locationsTotal: number;
  locationsAvgProgress: number;
  totalCost: number;
  costsByCategory: Record<string, number>;
  todosDone: number;
  todosTotal: number;
  personStats: { name: string; done: number; total: number }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const [checklist, locations, costs, todos] = await Promise.all([
        supabase.from('move_checklist').select('done'),
        supabase.from('move_locations').select('status'),
        supabase.from('move_costs').select('amount, category'),
        supabase.from('move_todos').select('person, done'),
      ]);

      const cl = checklist.data || [];
      const locs = locations.data || [];
      const cs = costs.data || [];
      const td = todos.data || [];

      const costsByCategory: Record<string, number> = {};
      cs.forEach((c) => {
        costsByCategory[c.category] = (costsByCategory[c.category] || 0) + Number(c.amount);
      });

      const people = ['Hana', 'Dustin', 'Yvette', 'Justin'];
      const personStats = people.map((name) => {
        const personTodos = td.filter((t) => t.person === name);
        return { name, done: personTodos.filter((t) => t.done).length, total: personTodos.length };
      });

      setStats({
        checklistDone: cl.filter((i) => i.done).length,
        checklistTotal: cl.length,
        locationsDelivered: locs.filter((l) => l.status === 'Delivered').length,
        locationsTotal: locs.length,
        locationsAvgProgress: locs.length
          ? Math.round(locs.reduce((s, l) => s + (STATUS_PROGRESS[l.status] || 0), 0) / locs.length)
          : 0,
        totalCost: cs.reduce((s, c) => s + Number(c.amount), 0),
        costsByCategory,
        todosDone: td.filter((t) => t.done).length,
        todosTotal: td.length,
        personStats,
      });
    }
    load();
  }, []);

  if (!stats) return <div className="text-center py-8 text-gray-400">Loading...</div>;

  const clPct = stats.checklistTotal ? Math.round((stats.checklistDone / stats.checklistTotal) * 100) : 0;

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatCard value={`${stats.checklistDone}/${stats.checklistTotal}`} label="Checklist Items" />
        <StatCard value={`${stats.locationsDelivered}/${stats.locationsTotal}`} label="Locations Delivered" />
        <StatCard value={`$${stats.totalCost.toLocaleString()}`} label="Total Costs" />
        <StatCard value={`${stats.todosDone}/${stats.todosTotal}`} label="Personal Tasks Done" />
      </div>

      <div className="bg-white rounded-lg shadow-sm p-5 mb-4">
        <h2 className="text-lg font-semibold text-mountain mb-4">Progress</h2>
        <ProgressRow label="Checklist" pct={clPct} />
        <ProgressRow label="Locations" pct={stats.locationsAvgProgress} />
        {stats.personStats.map((p) => (
          <ProgressRow
            key={p.name}
            label={p.name}
            pct={p.total ? Math.round((p.done / p.total) * 100) : 0}
          />
        ))}
      </div>

      {Object.keys(stats.costsByCategory).length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-lg font-semibold text-mountain mb-3">Cost Breakdown</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.costsByCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => (
                <span key={cat} className="bg-snow px-3 py-1.5 rounded-md text-sm">
                  {cat}: <span className="font-bold text-mountain">${amt.toLocaleString()}</span>
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 text-center">
      <div className="text-2xl font-bold text-mountain">{value}</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </div>
  );
}

function ProgressRow({ label, pct }: { label: string; pct: number }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <div className="text-sm min-w-[100px]">{label}</div>
      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-sage rounded-full transition-all duration-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs font-semibold min-w-[36px] text-right">{pct}%</div>
    </div>
  );
}
