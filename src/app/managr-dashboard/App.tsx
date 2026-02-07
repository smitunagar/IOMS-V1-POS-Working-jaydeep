import React from 'react';
import { DashboardHeader } from './components/DashboardHeader';
import { DemandForecast } from './components/DemandForecast';
import { WasteSnapshotSmall } from './components/WasteSnapshotSmall';
import { ProductionTable } from './components/ProductionTable';
import { WasteDetail } from './components/WasteDetail';
import { EfficiencyGauge } from './components/EfficiencyGauge';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f1f3f2] pb-10">
      <DashboardHeader />
      
      {/* Fluid layout with w-full and consistent horizontal padding. Removed mt-6 to align with header's bottom padding. */}
      <main className="w-full px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column */}
          <div className="flex flex-col gap-6">
            <div className="h-[400px]">
               <DemandForecast />
            </div>
            <div>
               <WasteSnapshotSmall />
            </div>
          </div>

          {/* Right Column (Spans 2) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Top Right: Production Table */}
            <div className="min-h-[280px]">
                <ProductionTable />
            </div>
            
            {/* Bottom Right: Split into two */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <WasteDetail />
                </div>
                <div className="h-full">
                    <EfficiencyGauge />
                </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;