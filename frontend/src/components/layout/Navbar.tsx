import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, User, LogOut, ChevronRight, Map, LayoutDashboard, Truck, BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { SearchResult } from '../../types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      const res = await apiClient.get<SearchResult[]>(`/geo/search?q=${encodeURIComponent(query)}`);
      setResults(res.data);
      setIsOpen(true);
    } catch {
      setResults([]);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    navigate(`/map?lat=${result.lat}&lon=${result.lon}&zoom=14&title=${encodeURIComponent(result.title)}&type=${result.type}`);
  };

  const navItems = [
    { label: 'Response Map', path: '/map', icon: Map },
    { label: 'Overview', path: '/overview', icon: LayoutDashboard },
    { label: 'Relief Operations', path: '/operations', icon: Truck },
    { label: 'About', path: '/about', icon: BookOpen },
  ];

  return (
    <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-30 sticky top-0 shadow-sm">
      {/* Brand & Subtitle */}
      <div className="flex items-center gap-6">
        <div 
          onClick={() => navigate('/map')}
          className="cursor-pointer select-none"
        >
          <div className="text-base font-bold tracking-tight text-slate-900 leading-tight">
            RELIEFNET
          </div>
          <div className="text-[11px] text-slate-500 font-medium leading-none">
            Flood Relief Coordination Platform
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-slate-200">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/');
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Global Location & Institution Search */}
      <div className="relative flex-1 max-w-sm mx-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search district, upazila, school, college, NGO..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.length > 1) {
                  apiClient.get<SearchResult[]>(`/geo/search?q=${encodeURIComponent(e.target.value)}`)
                    .then((res) => {
                      setResults(res.data);
                      setIsOpen(true);
                    })
                    .catch(() => {});
                } else {
                  setResults([]);
                  setIsOpen(false);
                }
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-md pl-8 pr-3 py-1 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-400 focus:ring-1 focus:ring-slate-400 transition-all font-sans"
            />
          </div>
        </form>

        {/* Live Search Results Dropdown */}
        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden z-50 max-h-72 overflow-y-auto">
            {results.map((r) => (
              <div
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelectResult(r)}
                className="p-2 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 flex items-center justify-between text-xs transition-colors"
              >
                <div>
                  <div className="font-medium text-slate-900 flex items-center gap-1.5">
                    <span>{r.title}</span>
                    <span className="text-[10px] px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase font-mono">
                      {r.type}
                    </span>
                  </div>
                  {r.subtitle && (
                    <div className="text-[11px] text-slate-500">{r.subtitle}</div>
                  )}
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Controls */}
      <div className="flex items-center gap-2">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-800">{user.full_name}</span>
              <span className="text-[10px] text-slate-500 font-mono capitalize">{user.role.toLowerCase()}</span>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-md border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-1 px-3 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
          >
            <User className="w-3 h-3" />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
