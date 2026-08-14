import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isMap = location.pathname === '/map' || location.pathname === '/';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 antialiased selection:bg-slate-200">
      <Navbar />
      <main className={`flex-1 flex flex-col ${isMap ? 'h-[calc(100vh-3.5rem)] overflow-hidden' : 'overflow-y-auto p-4 md:p-8 max-w-6xl w-full mx-auto'}`}>
        <Outlet />
      </main>
    </div>
  );
};
