'use client';

import React, { Suspense, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, Environment, Stats, Html } from '@react-three/drei';
import { Vector3 } from 'three';
import { useTableManagementStore, useCamera } from '@/stores/tableManagementStore';
import { Tables3D } from './Tables3D';
import { Chairs3D } from './Chairs3D';
import { Walls3D } from './Walls3D';
import { Fixtures3D } from './Fixtures3D';
import { MiniMap2D } from './MiniMap2D';

interface CameraControllerProps {
  camera: {
    position: [number, number, number];
    target: [number, number, number];
    zoom: number;
  };
}

function CameraController({ camera }: CameraControllerProps) {
  const { camera: threeCamera } = useThree();
  const controlsRef = useRef<any>();

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(...camera.target);
      threeCamera.position.set(...camera.position);
      threeCamera.zoom = camera.zoom;
      threeCamera.updateProjectionMatrix();
      controlsRef.current.update();
    }
  }, [camera, threeCamera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={2}
      maxDistance={100}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2}
      onEnd={() => {
        if (controlsRef.current) {
          const updateCamera = useTableManagementStore.getState().updateCamera;
          updateCamera({
            position: [
              threeCamera.position.x,
              threeCamera.position.y,
              threeCamera.position.z
            ],
            target: [
              controlsRef.current.target.x,
              controlsRef.current.target.y,
              controlsRef.current.target.z
            ],
            zoom: threeCamera.zoom
          });
        }
      }}
    />
  );
}

interface GridFloorProps {
  width: number;
  height: number;
  gridSize: number;
  showGrid: boolean;
}

function GridFloor({ width, height, gridSize, showGrid }: GridFloorProps) {
  if (!showGrid) return null;

  return (
    <group>
      {/* Main floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[width, height]} />
        <meshLambertMaterial color="#f8f9fa" transparent opacity={0.8} />
      </mesh>
      
      {/* Grid */}
      <Grid
        args={[width, height]}
        cellSize={gridSize}
        cellThickness={0.5}
        cellColor="#e9ecef"
        sectionSize={gridSize * 5}
        sectionThickness={1}
        sectionColor="#6c757d"
        fadeDistance={50}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={false}
        position={[0, 0, 0]}
      />
    </group>
  );
}

interface LoadingFallbackProps {
  progress?: number;
}

function LoadingFallback({ progress = 0 }: LoadingFallbackProps) {
  return (
    <Html center>
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-lg">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <div className="text-sm text-gray-600 mb-2">Loading 3D Environment</div>
        <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-gray-500 mt-2">{Math.round(progress)}%</div>
      </div>
    </Html>
  );
}

interface ThreeFloorProps {
  className?: string;
  showStats?: boolean;
  enablePerformanceMonitor?: boolean;
}

export function ThreeFloor({ 
  className = '',
  showStats = false,
  enablePerformanceMonitor = false
}: ThreeFloorProps) {
  const floorPlan = useTableManagementStore(state => state.floorPlan);
  const showGrid = useTableManagementStore(state => state.showGrid);
  const showMiniMap = useTableManagementStore(state => state.showMiniMap);
  const camera = useCamera();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Performance optimization: Memoize heavy components
  const memoizedTables = React.useMemo(() => <Tables3D />, []);
  const memoizedChairs = React.useMemo(() => <Chairs3D />, []);
  const memoizedWalls = React.useMemo(() => <Walls3D />, []);
  const memoizedFixtures = React.useMemo(() => <Fixtures3D />, []);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        ref={canvasRef}
        camera={{
          position: camera.position,
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        shadows
        gl={{ 
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        onCreated={({ gl, scene, camera }) => {
          // Optimize WebGL settings
          gl.setClearColor('#f8f9fa', 1);
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = 2; // PCFSoftShadowMap
          
          // Set camera initial position
          camera.position.set(camera.position.x, camera.position.y, camera.position.z);
          camera.lookAt(new Vector3(0, 0, 0));
        }}
      >
        <Suspense fallback={<LoadingFallback />}>
          {/* Lighting setup */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 20, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />
          <pointLight position={[0, 10, 0]} intensity={0.3} />
          
          {/* Environment */}
          <Environment preset="warehouse" />
          
          {/* Camera controls */}
          <CameraController camera={camera} />
          
          {/* Floor and grid */}
          <GridFloor
            width={floorPlan.width}
            height={floorPlan.height}
            gridSize={floorPlan.gridSize}
            showGrid={showGrid}
          />
          
          {/* 3D Objects */}
          {memoizedWalls}
          {memoizedFixtures}
          {memoizedTables}
          {memoizedChairs}
          
          {/* Performance monitoring */}
          {showStats && <Stats showPanel={0} className="stats-panel" />}
        </Suspense>
      </Canvas>
      
      {/* Mini Map Overlay */}
      {showMiniMap && (
        <div className="absolute top-4 right-4 z-10">
          <MiniMap2D />
        </div>
      )}
      
      {/* Performance warning */}
      {enablePerformanceMonitor && (
        <div className="absolute bottom-4 left-4 z-10">
          <PerformanceMonitor />
        </div>
      )}
    </div>
  );
}

// Performance monitoring component
function PerformanceMonitor() {
  const [fps, setFps] = React.useState(60);
  const [memoryUsage, setMemoryUsage] = React.useState(0);
  
  useFrame(() => {
    // Calculate FPS
    const now = performance.now();
    // Simplified FPS calculation
    
    // Memory usage (if available)
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      setMemoryUsage(Math.round(memory.usedJSHeapSize / 1024 / 1024));
    }
  });

  const fpsColor = fps >= 50 ? 'text-green-600' : fps >= 30 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="bg-black bg-opacity-75 text-white p-2 rounded text-xs font-mono">
      <div className={`${fpsColor}`}>FPS: {fps}</div>
      {memoryUsage > 0 && (
        <div className="text-gray-300">Memory: {memoryUsage}MB</div>
      )}
    </div>
  );
}

export default ThreeFloor;
