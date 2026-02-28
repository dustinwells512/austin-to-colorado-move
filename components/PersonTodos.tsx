'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Todo {
  id: string;
  person: string;
  description: string;
  done: boolean;
  due_date: string | null;
  priority: string;
}

const PEOPLE = ['Hana', 'Dustin', 'Yvette', 'Justin'];

const PRIORITY_STYLES: Record<string, string> = {
  high: 'bg-red-50 text-red-600',
  med: 'bg-amber-50 text-amber-700',
  low: 'bg-emerald-50 text-sage',
};

export default function PersonTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [desc, setDesc] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('med');
  const [assignTo, setAssignTo] = useState(PEOPLE[0]);

  async function load() {
    const { data } = await supabase
      .from('move_todos')
      .select('*')
      .order('created_at');
    setTodos(data || []);
  }

  useEffect(() => { load(); }, []);

  async function addTodo() {
    if (!desc.trim()) return;
    const person = filter || assignTo;
    const { data } = await supabase
      .from('move_todos')
      .insert({ person, description: desc.trim(), due_date: dueDate || null, priority })
      .select()
      .single();
    if (data) setTodos((prev) => [...prev, data]);
    setDesc('');
    setDueDate('');
    setPriority('med');
  }

  async function toggleDone(todo: Todo) {
    await supabase.from('move_todos').update({ done: !todo.done }).eq('id', todo.id);
    setTodos((prev) => prev.map((t) => (t.id === todo.id ? { ...t, done: !t.done } : t)));
  }

  async function deleteTodo(id: string) {
    await supabase.from('move_todos').delete().eq('id', id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }

  const filtered = filter ? todos.filter((t) => t.person === filter) : todos;

  const priOrder: Record<string, number> = { high: 0, med: 1, low: 2 };
  const sorted = [...filtered].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    return (priOrder[a.priority] ?? 1) - (priOrder[b.priority] ?? 1);
  });

  const done = filtered.filter((t) => t.done).length;

  // Per-person counts for filter badges
  const counts = PEOPLE.map((p) => {
    const personTodos = todos.filter((t) => t.person === p);
    const personDone = personTodos.filter((t) => t.done).length;
    return { name: p, total: personTodos.length, done: personDone };
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h2 className="text-lg font-semibold text-mountain mb-3">
        Tasks{' '}
        <span className="font-normal text-sm text-gray-400">
          ({done}/{filtered.length} done)
        </span>
      </h2>

      {/* Person filter buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border-none cursor-pointer transition-colors ${
            filter === null
              ? 'bg-mountain text-white'
              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
        >
          All ({todos.length})
        </button>
        {counts.map((c) => (
          <button
            key={c.name}
            onClick={() => setFilter(filter === c.name ? null : c.name)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border-none cursor-pointer transition-colors ${
              filter === c.name
                ? 'bg-mountain text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {c.name} ({c.done}/{c.total})
          </button>
        ))}
      </div>

      {/* Add form */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a task..."
          className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-sky"
        />
        {!filter && (
          <select
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-sky"
          >
            {PEOPLE.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        )}
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-sky"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-sky"
        >
          <option value="high">High</option>
          <option value="med">Medium</option>
          <option value="low">Low</option>
        </select>
        <button onClick={addTodo} className="px-4 py-2 bg-mountain text-white rounded-md text-sm font-semibold hover:bg-sky transition-colors cursor-pointer">
          Add
        </button>
      </div>

      {/* Task list */}
      {sorted.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 py-2 px-2 -mx-2 rounded-md border-b border-gray-50 last:border-b-0 transition-colors hover:bg-snow ${
            t.done ? 'opacity-50' : ''
          }`}
        >
          <input
            type="checkbox"
            checked={t.done}
            onChange={() => toggleDone(t)}
            className="w-[18px] h-[18px] mt-0.5 shrink-0 cursor-pointer"
          />
          <div className="flex-1 min-w-0">
            <div className={`text-sm ${t.done ? 'line-through' : ''}`}>
              {t.description}
              <span
                className={`inline-block text-[10px] font-bold px-1.5 py-0.5 rounded ml-2 uppercase ${
                  PRIORITY_STYLES[t.priority] || PRIORITY_STYLES.med
                }`}
              >
                {t.priority}
              </span>
              {!filter && (
                <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded ml-1 bg-gray-100 text-gray-500">
                  {t.person}
                </span>
              )}
            </div>
            {t.due_date && (
              <div className="text-xs text-gray-400 mt-0.5">Due: {t.due_date}</div>
            )}
          </div>
          <button
            onClick={() => deleteTodo(t.id)}
            className="text-gray-300 hover:text-red-600 bg-transparent border-none cursor-pointer text-base shrink-0 leading-none p-0.5"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
