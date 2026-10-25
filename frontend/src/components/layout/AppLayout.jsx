import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import CosmicBackground from './CosmicBackground';

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-base-200 text-base-content relative">
      <CosmicBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
