'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Cost {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string | null;
  is_final: boolean;
}

const CATEGORIES = ['Truck Rental', 'Gas', 'Packing Supplies', 'Storage Fees', 'Food/Lodging', 'Other'];

export default function Costs() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState('');

  async function load() {
    const { data } = await supabase.from('move_costs').select('*').order('created_at', { ascending: false });
    setCosts(data || []);
  }

  useEffect(() => { load(); }, []);

  async function addCost() {
    const amt = parseFloat(amount);
    if (!desc.trim() || !amt || amt <= 0) return;
    const { data } = await supabase
      .from('move_costs')
      .insert({ description: desc.trim(), amount: amt, category, date: date || null })
      .select()
      .single();
    if (data) setCosts((prev) => [data, ...prev]);
    setDesc('');
    setAmount('');
    setDate('');
  }

  async function toggleFinal(cost: Cost) {
    await supabase.from('move_costs').update({ is_final: !cost.is_final }).eq('id', cost.id);
    setCosts((prev) => prev.map((c) => (c.id === cost.id ? { ...c, is_final: !c.is_final } : c)));
  }

  async function deleteCost(id: string) {
    await supabase.from('move_costs').delete().eq('id', id);
    setCosts((prev) => prev.filter((c) => c.id !== id));
  }

  const total = costs.reduce((s, c) => s + Number(c.amount), 0);
  const finalTotal = costs.filter((c) => c.is_final).reduce((s, c) => s + Number(c.amount), 0);
  const estimateTotal = costs.filter((c) => !c.is_final).reduce((s, c) => s + Number(c.amount), 0);
  const byCategory: Record<string, number> = {};
  costs.forEach((c) => {
    byCategory[c.category] = (byCategory[c.category] || 0) + Number(c.amount);
  });

  return (
    <div className="bg-white rounded-lg shadow-sm p-5">
      <h2 className="text-lg font-semibold text-mountain mb-4">Cost Calculator</h2>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="bg-snow px-3 py-1.5 rounded-md text-sm">
          Total: <span className="font-bold text-mountain">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </span>
        {finalTotal > 0 && (
          <span className="bg-emerald-50 px-3 py-1.5 rounded-md text-sm">
            Final: <span className="font-bold text-emerald-700">${finalTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </span>
        )}
        {estimateTotal > 0 && (
          <span className="bg-amber-50 px-3 py-1.5 rounded-md text-sm">
            Estimates: <span className="font-bold text-amber-700">${estimateTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </span>
        )}
        {Object.entries(byCategory).map(([cat, amt]) => (
          <span key={cat} className="bg-snow px-3 py-1.5 rounded-md text-sm">
            {cat}: <span className="font-bold text-mountain">${amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </span>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="What was it?"
          className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-sky"
        />
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="$0.00"
          min="0"
          step="0.01"
          className="w-24 px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-sky"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-sky"
        >
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-sky"
        />
        <button onClick={addCost} className="px-4 py-2 bg-mountain text-white rounded-md text-sm font-semibold hover:bg-sky transition-colors cursor-pointer">
          Add
        </button>
      </div>

      {costs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left p-2 font-semibold text-gray-500">Description</th>
                <th className="text-left p-2 font-semibold text-gray-500">Category</th>
                <th className="text-left p-2 font-semibold text-gray-500">Date</th>
                <th className="text-right p-2 font-semibold text-gray-500">Amount</th>
                <th className="text-center p-2 font-semibold text-gray-500">Status</th>
                <th className="w-10 text-center p-2"></th>
              </tr>
            </thead>
            <tbody>
              {costs.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 transition-colors hover:bg-snow">
                  <td className="p-2">{c.description}</td>
                  <td className="p-2">{c.category}</td>
                  <td className="p-2">{c.date || '—'}</td>
                  <td className="p-2 text-right font-semibold">
                    ${Number(c.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => toggleFinal(c)}
                      className={`text-xs font-bold px-2 py-0.5 rounded cursor-pointer border-none ${
                        c.is_final
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-50 text-amber-600'
                      }`}
                    >
                      {c.is_final ? 'Final' : 'Estimate'}
                    </button>
                  </td>
                  <td className="p-2 text-center">
                    <button
                      onClick={() => deleteCost(c.id)}
                      className="text-gray-300 hover:text-red-600 bg-transparent border-none cursor-pointer text-base"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
