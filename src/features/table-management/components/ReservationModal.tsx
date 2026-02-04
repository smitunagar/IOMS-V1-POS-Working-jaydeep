import React, { useState, useEffect } from 'react';

interface ReservationModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  reservation?: any;
}

export default function ReservationModal({ open, onClose, onSave, reservation }: ReservationModalProps) {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [partySize, setPartySize] = useState(1);
  const [table, setTable] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setName(reservation?.customerName || '');
    setDate(reservation?.date || '');
    setTime(reservation?.time || '');
    setPartySize(reservation?.partySize || 1);
    setTable(reservation?.tableNumber || '');
    setNotes(reservation?.notes || '');
  }, [reservation, open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl border">
        <h3 className="text-lg font-semibold mb-4">{reservation ? 'Edit' : 'Add'} Reservation</h3>
        <form onSubmit={e => {
          e.preventDefault();
          onSave({
            customerName: name,
            date,
            time,
            partySize,
            tableNumber: table,
            notes,
            status: 'confirmed'
          });
        }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input className="w-full border rounded px-2 py-1" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input type="date" className="w-full border rounded px-2 py-1" value={date} onChange={e => setDate(e.target.value)} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Time</label>
              <input type="time" className="w-full border rounded px-2 py-1" value={time} onChange={e => setTime(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Number of People</label>
            <input type="number" className="w-full border rounded px-2 py-1" value={partySize} onChange={e => setPartySize(Number(e.target.value))} min={1} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Table</label>
            <input className="w-full border rounded px-2 py-1" value={table} onChange={e => setTable(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea className="w-full border rounded px-2 py-1" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" className="bg-gray-200 px-3 py-1 rounded" onClick={onClose}>Cancel</button>
            <button type="submit" className="bg-blue-700 text-white px-3 py-1 rounded">Confirm</button>
          </div>
        </form>
      </div>
    </div>
  );
} 