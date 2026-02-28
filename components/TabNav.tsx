'use client';

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'checklist', label: 'Checklist' },
  { id: 'locations', label: 'Locations' },
  { id: 'costs', label: 'Costs' },
  { id: 'hana', label: 'Hana' },
  { id: 'dustin', label: 'Dustin' },
  { id: 'yvette', label: 'Yvette' },
  { id: 'justin', label: 'Justin' },
];

export default function TabNav({
  activeTab,
  onTabChange,
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
}) {
  return (
    <nav className="flex gap-0.5 overflow-x-auto hide-scrollbar">
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => onTabChange(t.id)}
          className={`px-4 py-2.5 border-none text-sm font-medium rounded-t-lg whitespace-nowrap transition-all cursor-pointer ${
            t.id === activeTab
              ? 'bg-light-bg text-slate-dark'
              : 'bg-white/15 text-white/80 hover:bg-white/25 hover:text-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
