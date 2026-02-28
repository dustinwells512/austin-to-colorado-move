'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ChecklistItem {
  id: string;
  phase: string;
  description: string;
  done: boolean;
  due_date: string | null;
  notes: string | null;
  sort_order: number;
}

const PHASES = ['Before the Move', 'Packing & Prep', 'Moving Day', 'After the Move'];

export default function Checklist() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newDesc, setNewDesc] = useState('');
  const [newPhase, setNewPhase] = useState(PHASES[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editDue, setEditDue] = useState('');
  const [editNotes, setEditNotes] = useState('');

  async function load() {
    const { data } = await supabase
      .from('move_checklist')
      .select('*')
      .order('sort_order');
    setItems(data || []);
  }

  useEffect(() => { load(); }, []);

  async function toggleDone(item: ChecklistItem) {
    await supabase.from('move_checklist').update({ done: !item.done }).eq('id', item.id);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)));
  }

  async function addItem() {
    if (!newDesc.trim()) return;
    const maxOrder = items.length > 0 ? Math.max(...items.map((i) => i.sort_order)) + 1 : 0;
    const { data } = await supabase
      .from('move_checklist')
      .insert({ phase: newPhase, description: newDesc.trim(), sort_order: maxOrder })
      .select()
      .single();
    if (data) setItems((prev) => [...prev, data]);
    setNewDesc('');
  }

  async function deleteItem(id: string) {
    await supabase.from('move_checklist').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function startEdit(item: ChecklistItem) {
    setEditingId(item.id);
    setEditDesc(item.description);
    setEditDue(item.due_date || '');
    setEditNotes(item.notes || '');
  }

  async function saveEdit() {
    if (!editingId) return;
    await supabase
      .from('move_checklist')
      .update({ description: editDesc, due_date: editDue || null, notes: editNotes || null })
      .eq('id', editingId);
    setItems((prev) =>
      prev.map((i) =>
        i.id === editingId
          ? { ...i, description: editDesc, due_date: editDue || null, notes: editNotes || null }
          : i
      )
    );
    setEditingId(null);
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h2 className="text-lg font-semibold text-mountain mb-4">Moving Checklist</h2>

      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <input
          type="text"
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
          placeholder="Add custom item..."
          className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-sky"
        />
        <select
          value={newPhase}
          onChange={(e) => setNewPhase(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-sky"
        >
          {PHASES.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <button onClick={addItem} className="px-4 py-2 bg-mountain text-white rounded-md text-sm font-semibold hover:bg-sky transition-colors cursor-pointer">
          Add
        </button>
      </div>

      {PHASES.map((phase) => {
        const phaseItems = items.filter((i) => i.phase === phase);
        const done = phaseItems.filter((i) => i.done).length;
        return (
          <div key={phase} className="mb-6">
            <h3 className="text-sm font-semibold text-sage uppercase tracking-wide mb-2">
              {phase} ({done}/{phaseItems.length})
            </h3>
            {phaseItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 py-2 border-b border-gray-50 last:border-b-0 ${
                  item.done ? 'opacity-50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggleDone(item)}
                  className="w-[18px] h-[18px] mt-0.5 shrink-0 cursor-pointer"
                />
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-sky"
                      />
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={editDue}
                          onChange={(e) => setEditDue(e.target.value)}
                          className="px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-sky"
                        />
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="Notes..."
                          className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm focus:outline-none focus:border-sky"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="px-3 py-1 bg-sage text-white rounded text-xs font-semibold cursor-pointer">
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1 bg-gray-200 rounded text-xs font-semibold cursor-pointer">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className={`text-sm ${item.done ? 'line-through' : ''}`}>
                        {item.description}
                      </div>
                      {(item.due_date || item.notes) && (
                        <div className="text-xs text-gray-400 mt-0.5">
                          {item.due_date && `Due: ${item.due_date}`}
                          {item.due_date && item.notes && ' | '}
                          {item.notes}
                        </div>
                      )}
                    </>
                  )}
                </div>
                {editingId !== item.id && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-gray-300 hover:text-slate-dark bg-transparent border-none cursor-pointer text-base leading-none p-0.5"
                      title="Edit"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-gray-300 hover:text-red-600 bg-transparent border-none cursor-pointer text-base leading-none p-0.5"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
