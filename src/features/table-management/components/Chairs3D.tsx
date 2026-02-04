'use client';

import React, { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import { Color } from 'three';
import { useChairs, useTables, useSelectedObject } from '@/stores/tableManagementStore';
import type { Chair3D, Table3D } from '@/stores/tableManagementStore';

interface Chair3DComponentProps {
  chair: Chair3D;
  table?: Table3D;
  isTableSelected: boolean;
  onClick: (chair: Chair3D) => void;
  onHover: (chair: Chair3D | null) => void;
}

function Chair3DComponent({ 
  chair, 
  table, 
  isTableSelected, 
  onClick, 
  onHover 
}: Chair3DComponentProps) {
  const [hovered, setHovered] = useState(false);

  // Chair colors based on table status
  const chairColors = useMemo(() => {
    if (!table) return { base: '#8b4513', cushion: '#d2691e' };
    
    const statusColorMap = {
      FREE: { base: '#8b4513', cushion: '#d2691e' },      // Brown wood
      SEATED: { base: '#7f1d1d', cushion: '#dc2626' },    // Red occupied
      DIRTY: { base: '#92400e', cushion: '#f59e0b' },     // Amber dirty
      RESERVED: { base: '#1e40af', cushion: '#3b82f6' }   // Blue reserved
    };
    
    return statusColorMap[table.status];
  }, [table?.status]);

  const chairMaterial = useMemo(() => {
    const baseColor = new Color(chairColors.base);
    if (isTableSelected) {
      baseColor.multiplyScalar(1.2);
    }
    if (hovered) {
      baseColor.multiplyScalar(1.1);
    }
    
    return baseColor;
  }, [chairColors.base, isTableSelected, hovered]);

  const cushionMaterial = useMemo(() => {
    const cushionColor = new Color(chairColors.cushion);
    if (isTableSelected) {
      cushionColor.multiplyScalar(1.2);
    }
    if (hovered) {
      cushionColor.multiplyScalar(1.1);
    }
    
    return cushionColor;
  }, [chairColors.cushion, isTableSelected, hovered]);

  return (
    <group
      position={[chair.x, chair.z, chair.y]}
      rotation={[0, chair.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick(chair);
      }}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(chair);
        document.body.style.cursor = 'pointer';
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHovered(false);
        onHover(null);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Chair seat */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.05, 0.4]} />
        <meshLambertMaterial color={cushionMaterial} />
      </mesh>

      {/* Chair back */}
      <mesh position={[0, 0.65, -0.15]} castShadow>
        <boxGeometry args={[0.4, 0.5, 0.05]} />
        <meshLambertMaterial color={chairMaterial} />
      </mesh>

      {/* Chair legs */}
      {[
        [0.15, 0.2, 0.15],   // Front right
        [-0.15, 0.2, 0.15],  // Front left
        [0.15, 0.2, -0.15],  // Back right
        [-0.15, 0.2, -0.15]  // Back left
      ].map((position, index) => (
        <mesh
          key={`leg-${index}`}
          position={position as [number, number, number]}
          castShadow
        >
          <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
          <meshLambertMaterial color={chairMaterial} />
        </mesh>
      ))}

      {/* Seat number indicator (when table is selected) */}
      {isTableSelected && (
        <mesh position={[0, 0.46, 0]}>
          <circleGeometry args={[0.08, 16]} />
          <meshBasicMaterial color="white" transparent opacity={0.9} />
        </mesh>
      )}

      {isTableSelected && (
        <Html
          position={[0, 0.46, 0]}
          center
          distanceFactor={5}
          occlude
        >
          <div className="text-xs font-bold text-black pointer-events-none">
            {chair.seatNumber}
          </div>
        </Html>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[0, 1, 0]}
          center
          distanceFactor={8}
          occlude
        >
          <div className="bg-black bg-opacity-80 text-white p-1 rounded text-xs whitespace-nowrap pointer-events-none">
            <div>Seat {chair.seatNumber}</div>
            <div>Table {table?.number}</div>
            {table && <div className="text-xs opacity-75">{table.status}</div>}
          </div>
        </Html>
      )}

      {/* Selection highlight */}
      {hovered && (
        <mesh position={[0, 0.41, 0]}>
          <ringGeometry args={[0.25, 0.3, 16]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.5} />
        </mesh>
      )}
    </group>
  );
}

interface ChairGroupProps {
  chairs: Chair3D[];
  table: Table3D;
  isTableSelected: boolean;
  onChairClick: (chair: Chair3D) => void;
  onChairHover: (chair: Chair3D | null) => void;
}

function ChairGroup({ 
  chairs, 
  table, 
  isTableSelected, 
  onChairClick, 
  onChairHover 
}: ChairGroupProps) {
  return (
    <group name={`chairs-table-${table.id}`}>
      {chairs.map(chair => (
        <Chair3DComponent
          key={chair.id}
          chair={chair}
          table={table}
          isTableSelected={isTableSelected}
          onClick={onChairClick}
          onHover={onChairHover}
        />
      ))}
    </group>
  );
}

export function Chairs3D() {
  const chairs = useChairs();
  const tables = useTables();
  const { object: selectedObject, type: selectedType } = useSelectedObject();
  const [hoveredChair, setHoveredChair] = useState<Chair3D | null>(null);

  const selectedTableId = selectedType === 'table' ? selectedObject?.id : null;

  // Group chairs by table for better organization
  const chairsByTable = useMemo(() => {
    const groups: Record<string, Chair3D[]> = {};
    
    chairs.forEach(chair => {
      if (!groups[chair.tableId]) {
        groups[chair.tableId] = [];
      }
      groups[chair.tableId].push(chair);
    });
    
    return groups;
  }, [chairs]);

  // Create table lookup map
  const tableMap = useMemo(() => {
    const map: Record<string, Table3D> = {};
    tables.forEach(table => {
      map[table.id] = table;
    });
    return map;
  }, [tables]);

  const handleChairClick = (chair: Chair3D) => {
    console.log(`Clicked seat ${chair.seatNumber} at table ${tableMap[chair.tableId]?.number}`);
    // Could implement seat selection, reservation, etc.
  };

  const handleChairHover = (chair: Chair3D | null) => {
    setHoveredChair(chair);
  };

  // Performance optimization: only render chairs for existing tables
  const chairGroups = useMemo(() => {
    return Object.entries(chairsByTable)
      .filter(([tableId]) => tableMap[tableId]) // Only render chairs for existing tables
      .map(([tableId, tableChairs]) => {
        const table = tableMap[tableId];
        const isTableSelected = selectedTableId === tableId;
        
        return (
          <ChairGroup
            key={`chair-group-${tableId}`}
            chairs={tableChairs}
            table={table}
            isTableSelected={isTableSelected}
            onChairClick={handleChairClick}
            onChairHover={handleChairHover}
          />
        );
      });
  }, [chairsByTable, tableMap, selectedTableId]);

  return (
    <group name="chairs">
      {chairGroups}
    </group>
  );
}

export default Chairs3D;
