import React from 'react';

interface TableSidePanelProps {
  tableNumber: string;
  status?: string;
  capacity: number;
  waiter?: string;
  timer?: string;
  orderSummary?: string;
  onClose?: () => void;
}

export default function TableSidePanel({ tableNumber, status, capacity, waiter, timer, orderSummary, onClose }: TableSidePanelProps) {
  return (
    <aside className="w-80 bg-white rounded-lg shadow-lg p-6 flex flex-col gap-4 border border-blue-100">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">Table {tableNumber}</h2>
        {onClose && <button onClick={onClose} className="text-blue-600 font-semibold border border-blue-200 rounded px-3 py-1 hover:bg-blue-50 transition">Close</button>}
      </div>
      <div className="flex flex-col gap-2 pb-2 border-b border-gray-200">
        {status && <div className="text-sm">Status: <span className="font-semibold capitalize">{status}</span></div>}
        <div className="text-sm">Capacity: <span className="font-semibold">{capacity}</span></div>
        {waiter && <div className="text-sm">Waiter: <span className="font-semibold">{waiter}</span></div>}
        {timer && <div className="text-sm">Timer: <span className="font-semibold">{timer}</span></div>}
        {orderSummary && <div className="text-sm">Order: <span className="font-semibold">{orderSummary}</span></div>}
      </div>
      <div className="flex flex-col gap-2 mt-4">
        <span className="text-xs text-gray-500 font-semibold mb-1">Actions</span>
        <button className="bg-blue-700 text-white rounded px-4 py-2 font-medium hover:bg-blue-800 transition">View Order</button>
        <button className="bg-blue-100 text-blue-700 rounded px-4 py-2 font-medium border border-blue-200 hover:bg-blue-200 transition">Change Status</button>
        <button className="bg-blue-100 text-blue-700 rounded px-4 py-2 font-medium border border-blue-200 hover:bg-blue-200 transition">Assign/Change Waiter</button>
        <button className="bg-gray-100 text-gray-700 rounded px-4 py-2 font-medium border border-gray-200 hover:bg-gray-200 transition">Transfer Table</button>
        <button className="bg-gray-100 text-gray-700 rounded px-4 py-2 font-medium border border-gray-200 hover:bg-gray-200 transition">Merge Table</button>
      </div>
    </aside>
  );
} 