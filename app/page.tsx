'use client';

import { useState } from 'react';
import TabNav from '@/components/TabNav';
import Dashboard from '@/components/Dashboard';
import Checklist from '@/components/Checklist';
import Locations from '@/components/Locations';
import Costs from '@/components/Costs';
import PersonTodos from '@/components/PersonTodos';

const PEOPLE = ['Hana', 'Dustin', 'Yvette', 'Justin'];

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <>
      <header className="bg-gradient-to-br from-mountain to-sky text-white px-6 pt-5 pb-0 sticky top-0 z-50">
        <h1 className="text-xl font-bold mb-3">
          Austin → Montrose, CO <span className="opacity-80 font-normal">Move Planner</span>
        </h1>
        <TabNav activeTab={activeTab} onTabChange={setActiveTab} />
      </header>

      <main className="max-w-[960px] mx-auto p-5">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'checklist' && <Checklist />}
        {activeTab === 'locations' && <Locations />}
        {activeTab === 'costs' && <Costs />}
        {PEOPLE.map(
          (p) =>
            activeTab === p.toLowerCase() && (
              <PersonTodos key={p} person={p} />
            )
        )}
      </main>
    </>
  );
}
