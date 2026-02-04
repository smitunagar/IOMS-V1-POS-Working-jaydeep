'use client';

import React, { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import { Color } from 'three';
import { useFixtures, useSelectedObject, useTableManagementStore } from '@/stores/tableManagementStore';
import type { Fixture3D } from '@/stores/tableManagementStore';

interface Fixture3DComponentProps {
  fixture: Fixture3D;
  isSelected: boolean;
  onClick: (fixture: Fixture3D) => void;
  onHover: (fixture: Fixture3D | null) => void;
}

function Fixture3DComponent({ fixture, isSelected, onClick, onHover }: Fixture3DComponentProps) {
  const [hovered, setHovered] = useState(false);

  // Fixture colors based on type
  const fixtureColors = useMemo(() => {
    const colorMap = {
      door: '#8b4513',      // Brown
      window: '#87ceeb',    // Sky blue
      bar: '#d2691e',       // Chocolate
      restroom: '#9333ea',  // Purple
      stage: '#dc2626',     // Red
      column: '#6b7280',    // Gray
      kitchen: '#ef4444'    // Red
    };
    return colorMap[fixture.type] || '#6b7280';
  }, [fixture.type]);

  const fixtureMaterial = useMemo(() => {
    let baseColor = new Color(fixtureColors);
    
    if (isSelected) {
      baseColor.multiplyScalar(1.3);
    }
    if (hovered) {
      baseColor.multiplyScalar(1.1);
    }
    
    return baseColor;
  }, [fixtureColors, isSelected, hovered]);

  // Render different geometry based on fixture type
  const renderFixtureGeometry = () => {
    switch (fixture.type) {
      case 'door':
        return (
          <group>
            {/* Door frame */}
            <mesh position={[0, fixture.height / 2, 0]}>
              <boxGeometry args={[fixture.width, fixture.height, 0.1]} />
              <meshLambertMaterial color={fixtureMaterial} />
            </mesh>
            {/* Door handle */}
            <mesh position={[fixture.width * 0.4, fixture.height * 0.5, 0.06]}>
              <sphereGeometry args={[0.05, 8, 8]} />
              <meshLambertMaterial color="#ffd700" />
            </mesh>
          </group>
        );

      case 'window':
        return (
          <group>
            {/* Window frame */}
            <mesh position={[0, fixture.height / 2, 0]}>
              <boxGeometry args={[fixture.width, fixture.height, 0.05]} />
              <meshLambertMaterial color="#8b4513" />
            </mesh>
            {/* Glass */}
            <mesh position={[0, fixture.height / 2, 0.03]}>
              <boxGeometry args={[fixture.width * 0.9, fixture.height * 0.9, 0.02]} />
              <meshLambertMaterial color="#87ceeb" transparent opacity={0.3} />
            </mesh>
          </group>
        );

      case 'bar':
        return (
          <group>
            {/* Bar counter */}
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[fixture.width, 1, fixture.depth]} />
              <meshLambertMaterial color={fixtureMaterial} />
            </mesh>
            {/* Bar stools positions (visual indicators) */}
            {Array.from({ length: Math.floor(fixture.width / 0.8) }, (_, i) => (
              <mesh 
                key={i}
                position={[
                  -fixture.width / 2 + (i + 0.5) * (fixture.width / Math.floor(fixture.width / 0.8)),
                  0.6,
                  fixture.depth / 2 + 0.5
                ]}
              >
                <cylinderGeometry args={[0.15, 0.15, 0.05, 16]} />
                <meshLambertMaterial color="#8b4513" />
              </mesh>
            ))}
          </group>
        );

      case 'restroom':
        return (
          <group>
            {/* Restroom structure */}
            <mesh position={[0, fixture.height / 2, 0]}>
              <boxGeometry args={[fixture.width, fixture.height, fixture.depth]} />
              <meshLambertMaterial color={fixtureMaterial} />
            </mesh>
            {/* Door */}
            <mesh position={[fixture.width / 2 - 0.05, fixture.height / 2, fixture.depth / 2 + 0.01]}>
              <boxGeometry args={[0.8, 2, 0.05]} />
              <meshLambertMaterial color="#8b4513" />
            </mesh>
          </group>
        );

      case 'stage':
        return (
          <group>
            {/* Stage platform */}
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[fixture.width, 0.5, fixture.depth]} />
              <meshLambertMaterial color={fixtureMaterial} />
            </mesh>
            {/* Stage curtains (visual) */}
            <mesh position={[0, 1.5, -fixture.depth / 2]}>
              <boxGeometry args={[fixture.width, 2, 0.1]} />
              <meshLambertMaterial color="#8b0000" />
            </mesh>
          </group>
        );

      case 'kitchen':
        return (
          <group>
            {/* Kitchen area */}
            <mesh position={[0, fixture.height / 2, 0]}>
              <boxGeometry args={[fixture.width, fixture.height, fixture.depth]} />
              <meshLambertMaterial color={fixtureMaterial} />
            </mesh>
            {/* Equipment indicators */}
            <mesh position={[fixture.width / 4, fixture.height + 0.1, 0]}>
              <boxGeometry args={[0.5, 0.2, 0.5]} />
              <meshLambertMaterial color="#c0c0c0" />
            </mesh>
            <mesh position={[-fixture.width / 4, fixture.height + 0.1, 0]}>
              <boxGeometry args={[0.5, 0.2, 0.5]} />
              <meshLambertMaterial color="#c0c0c0" />
            </mesh>
          </group>
        );

      case 'column':
        return (
          <mesh position={[0, fixture.height / 2, 0]}>
            <cylinderGeometry args={[fixture.width / 2, fixture.width / 2, fixture.height, 16]} />
            <meshLambertMaterial color={fixtureMaterial} />
          </mesh>
        );

      default:
        return (
          <mesh position={[0, fixture.height / 2, 0]}>
            <boxGeometry args={[fixture.width, fixture.height, fixture.depth]} />
            <meshLambertMaterial color={fixtureMaterial} />
          </mesh>
        );
    }
  };

  return (
    <group
      position={[fixture.x, fixture.z, fixture.y]}
      rotation={[0, fixture.rotation, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onClick(fixture);
      }}
      onPointerEnter={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover(fixture);
        document.body.style.cursor = 'pointer';
      }}
      onPointerLeave={(e) => {
        e.stopPropagation();
        setHovered(false);
        onHover(null);
        document.body.style.cursor = 'auto';
      }}
    >
      {renderFixtureGeometry()}

      {/* Selection outline */}
      {isSelected && (
        <mesh position={[0, fixture.height / 2, 0]}>
          <boxGeometry args={[fixture.width + 0.1, fixture.height + 0.1, fixture.depth + 0.1]} />
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
        <mesh position={[0, fixture.height / 2, 0]}>
          <boxGeometry args={[fixture.width + 0.05, fixture.height + 0.05, fixture.depth + 0.05]} />
          <meshBasicMaterial 
            color="#fbbf24" 
            transparent 
            opacity={0.2} 
            wireframe 
          />
        </mesh>
      )}

      {/* Label */}
      {fixture.label && (
        <Html
          position={[0, fixture.height + 0.3, 0]}
          center
          distanceFactor={8}
          occlude
        >
          <div className="bg-white bg-opacity-90 text-black p-1 rounded text-xs font-medium pointer-events-none shadow-sm">
            {fixture.label}
          </div>
        </Html>
      )}

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[0, fixture.height + 0.8, 0]}
          center
          distanceFactor={10}
          occlude
        >
          <div className="bg-black bg-opacity-80 text-white p-2 rounded text-xs whitespace-nowrap pointer-events-none">
            <div className="font-semibold capitalize">{fixture.type}</div>
            {fixture.label && <div>{fixture.label}</div>}
            <div>Size: {fixture.width.toFixed(1)}×{fixture.height.toFixed(1)}×{fixture.depth.toFixed(1)}m</div>
            <div>Rotation: {(fixture.rotation * 180 / Math.PI).toFixed(0)}°</div>
            {fixture.meta && Object.keys(fixture.meta).length > 0 && (
              <div className="text-xs opacity-75 mt-1">
                {Object.entries(fixture.meta).map(([key, value]) => (
                  <div key={key}>{key}: {String(value)}</div>
                ))}
              </div>
            )}
          </div>
        </Html>
      )}

      {/* Functional indicators */}
      {fixture.type === 'restroom' && (
        <Html
          position={[0, fixture.height + 0.5, fixture.depth / 2 + 0.1]}
          center
          distanceFactor={6}
          occlude
        >
          <div className="text-2xl pointer-events-none">
            🚻
          </div>
        </Html>
      )}

      {fixture.type === 'kitchen' && (
        <Html
          position={[0, fixture.height + 0.5, 0]}
          center
          distanceFactor={6}
          occlude
        >
          <div className="text-2xl pointer-events-none">
            👨‍🍳
          </div>
        </Html>
      )}

      {fixture.type === 'bar' && (
        <Html
          position={[0, 1.2, 0]}
          center
          distanceFactor={6}
          occlude
        >
          <div className="text-2xl pointer-events-none">
            🍸
          </div>
        </Html>
      )}
    </group>
  );
}

export function Fixtures3D() {
  const fixtures = useFixtures();
  const { object: selectedObject, type: selectedType } = useSelectedObject();
  const [hoveredFixture, setHoveredFixture] = useState<Fixture3D | null>(null);
  
  const { selectObject } = useTableManagementStore();

  const selectedFixtureId = selectedType === 'fixture' ? selectedObject?.id : null;

  const handleFixtureClick = (fixture: Fixture3D) => {
    selectObject(fixture, 'fixture');
  };

  const handleFixtureHover = (fixture: Fixture3D | null) => {
    setHoveredFixture(fixture);
  };

  // Performance optimization: memoize fixture components
  const fixtureComponents = useMemo(() => {
    return fixtures.map(fixture => (
      <Fixture3DComponent
        key={fixture.id}
        fixture={fixture}
        isSelected={selectedFixtureId === fixture.id}
        onClick={handleFixtureClick}
        onHover={handleFixtureHover}
      />
    ));
  }, [fixtures, selectedFixtureId]);

  return (
    <group name="fixtures">
      {fixtureComponents}
    </group>
  );
}

export default Fixtures3D;
