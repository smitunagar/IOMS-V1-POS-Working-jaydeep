'use client';

import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import { Mesh, Vector3, Color } from 'three';
import { useTableManagementStore, useTables, useSelectedObject, useDragState } from '@/stores/tableManagementStore';
import type { Table3D } from '@/stores/tableManagementStore';

interface Table3DComponentProps {
  table: Table3D;
  isSelected: boolean;
  isDragging: boolean;
  onPointerDown: (event: any, table: Table3D) => void;
  onPointerEnter: (event: any, table: Table3D) => void;
  onPointerLeave: (event: any) => void;
}

function Table3DComponent({
  table,
  isSelected,
  isDragging,
  onPointerDown,
  onPointerEnter,
  onPointerLeave
}: Table3DComponentProps) {
  const meshRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Status colors
  const statusColors = {
    FREE: '#10b981',      // green-500
    SEATED: '#ef4444',    // red-500
    DIRTY: '#f59e0b',     // amber-500
    RESERVED: '#3b82f6'   // blue-500
  };

  // Animation for selected state
  useFrame((state) => {
    if (meshRef.current && isSelected) {
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.05 + table.z + 0.05;
    } else if (meshRef.current) {
      meshRef.current.position.y = table.z;
    }
  });

  // Table geometry based on shape
  const tableGeometry = useMemo(() => {
    switch (table.shape) {
      case 'circle':
        return (
          <cylinderGeometry args={[table.width / 2, table.width / 2, 0.1, 32]} />
        );
      case 'square':
        return (
          <boxGeometry args={[table.width, 0.1, table.height]} />
        );
      case 'rectangle':
        return (
          <boxGeometry args={[table.width, 0.1, table.height]} />
        );
      default:
        return (
          <cylinderGeometry args={[table.width / 2, table.width / 2, 0.1, 32]} />
        );
    }
  }, [table.shape, table.width, table.height]);

  // Material based on status and selection
  const tableMaterial = useMemo(() => {
    const baseColor = statusColors[table.status];
    const color = new Color(baseColor);
    
    if (isSelected) {
      color.multiplyScalar(1.2); // Brighten selected tables
    }
    if (hovered) {
      color.multiplyScalar(1.1); // Slightly brighten hovered tables
    }
    if (isDragging) {
      color.multiplyScalar(0.8); // Darken dragging tables
    }
    
    return (
      <meshLambertMaterial
        color={color}
        transparent
        opacity={isDragging ? 0.7 : 1}
        emissive={isSelected ? new Color(baseColor).multiplyScalar(0.1) : new Color(0x000000)}
      />
    );
  }, [table.status, isSelected, hovered, isDragging]);

  // Collision detection visualization
  const hasCollision = useTableManagementStore(state => 
    state.checkCollisions(table.id, table, { width: table.width, height: table.height, depth: table.depth })
  );

  return (
    <group
      position={[table.x, table.z, table.y]}
      rotation={[0, table.rotation, 0]}
    >
      {/* Table surface */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        onPointerDown={(e) => {
          e.stopPropagation();
          onPointerDown(e, table);
        }}
        onPointerEnter={(e) => {
          e.stopPropagation();
          setHovered(true);
          onPointerEnter(e, table);
        }}
        onPointerLeave={(e) => {
          e.stopPropagation();
          setHovered(false);
          onPointerLeave(e);
        }}
      >
        {tableGeometry}
        {tableMaterial}
      </mesh>

      {/* Table legs */}
      <TableLegs table={table} />

      {/* Selection outline */}
      {isSelected && (
        <mesh position={[0, 0.06, 0]}>
          {table.shape === 'circle' ? (
            <ringGeometry args={[table.width / 2 - 0.05, table.width / 2 + 0.05, 32]} />
          ) : (
            <planeGeometry args={[table.width + 0.1, table.height + 0.1]} />
          )}
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Collision warning */}
      {hasCollision && (
        <mesh position={[0, 0.07, 0]}>
          {table.shape === 'circle' ? (
            <ringGeometry args={[table.width / 2 - 0.1, table.width / 2 + 0.1, 32]} />
          ) : (
            <planeGeometry args={[table.width + 0.2, table.height + 0.2]} />
          )}
          <meshBasicMaterial color="#ef4444" transparent opacity={0.5} />
        </mesh>
      )}

      {/* Table number label */}
      <Text
        position={[0, 0.12, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-medium.woff"
      >
        {table.number}
      </Text>

      {/* Seat count indicator */}
      <Text
        position={[0, 0.13, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        color="rgba(255,255,255,0.8)"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-regular.woff"
      >
        {table.seats} seats
      </Text>

      {/* Status indicator (floating) */}
      <mesh position={[table.width / 2 + 0.2, 0.5, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={statusColors[table.status]} />
      </mesh>

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[0, 1, 0]}
          center
          distanceFactor={10}
          occlude
        >
          <div className="bg-black bg-opacity-80 text-white p-2 rounded text-xs whitespace-nowrap pointer-events-none">
            <div className="font-semibold">Table {table.number}</div>
            <div>Seats: {table.seats}</div>
            <div>Status: {table.status}</div>
            <div>Zone: {table.zone || 'None'}</div>
            {table.parentId && <div className="text-blue-300">Split from: {table.parentId}</div>}
            {table.childIds && <div className="text-green-300">Merged: {table.childIds.join(', ')}</div>}
          </div>
        </Html>
      )}
    </group>
  );
}

interface TableLegsProps {
  table: Table3D;
}

function TableLegs({ table }: TableLegsProps) {
  const legHeight = 0.8;
  const legRadius = 0.05;

  // Calculate leg positions based on table shape
  const legPositions = useMemo(() => {
    if (table.shape === 'circle') {
      // 4 legs around the perimeter
      const radius = (table.width / 2) * 0.7;
      return [
        [radius, -legHeight / 2, 0],
        [-radius, -legHeight / 2, 0],
        [0, -legHeight / 2, radius],
        [0, -legHeight / 2, -radius]
      ];
    } else {
      // Rectangle/square - legs at corners
      const offsetX = (table.width / 2) * 0.8;
      const offsetZ = (table.height / 2) * 0.8;
      return [
        [offsetX, -legHeight / 2, offsetZ],
        [-offsetX, -legHeight / 2, offsetZ],
        [offsetX, -legHeight / 2, -offsetZ],
        [-offsetX, -legHeight / 2, -offsetZ]
      ];
    }
  }, [table.shape, table.width, table.height]);

  return (
    <>
      {legPositions.map((position, index) => (
        <mesh
          key={`leg-${index}`}
          position={position as [number, number, number]}
          castShadow
        >
          <cylinderGeometry args={[legRadius, legRadius, legHeight, 8]} />
          <meshLambertMaterial color="#8b4513" />
        </mesh>
      ))}
    </>
  );
}

export function Tables3D() {
  const tables = useTables();
  const { object: selectedObject, type: selectedType } = useSelectedObject();
  const dragState = useDragState();
  const { camera, mouse, raycaster, scene } = useThree();
  
  const {
    selectObject,
    startDrag,
    updateDrag,
    endDrag,
    updateTable
  } = useTableManagementStore();

  const selectedTableId = selectedType === 'table' ? selectedObject?.id : null;
  const draggingTableId = dragState.objectType === 'table' ? dragState.objectId : null;

  // Mouse handlers
  const handlePointerDown = (event: any, table: Table3D) => {
    event.stopPropagation();
    selectObject(table, 'table');
    
    // Calculate mouse position in 3D space
    const rect = event.target.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    mouse.set(x, y);
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0) {
      const point = intersects[0].point;
      const offset = {
        x: point.x - table.x,
        y: point.y - table.y,
        z: point.z - table.z
      };
      
      startDrag(table.id, 'table', { x: table.x, y: table.y, z: table.z }, offset);
      
      // Add mouse move and up event listeners
      const handleMouseMove = (e: MouseEvent) => {
        const rect = event.target.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        
        mouse.set(x, y);
        raycaster.setFromCamera(mouse, camera);
        
        const intersects = raycaster.intersectObjects(scene.children, true);
        if (intersects.length > 0) {
          const point = intersects[0].point;
          updateDrag({ x: point.x, y: point.y, z: point.z });
        }
      };
      
      const handleMouseUp = () => {
        endDrag();
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  };

  const handlePointerEnter = (event: any, table: Table3D) => {
    document.body.style.cursor = 'grab';
  };

  const handlePointerLeave = (event: any) => {
    document.body.style.cursor = 'auto';
  };

  // Handle dragging state change
  React.useEffect(() => {
    if (dragState.isDragging && dragState.objectType === 'table') {
      document.body.style.cursor = 'grabbing';
    } else {
      document.body.style.cursor = 'auto';
    }
  }, [dragState.isDragging, dragState.objectType]);

  // Memoize table components for performance
  const tableComponents = useMemo(() => {
    return tables.map(table => (
      <Table3DComponent
        key={table.id}
        table={table}
        isSelected={selectedTableId === table.id}
        isDragging={draggingTableId === table.id}
        onPointerDown={handlePointerDown}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      />
    ));
  }, [tables, selectedTableId, draggingTableId]);

  return (
    <group name="tables">
      {tableComponents}
    </group>
  );
}

export default Tables3D;
