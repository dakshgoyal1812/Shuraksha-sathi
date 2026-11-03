import React, { useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { SurakshaChatbot } from './components/SurakshaChatbot';

// Lazy-loaded pages for ultra-lightweight initial bundle and blazing fast loads
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ScenarioListPage = lazy(() => import('./pages/ScenarioListPage').then(m => ({ default: m.ScenarioListPage })));
const ScenarioBuilderPage = lazy(() => import('./pages/ScenarioBuilderPage').then(m => ({ default: m.ScenarioBuilderPage })));
const SimulationWorkspacePage = lazy(() => import('./pages/SimulationWorkspacePage').then(m => ({ default: m.SimulationWorkspacePage })));
const ShelterManagementPage = lazy(() => import('./pages/ShelterManagementPage').then(m => ({ default: m.ShelterManagementPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const ComparePage = lazy(() => import('./pages/ComparePage').then(m => ({ default: m.ComparePage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ArthaSetuStatsPage = lazy(() => import('./pages/ArthaSetuStatsPage').then(m => ({ default: m.ArthaSetuStatsPage })));
const LiveTrackingPage = lazy(() => import('./pages/LiveTrackingPage').then(m => ({ default: m.LiveTrackingPage })));
const Greenfield3DPage = lazy(() => import('./pages/Greenfield3DPage').then(m => ({ default: m.Greenfield3DPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">Loading Suraksha...</span>
  </div>
);


const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('');
  const location = useLocation();

  const isLandingPage = location.pathname === '/';

  if (isLandingPage) {
    return (
      <>
        {children}
        <SurakshaChatbot activeScenarioId={activeScenarioId} />
      </>
    );
  }

  return (
    <div className="grid-wrapper min-h-screen text-[#1F2937] flex flex-col font-sans relative">
      <div className="grid-background pointer-events-none" aria-hidden="true"></div>
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeScenarioId={activeScenarioId}
          onScenarioChange={setActiveScenarioId}
        />

        <div className="flex-1 flex">
          <Sidebar
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            activeScenarioId={activeScenarioId}
          />

          <main className="flex-1 lg:ml-64 p-4 lg:p-6 min-h-[calc(100vh-4rem)] overflow-y-auto">
            {children}
          </main>
        </div>

        {/* Suraksha EOC Disaster AI Assistant Floating Chatbot */}
        <SurakshaChatbot activeScenarioId={activeScenarioId} />
      </div>
    </div>
  );
};

export function App() {
  return (
    <Router>
      <AppLayout>
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/scenarios" element={<ScenarioListPage />} />
            <Route path="/scenarios/new" element={<ScenarioBuilderPage />} />
            <Route path="/scenarios/:id/edit" element={<ScenarioBuilderPage />} />
            <Route path="/simulation/:id" element={<SimulationWorkspacePage />} />
            <Route path="/3d" element={<Greenfield3DPage />} />
            <Route path="/simulation-3d" element={<Greenfield3DPage />} />
            <Route path="/shelters" element={<ShelterManagementPage />} />
            <Route path="/analytics/:id" element={<AnalyticsPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/live-tracking" element={<LiveTrackingPage />} />
            <Route path="/live-map" element={<LiveTrackingPage />} />
            <Route path="/stats" element={<ArthaSetuStatsPage />} />
            <Route path="/arthasetu" element={<ArthaSetuStatsPage />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </Router>
  );
}

export default App;
