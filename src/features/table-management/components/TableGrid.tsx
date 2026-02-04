import React from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import TableCard from './TableCard';

const TABLE_TYPE = 'TABLE_CARD';

function DraggableTableCard({ table, index, moveTable, onTableClick }: any) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [, drop] = useDrop({
    accept: TABLE_TYPE,
    hover(item: any) {
      if (!ref.current || item.index === index) return;
      moveTable(item.index, index);
      item.index = index;
    },
  });
  const [{ isDragging }, drag] = useDrag({
    type: TABLE_TYPE,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  drag(drop(ref));
  return (
    <div ref={ref} style={{ opacity: isDragging ? 0.5 : 1 }}>
      <TableCard {...table} onClick={() => onTableClick && onTableClick(table)} />
    </div>
  );
}

export default function TableGrid({ tables, setTables, onTableClick }: { tables: any[]; setTables: Dispatch<SetStateAction<any[]>>; onTableClick?: (table: any) => void }) {
  const moveTable = (from: number, to: number) => {
    setTables((prev: any[]) => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
  };
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-blue-50 rounded-lg p-4 min-h-[400px] grid grid-cols-6 gap-4 border border-blue-100">
        {tables.map((table, idx) => (
          <DraggableTableCard key={table.id} table={table} index={idx} moveTable={moveTable} onTableClick={onTableClick} />
        ))}
      </div>
    </DndProvider>
  );
} 