import React from 'react';

interface Stats {
  totalPatients: number;
  completed: number;
  waiting: number;
  revenue: number;
}

interface TodayStatsPanelProps {
  stats: Stats;
}

const TodayStatsPanel: React.FC<TodayStatsPanelProps> = ({ stats }) => {
  return (
    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
      <h3 className="font-bold text-xl mb-4">Today's Summary</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-green-100">Total Patients</span>
          <span className="font-bold text-lg">{stats.totalPatients}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-100">Completed</span>
          <span className="font-bold text-lg">{stats.completed}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-100">Waiting</span>
          <span className="font-bold text-lg">{stats.waiting}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-green-100">Revenue</span>
          <span className="font-bold text-lg">₹{stats.revenue}</span>
        </div>
      </div>
    </div>
  );
};

export default TodayStatsPanel;
