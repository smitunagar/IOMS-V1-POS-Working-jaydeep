'use client';

import React, { useRef, useCallback, useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Environment } from '@react-three/drei';
import { useTableStore } from '@/features/table-management/stores/tableStore';

// Color helper for table status
function getStatusColor(status: string) {
  switch (status) {
    case 'FREE': return '#10b981';
    case 'SEATED': return '#ef4444'; 
    case 'DIRTY': return '#f59e0b';
    case 'RESERVED': return '#8b5cf6';
    default: return '#6b7280';
  }
}

// 3D Table Component
function Table3D({ table, isSelected, onClick }: { 
  table: any;
  isSelected: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  
  const tableColor = getStatusColor(table.status);
  const chairColor = table.status === 'DIRTY' ? '#8b5cf6' : '#654321';

  return (
    <group 
      position={[table.x, 0, table.y]} 
      rotation={[0, table.rotation || 0, 0]}
      onClick={onClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Table Top */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        {table.shape === 'round' ? (
          <cylinderGeometry args={[table.w / 2, table.w / 2, 0.1]} />
        ) : (
          <boxGeometry args={[table.w, 0.1, table.h]} />
        )}
        <meshPhysicalMaterial 
          color={isSelected ? '#3b82f6' : tableColor}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>

      {/* Chairs */}
      {[...Array(table.capacity)].map((_, i) => {
        const angle = (i * 2 * Math.PI) / table.capacity;
        const distance = table.shape === 'round' ? table.w / 2 + 0.8 : Math.max(table.w, table.h) / 2 + 0.8;
        return (
          <group
            key={i}
            position={[
              Math.cos(angle) * distance,
              0,
              Math.sin(angle) * distance
            ]}
            rotation={[0, angle + Math.PI, 0]}
          >
            {/* Chair Seat */}
            <mesh position={[0, 0.5, 0]} castShadow>
              <boxGeometry args={[0.5, 0.1, 0.5]} />
              <meshPhysicalMaterial color={chairColor} roughness={0.3} />
            </mesh>
            
            {/* Chair Back */}
            <mesh position={[0, 0.8, -0.2]} castShadow>
              <boxGeometry args={[0.5, 0.6, 0.1]} />
              <meshPhysicalMaterial color={chairColor} roughness={0.3} />
            </mesh>
          </group>
        );
      })}

      {/* Table Label */}
      <Html position={[0, 1.5, 0]} center>
        <div className={`px-3 py-1 rounded-lg text-white font-bold text-sm shadow-lg transition-all ${
          isSelected ? 'bg-blue-600 scale-110' : hovered ? 'bg-indigo-600' : 'bg-purple-600'
        }`}>
          {table.label}
        </div>
      </Html>

      {/* Status Indicator */}
      <mesh position={[0, 1.2, 0]}>
        <sphereGeometry args={[0.1]} />
        <meshBasicMaterial color={tableColor} />
      </mesh>
    </group>
  );
}

// 3D Scene Component
function Scene3D() {
  const { tables, selectTable } = useTableStore();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      
      {/* Environment */}
      <Environment preset="apartment" />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
        <planeGeometry args={[50, 50]} />
        <meshPhysicalMaterial color="#f8fafc" roughness={0.1} />
      </mesh>

      {/* Tables */}
      {tables.map((table) => (
        <Table3D
          key={table.id}
          table={table}
          isSelected={false}
          onClick={() => selectTable(table.id)}
        />
      ))}
    </>
  );
}

// 2D Canvas Component  
function Canvas2D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    tables, 
    zones, 
    fixtures, 
    // selectedTables, 
    toggleTableSelection,
    updateTable
  } = useTableStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragTableId, setDragTableId] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw zones
    zones.forEach(zone => {
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      if (zone.bounds) {
        ctx.strokeRect(zone.bounds.x, zone.bounds.y, zone.bounds.w, zone.bounds.h);
      }
      ctx.setLineDash([]);
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '14px sans-serif';
      if (zone.bounds) {
        ctx.fillText(zone.name, zone.bounds.x + 5, zone.bounds.y + 20);
      }
    });

    // Draw fixtures
    fixtures.forEach(fixture => {
      ctx.fillStyle = fixture.kind === 'wall' ? '#374151' : '#8b5cf6';
      ctx.fillRect(fixture.x, fixture.y, fixture.w, fixture.h);
    });

    // Draw tables
    tables.forEach(table => {
      const isSelected = false;
      
      // Table
      ctx.fillStyle = isSelected ? '#3b82f6' : getStatusColor(table.status);
      
      if (table.shape === 'round') {
        ctx.beginPath();
        ctx.arc(table.x + table.w/2, table.y + table.h/2, table.w/2, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.fillRect(table.x, table.y, table.w, table.h);
      }

      // Table label
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(table.label, table.x + table.w/2, table.y + table.h/2 + 4);

      // Selection handles
      if (isSelected) {
        ctx.fillStyle = '#3b82f6';
        const handleSize = 8;
        const handles = [
          [table.x - handleSize/2, table.y - handleSize/2],
          [table.x + table.w - handleSize/2, table.y - handleSize/2],
          [table.x - handleSize/2, table.y + table.h - handleSize/2],
          [table.x + table.w - handleSize/2, table.y + table.h - handleSize/2]
        ];
        
        handles.forEach(([x, y]) => {
          ctx.fillRect(x, y, handleSize, handleSize);
        });
      }
    });
  }, [tables, zones, fixtures]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find clicked table
    for (const table of tables) {
      if (x >= table.x && x <= table.x + table.w && 
          y >= table.y && y <= table.y + table.h) {
        setDragTableId(table.id);
        setDragStart({ x: x - table.x, y: y - table.y });
        setIsDragging(true);
        
        if (!e.shiftKey) {
          toggleTableSelection(table.id);
        }
        break;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragTableId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newX = x - dragStart.x;
    const newY = y - dragStart.y;

    updateTable(dragTableId, { x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTableId(null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      className="border border-gray-300 cursor-pointer"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
}

// Main Floor Editor Canvas Component
export function FloorEditorCanvas() {
  const { viewMode } = useTableStore();

  if (viewMode === '3D') {
    return (
      <div className="w-full h-full relative">
        <Canvas
          camera={{ position: [10, 10, 10], fov: 75 }}
          className="w-full h-full"
          shadows
        >
          <PerspectiveCamera makeDefault position={[10, 10, 10]} />
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
          />
          <Suspense fallback={null}>
            <Scene3D />
          </Suspense>
        </Canvas>
        
        {/* 3D Controls Overlay */}
        <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-lg text-xs space-y-1">
          <div>Left-click + drag: Rotate</div>
          <div>Right-click + drag: Pan</div>
          <div>Scroll: Zoom</div>
          <div>Click tables: Select</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <Canvas2D />
      
      {/* 2D Controls Overlay */}
      <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-lg text-xs space-y-1">
        <div>Click + drag: Move tables</div>
        <div>Shift + click: Multi-select</div>
        <div>Handles: Resize tables</div>
      </div>
    </div>
  );
}
