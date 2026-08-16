import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ScenarioProvider } from './context/ScenarioContext';
import { MapStateProvider } from './context/MapStateContext';
import { AppLayout } from './components/layout/AppLayout';

import { OverviewPage } from './pages/OverviewPage';
import { MapPage } from './pages/MapPage';
import { OperationsPage } from './pages/OperationsPage';
import { LoginPage } from './pages/LoginPage';
import { AboutPage } from './pages/AboutPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ScenarioProvider>
          <MapStateProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route path="/" element={<AppLayout />}>
                  <Route index element={<MapPage />} />
                  <Route path="map" element={<MapPage />} />
                  <Route path="overview" element={<OverviewPage />} />
                  <Route path="operations" element={<OperationsPage />} />
                  <Route path="about" element={<AboutPage />} />
                  <Route path="*" element={<Navigate to="/map" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </MapStateProvider>
        </ScenarioProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
