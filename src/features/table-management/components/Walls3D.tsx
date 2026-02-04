'use client';

import React, { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import { Color, BoxGeometry } from 'three';
import * as THREE from 'three';
import { useTableManagementStore, useFloorPlan, useSelectedObject } from '@/stores/tableManagementStore';
import type { Wall3D } from '@/stores/tableManagementStore';

interface Wall3DComponentProps {
  wall: Wall3D;
  isSelected: boolean;
  onClick: (wall: Wall3D) => void;
  onHover: (wall: Wall3D | null) => void;
}

function Wall3DComponent({ wall, isSelected, onClick, onHover }: Wall3DComponentProps) {
  const [hovered, setHovered] = useState(false);

  // Wall material based on type and state
  const wallMaterial = useMemo(() => {
    let baseColor = new Color(wall.color);
    
    // Material variations
    switch (wall.material) {
      case 'brick':
        baseColor = new Color('#8b4513');
        break;
      case 'glass':
        baseColor = new Color('#87ceeb');
        break;
      case 'wood':
        baseColor = new Color('#deb887');
        break;
      case 'concrete':
        baseColor = new Color('#808080');
        break;
      default:
        baseColor = new Color(wall.color);
    }
    
    if (isSelected) {
      baseColor.multiplyScalar(1.3);
    }
    if (hovered) {
      baseColor.multiplyScalar(1.1);
    }
    
    return baseColor;
  }, [wall.color, wall.material, isSelected, hovered]);

  // Different textures and opacity based on material
  const materialProps = useMemo(() => {
    switch (wall.material) {
      case 'glass':
        return { transparent: true, opacity: 0.3 };
      case 'concrete':
        return { roughness: 0.8, metalness: 0.1 };
      case 'wood':
        return { roughness: 0.7, metalness: 0.0 };
      case 'brick':
        return { roughness: 0.9, metalness: 0.0 };
      default:
        return { roughness: 0.5, metalness: 0.1 };
    }
  }, [wall.material]);

  return (
    <group
      position={[wall.x, wall.z, wall.y]}
      rotation={[0, wall.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick(wall);
      }}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(wall);
        document.body.style.cursor = 'pointer';
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHovered(false);
        onHover(null);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Main wall structure */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[wall.width, wall.height, wall.depth]} />
        <meshLambertMaterial 
          color={wallMaterial} 
          {...materialProps}
        />
      </mesh>

      {/* Selection outline */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[wall.width + 0.1, wall.height + 0.1, wall.depth + 0.1]} />
          <meshBasicMaterial 
            color="#3b82f6" 
            transparent 
            opacity={0.3} 
            wireframe 
          />
        </mesh>
      )}

      {/* Hover highlight */}
      {hovered && (
        <mesh>
          <boxGeometry args={[wall.width + 0.05, wall.height + 0.05, wall.depth + 0.05]} />
          <meshBasicMaterial 
            color="#fbbf24" 
            transparent 
            opacity={0.2} 
            wireframe 
          />
        </mesh>
      )}

      {/* Wall thickness indicator lines for better depth perception */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(wall.width, wall.height, wall.depth)]} />
        <lineBasicMaterial color="#374151" />
      </lineSegments>

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[0, wall.height / 2 + 0.5, 0]}
          center
          distanceFactor={10}
          occlude
        >
          <div className="bg-black bg-opacity-80 text-white p-2 rounded text-xs whitespace-nowrap pointer-events-none">
            <div className="font-semibold">Wall</div>
            <div>Material: {wall.material}</div>
            <div>Size: {wall.width.toFixed(1)}×{wall.height.toFixed(1)}×{wall.depth.toFixed(1)}m</div>
            <div>Rotation: {(wall.rotation * 180 / Math.PI).toFixed(0)}°</div>
          </div>
        </Html>
      )}
    </group>
  );
}

interface StructuralElementProps {
  type: 'column' | 'beam' | 'foundation';
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
}

function StructuralElement({ type, position, size, color = '#6b7280' }: StructuralElementProps) {
  const [hovered, setHovered] = useState(false);

  const elementColor = useMemo(() => {
    const baseColor = new Color(color);
    if (hovered) {
      baseColor.multiplyScalar(1.2);
    }
    return baseColor;
  }, [color, hovered]);

  return (
    <group position={position}>
      <mesh
        castShadow
        receiveShadow
        onPointerEnter={() => {
          setHovered(true);
          document.body.style.cursor = 'pointer';
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = 'auto';
        }}
      >
        {type === 'column' ? (
          <cylinderGeometry args={[size[0], size[0], size[1], 16]} />
        ) : (
          <boxGeometry args={size} />
        )}
        <meshLambertMaterial color={elementColor} />
      </mesh>

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[0, size[1] / 2 + 0.3, 0]}
          center
          distanceFactor={8}
          occlude
        >
          <div className="bg-black bg-opacity-80 text-white p-1 rounded text-xs whitespace-nowrap pointer-events-none">
            <div className="capitalize">{type}</div>
            <div>{size[0].toFixed(1)}×{size[1].toFixed(1)}×{size[2].toFixed(1)}m</div>
          </div>
        </Html>
      )}
    </group>
  );
}

export function Walls3D() {
  const floorPlan = useFloorPlan();
  const { object: selectedObject, type: selectedType } = useSelectedObject();
  const [hoveredWall, setHoveredWall] = useState<Wall3D | null>(null);
  
  const {
    selectObject,
    updateWall,
    deleteWall
  } = useTableManagementStore();

  const selectedWallId = selectedType === 'fixture' && selectedObject?.id?.startsWith('wall-') 
    ? selectedObject.id 
    : null;

  const handleWallClick = (wall: Wall3D) => {
    selectObject(wall as any, 'fixture');
  };

  const handleWallHover = (wall: Wall3D | null) => {
    setHoveredWall(wall);
  };

  // Generate default perimeter walls if none exist
  const walls = useMemo(() => {
    if (floorPlan.walls.length > 0) {
      return floorPlan.walls;
    }

    // Create default perimeter walls
    const defaultWalls: Wall3D[] = [
      {
        id: 'wall-north',
        x: 0,
        y: -floorPlan.height / 2,
        z: 0,
        width: floorPlan.width,
        height: 3,
        depth: 0.2,
        rotation: 0,
        color: '#e5e7eb',
        material: 'concrete'
      },
      {
        id: 'wall-south',
        x: 0,
        y: floorPlan.height / 2,
        z: 0,
        width: floorPlan.width,
        height: 3,
        depth: 0.2,
        rotation: 0,
        color: '#e5e7eb',
        material: 'concrete'
      },
      {
        id: 'wall-east',
        x: floorPlan.width / 2,
        y: 0,
        z: 0,
        width: 0.2,
        height: 3,
        depth: floorPlan.height,
        rotation: 0,
        color: '#e5e7eb',
        material: 'concrete'
      },
      {
        id: 'wall-west',
        x: -floorPlan.width / 2,
        y: 0,
        z: 0,
        width: 0.2,
        height: 3,
        depth: floorPlan.height,
        rotation: 0,
        color: '#e5e7eb',
        material: 'concrete'
      }
    ];

    return defaultWalls;
  }, [floorPlan.walls, floorPlan.width, floorPlan.height]);

  // Structural elements (columns, beams)
  const structuralElements = useMemo(() => {
    const elements: React.ReactNode[] = [];
    
    // Add corner columns for large spaces
    if (floorPlan.width > 20 || floorPlan.height > 20) {
      const columnPositions = [
        [-floorPlan.width / 4, 1.5, -floorPlan.height / 4],
        [floorPlan.width / 4, 1.5, -floorPlan.height / 4],
        [-floorPlan.width / 4, 1.5, floorPlan.height / 4],
        [floorPlan.width / 4, 1.5, floorPlan.height / 4]
      ];

      columnPositions.forEach((position, index) => {
        elements.push(
          <StructuralElement
            key={`column-${index}`}
            type="column"
            position={position as [number, number, number]}
            size={[0.3, 3, 0.3]}
            color="#6b7280"
          />
        );
      });
    }

    return elements;
  }, [floorPlan.width, floorPlan.height]);

  return (
    <group name="walls-and-structure">
      {/* Walls */}
      <group name="walls">
        {walls.map(wall => (
          <Wall3DComponent
            key={wall.id}
            wall={wall}
            isSelected={selectedWallId === wall.id}
            onClick={handleWallClick}
            onHover={handleWallHover}
          />
        ))}
      </group>

      {/* Structural elements */}
      <group name="structural-elements">
        {structuralElements}
      </group>

      {/* Floor base */}
      <mesh 
        position={[0, -0.1, 0]} 
        receiveShadow
      >
        <boxGeometry args={[floorPlan.width, 0.1, floorPlan.height]} />
        <meshLambertMaterial color="#f3f4f6" />
      </mesh>

      {/* Ceiling (optional, for enclosed feeling) */}
      <mesh 
        position={[0, 3.1, 0]} 
        receiveShadow
      >
        <boxGeometry args={[floorPlan.width, 0.1, floorPlan.height]} />
        <meshLambertMaterial 
          color="#ffffff" 
          transparent 
          opacity={0.1} 
        />
      </mesh>
    </group>
  );
}

export default Walls3D;
