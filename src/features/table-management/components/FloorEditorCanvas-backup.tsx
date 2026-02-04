'use client';

import React, { useRef, useCallback, useState, useEffect, Suspense } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Html, Environment, Grid } from '@react-three/drei';
import { useTableStore } from '@/features/table-management/stores/tableStore';

// Custom Grid Component
function CustomGrid({ size = 20, divisions = 20, color = "#e2e8f0" }) {
  const points = [];
  const halfSize = size / 2;
  
  // Create grid lines
  for (let i = 0; i <= divisions; i++) {
    const step = size / divisions;
    const pos = -halfSize + i * step;
    
    // Horizontal lines
    points.push([-halfSize, 0, pos], [halfSize, 0, pos]);
    // Vertical lines  
    points.push([pos, 0, -halfSize], [pos, 0, halfSize]);
  }
  
  return (
    <lineSegments>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length}
          array={new Float32Array(points.flat())}
          itemSize={3}
          args={[new Float32Array(points.flat()), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} />
    </lineSegments>
  );
}

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

      {/* Table Legs */}
      {table.shape === 'round' ? (
        // Central pedestal for round tables
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.8]} />
          <meshPhysicalMaterial color="#8B4513" roughness={0.8} />
        </mesh>
      ) : (
        // Corner legs for rectangular tables
        [
          [-table.w/2 + 0.1, -table.h/2 + 0.1],
          [table.w/2 - 0.1, -table.h/2 + 0.1],
          [-table.w/2 + 0.1, table.h/2 - 0.1],
          [table.w/2 - 0.1, table.h/2 - 0.1]
        ].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.4, z]} castShadow>
            <cylinderGeometry args={[0.05, 0.05, 0.8]} />
            <meshPhysicalMaterial color="#654321" roughness={0.8} />
          </mesh>
        ))
      )}

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
  const { tables, selectedTableIds, toggleTableSelection, zones, showGrid, fixtures } = useTableStore();

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <pointLight position={[10, 10, 10]} />
      <directionalLight position={[5, 5, 5]} intensity={0.4} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      {/* Grid */}
      {showGrid && (
        <CustomGrid 
          size={20} 
          divisions={20}
          color="#e2e8f0"
        />
      )}

      {/* Tables */}
      {tables.map((table) => (
        <Table3D
          key={table.id}
          table={table}
          isSelected={selectedTableIds.includes(table.id)}
          onClick={() => toggleTableSelection(table.id)}
        />
      ))}

      {/* Zones */}
      {zones.map((zone) => zone.bounds ? (
        <mesh key={zone.id} position={[zone.bounds.x / 100 - 6, -0.04, zone.bounds.y / 100 - 4]}>
          <planeGeometry args={[zone.bounds.w / 100, zone.bounds.h / 100]} />
          <meshBasicMaterial 
            color={zone.color} 
            transparent 
            opacity={0.1}
          />
        </mesh>
      ) : null)}

      {/* Fixtures */}
      {fixtures.map((fixture) => (
        <mesh key={fixture.id} position={[fixture.x / 100 - 6, 0.1, fixture.y / 100 - 4]}>
          <boxGeometry args={[fixture.w / 100, 0.2, fixture.h / 100]} />
          <meshStandardMaterial color="#64748b" />
        </mesh>
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
    selectedTableIds, 
    showGrid, 
    showZones, 
    gridSize,
    toggleTableSelection,
    moveTable,
    resizeTable
  } = useTableStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragTableId, setDragTableId] = useState<string | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }

    // Draw zones
    if (showZones) {
      zones.forEach((zone) => {
        if (zone.bounds) {
          ctx.fillStyle = zone.color + '20';
          ctx.strokeStyle = zone.color;
          ctx.lineWidth = 2;
          ctx.fillRect(zone.bounds.x, zone.bounds.y, zone.bounds.w, zone.bounds.h);
          ctx.strokeRect(zone.bounds.x, zone.bounds.y, zone.bounds.w, zone.bounds.h);
          
          // Zone label
          ctx.fillStyle = zone.color;
          ctx.font = '12px sans-serif';
          ctx.fillText(zone.name, zone.bounds.x + 5, zone.bounds.y + 15);
        }
      });
    }

    // Draw fixtures
    fixtures.forEach((fixture) => {
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.fillRect(fixture.x, fixture.y, fixture.w, fixture.h);
      ctx.strokeRect(fixture.x, fixture.y, fixture.w, fixture.h);
      
      // Fixture label
      ctx.fillStyle = 'white';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        fixture.kind, 
        fixture.x + fixture.w / 2, 
        fixture.y + fixture.h / 2 + 3
      );
    });

    // Draw tables
    tables.forEach((table) => {
      const isSelected = selectedTableIds.includes(table.id);
      
      // Table color based on status
      let color = '#10b981'; // FREE
      switch (table.status) {
        case 'SEATED': color = '#ef4444'; break;
        case 'RESERVED': color = '#f59e0b'; break;
        case 'DIRTY': color = '#6b7280'; break;
      }

      if (isSelected) {
        color = '#3b82f6';
      }

      ctx.fillStyle = color;
      ctx.strokeStyle = isSelected ? '#1d4ed8' : '#374151';
      ctx.lineWidth = isSelected ? 3 : 1;

      // Draw table shape
      if (table.shape === 'round') {
        ctx.beginPath();
        ctx.arc(table.x + table.w / 2, table.y + table.h / 2, table.w / 2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(table.x, table.y, table.w, table.h);
        ctx.strokeRect(table.x, table.y, table.w, table.h);
      }

      // Draw table label
      ctx.fillStyle = 'white';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        table.label, 
        table.x + table.w / 2, 
        table.y + table.h / 2 + 4
      );

      // Draw chairs
      const chairRadius = 8;
      const chairDistance = Math.max(table.w, table.h) / 2 + 15;
      for (let i = 0; i < table.capacity; i++) {
        const angle = (i * 2 * Math.PI) / table.capacity;
        const chairX = table.x + table.w / 2 + Math.cos(angle) * chairDistance;
        const chairY = table.y + table.h / 2 + Math.sin(angle) * chairDistance;
        
        ctx.fillStyle = '#8b5cf6';
        ctx.beginPath();
        ctx.arc(chairX, chairY, chairRadius, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Draw selection handles
      if (isSelected) {
        const handleSize = 6;
        ctx.fillStyle = '#1d4ed8';
        // Corner handles
        const corners = [
          { x: table.x - handleSize / 2, y: table.y - handleSize / 2 },
          { x: table.x + table.w - handleSize / 2, y: table.y - handleSize / 2 },
          { x: table.x + table.w - handleSize / 2, y: table.y + table.h - handleSize / 2 },
          { x: table.x - handleSize / 2, y: table.y + table.h - handleSize / 2 }
        ];
        corners.forEach((corner) => {
          ctx.fillRect(corner.x, corner.y, handleSize, handleSize);
        });
      }
    });
  }, [tables, zones, fixtures, selectedTableIds, showGrid, showZones, gridSize]);

  // Mouse event handlers
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

    moveTable(dragTableId, newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTableId(null);
  };

  useEffect(() => {
    draw();
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      width={1200}
      height={800}
      className="w-full h-full border border-slate-200 bg-white rounded-lg"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    />
  );
}

// Main Floor Editor Canvas Component
export function FloorEditorCanvas() {
  const { viewMode, isLoading } = useTableStore();

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
          <Scene3D />
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
// 3D Restaurant Floor
function RestaurantFloor() {
  const { tables, selectedTableIds, selectTable } = useTableStore();

  return (
    <>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.1, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshPhysicalMaterial 
          color="#f8fafc"
          roughness={0.1}
          metalness={0.05}
        />
      </mesh>

      {/* Restaurant Walls */}
      <mesh position={[0, 2, -10]} castShadow>
        <boxGeometry args={[30, 4, 0.2]} />
        <meshPhysicalMaterial color="#e2e8f0" />
      </mesh>
      
      <mesh position={[0, 2, 10]} castShadow>
        <boxGeometry args={[30, 4, 0.2]} />
        <meshPhysicalMaterial color="#e2e8f0" />
      </mesh>

      <mesh position={[-15, 2, 0]} castShadow>
        <boxGeometry args={[0.2, 4, 20]} />
        <meshPhysicalMaterial color="#e2e8f0" />
      </mesh>

      <mesh position={[15, 2, 0]} castShadow>
        <boxGeometry args={[0.2, 4, 20]} />
        <meshPhysicalMaterial color="#e2e8f0" />
      </mesh>

      {/* Tables */}
      {tables.map((table) => (
        <Table3D
          key={table.id}
          table={table}
          isSelected={selectedTableIds.includes(table.id)}
          onClick={() => selectTable(table.id)}
        />
      ))}

      {/* Zone Indicators */}
      <Grid 
        args={[30, 20]} 
        position={[0, 0.05, 0]}
        cellColor="#cbd5e1"
        sectionColor="#94a3b8"
        fadeDistance={50}
        fadeStrength={2}
      />
    </>
  );
}

// Camera Controls
function CameraController() {
  const { camera } = useThree();
  
  React.useEffect(() => {
    camera.position.set(10, 15, 10);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}

// Default export for dynamic imports
export default FloorEditorCanvas;

