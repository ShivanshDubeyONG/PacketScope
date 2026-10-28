import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Globe, Network, Compass, Play, Pause, RotateCcw, Maximize2, Minimize2, ShieldAlert, Cpu } from 'lucide-react';
import { Capture, Statistics, AlertListResponse } from '../../types';
import { cyberAudio } from '../../utils/cyberAudio';

interface Props {
  capture: Capture | null;
  statistics: Statistics | null;
  alertsData: AlertListResponse | null;
  isCompact?: boolean;
}

type ViewMode = 'globe' | 'constellation' | 'radar';

interface HostNodeData {
  ip: string;
  bytes: number;
  packets: number;
  isAttacker: boolean;
  position: THREE.Vector3;
  mesh?: THREE.Mesh;
}

export function CyberTopology3D({ capture, statistics, alertsData, isCompact = false }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<ViewMode>('globe');
  const [speed, setSpeed] = useState<number>(1.0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<HostNodeData | null>(null);

  // Scene references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameRef = useRef<number>(0);
  const nodesGroupRef = useRef<THREE.Group | null>(null);
  const arcsGroupRef = useRef<THREE.Group | null>(null);
  const baseMeshRef = useRef<THREE.Group | null>(null);
  const radarSweepRef = useRef<THREE.Line | null>(null);
  const hostNodesRef = useRef<HostNodeData[]>([]);

  // Mouse interaction state
  const isDraggingRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.2, y: 0 });
  const targetRotationRef = useRef({ x: 0.2, y: 0 });
  const zoomRef = useRef(isCompact ? 28 : 22);

  // Build nodes from actual capture data
  useEffect(() => {
    const talkers = statistics?.top_talkers || [];
    const alertList = alertsData?.items || [];
    const suspiciousIps = new Set(alertList.map(a => a.source_ip).filter(Boolean));

    const nodes: HostNodeData[] = [];
    const ipSet = new Set<string>();

    talkers.forEach((t) => {
      if (t.ip && !ipSet.has(t.ip)) {
        ipSet.add(t.ip);
        nodes.push({
          ip: t.ip,
          bytes: t.byte_count,
          packets: t.packet_count,
          isAttacker: suspiciousIps.has(t.ip),
          position: new THREE.Vector3(),
        });
      }
    });

    // If talkers list is sparse, supplement with conversation endpoints
    if (nodes.length < 5 && statistics?.top_conversations) {
      statistics.top_conversations.forEach((c) => {
        [c.source_ip, c.dest_ip].forEach((ip) => {
          if (ip && !ipSet.has(ip)) {
            ipSet.add(ip);
            nodes.push({
              ip,
              bytes: c.byte_count,
              packets: c.packet_count,
              isAttacker: suspiciousIps.has(ip),
              position: new THREE.Vector3(),
            });
          }
        });
      });
    }

    // Fallback baseline nodes if zero traffic loaded
    if (nodes.length === 0) {
      ['192.168.1.105', '192.168.1.1', '10.0.0.45', '8.8.8.8', '172.16.0.2', '192.168.1.200'].forEach((ip, idx) => {
        nodes.push({
          ip,
          bytes: (idx + 1) * 14200,
          packets: (idx + 1) * 45,
          isAttacker: idx === 0,
          position: new THREE.Vector3(),
        });
      });
    }

    hostNodesRef.current = nodes;
    rebuildScene();
  }, [statistics, alertsData, mode]);

  const rebuildScene = () => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Clear previous groups
    if (nodesGroupRef.current) scene.remove(nodesGroupRef.current);
    if (arcsGroupRef.current) scene.remove(arcsGroupRef.current);
    if (baseMeshRef.current) scene.remove(baseMeshRef.current);

    const baseGroup = new THREE.Group();
    const nodesGroup = new THREE.Group();
    const arcsGroup = new THREE.Group();

    baseMeshRef.current = baseGroup;
    nodesGroupRef.current = nodesGroup;
    arcsGroupRef.current = arcsGroup;

    scene.add(baseGroup);
    scene.add(nodesGroup);
    scene.add(arcsGroup);

    const nodes = hostNodesRef.current;
    const nodeCount = nodes.length;

    if (mode === 'globe') {
      // 1. Globe wireframe sphere
      const sphereGeo = new THREE.SphereGeometry(8, 24, 24);
      const wireMat = new THREE.MeshBasicMaterial({
        color: 0x0284c7,
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      });
      const globeMesh = new THREE.Mesh(sphereGeo, wireMat);
      baseGroup.add(globeMesh);

      // Inner glowing core
      const innerGeo = new THREE.SphereGeometry(7.8, 16, 16);
      const innerMat = new THREE.MeshBasicMaterial({
        color: 0x0369a1,
        transparent: true,
        opacity: 0.08,
      });
      baseGroup.add(new THREE.Mesh(innerGeo, innerMat));

      // Latitude and Longitude glowing rings
      for (let i = -2; i <= 2; i++) {
        const ringGeo = new THREE.RingGeometry(7.99, 8.05, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.25,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = i * 2.5;
        baseGroup.add(ring);
      }

      // Position nodes around the sphere
      nodes.forEach((n, idx) => {
        const phi = Math.acos(-1 + (2 * idx) / Math.max(nodeCount, 1));
        const theta = Math.sqrt(nodeCount * Math.PI) * phi;
        const r = 8.2;
        n.position.set(
          r * Math.cos(theta) * Math.sin(phi),
          r * Math.sin(theta) * Math.sin(phi),
          r * Math.cos(phi)
        );

        const nodeGeo = new THREE.SphereGeometry(n.isAttacker ? 0.45 : 0.32, 16, 16);
        const nodeMat = new THREE.MeshBasicMaterial({
          color: n.isAttacker ? 0xef4444 : 0x38bdf8,
        });
        const mesh = new THREE.Mesh(nodeGeo, nodeMat);
        mesh.position.copy(n.position);
        mesh.userData = { node: n };
        nodesGroup.add(mesh);
        n.mesh = mesh;

        // Pulsing halo for attackers
        if (n.isAttacker) {
          const haloGeo = new THREE.RingGeometry(0.55, 0.75, 24);
          const haloMat = new THREE.MeshBasicMaterial({
            color: 0xef4444,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
          });
          const halo = new THREE.Mesh(haloGeo, haloMat);
          halo.position.copy(n.position);
          halo.lookAt(0, 0, 0);
          nodesGroup.add(halo);
        }
      });

      // Cyber Attack Arcs (Quadratic Bezier curves in 3D)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (Math.random() > 0.45 || (nodes[i].isAttacker || nodes[j].isAttacker)) {
            const start = nodes[i].position;
            const end = nodes[j].position;
            const mid = start.clone().add(end).multiplyScalar(0.5);
            mid.normalize().multiplyScalar(12.5); // Elevate into cyber ballistic arc

            const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
            const points = curve.getPoints(36);
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const isThreatArc = nodes[i].isAttacker || nodes[j].isAttacker;
            const lineMat = new THREE.LineBasicMaterial({
              color: isThreatArc ? 0xf43f5e : 0x0ea5e9,
              transparent: true,
              opacity: isThreatArc ? 0.75 : 0.35,
            });
            const line = new THREE.Line(lineGeo, lineMat);
            arcsGroup.add(line);
          }
        }
      }
    } else if (mode === 'constellation') {
      // 2. Orbital Constellation Rings
      [6, 9, 12].forEach((radius, idx) => {
        const ringGeo = new THREE.RingGeometry(radius - 0.05, radius + 0.05, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: idx === 1 ? 0x0284c7 : 0x475569,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.3,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = (idx * Math.PI) / 4;
        ring.rotation.y = (idx * Math.PI) / 6;
        baseGroup.add(ring);
      });

      // Central Core Gateway Node
      const coreGeo = new THREE.DodecahedronGeometry(1.4, 0);
      const coreMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
      const core = new THREE.Mesh(coreGeo, coreMat);
      baseGroup.add(core);

      nodes.forEach((n, idx) => {
        const angle = (idx / nodeCount) * Math.PI * 2;
        const rad = 6 + (idx % 3) * 2.5;
        n.position.set(Math.cos(angle) * rad, (Math.sin(idx) * 3), Math.sin(angle) * rad);

        const nodeGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const nodeMat = new THREE.MeshBasicMaterial({
          color: n.isAttacker ? 0xdc2626 : 0x0ea5e9,
        });
        const mesh = new THREE.Mesh(nodeGeo, nodeMat);
        mesh.position.copy(n.position);
        mesh.userData = { node: n };
        nodesGroup.add(mesh);
        n.mesh = mesh;

        // Beam connecting to central core
        const beamGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), n.position]);
        const beamMat = new THREE.LineBasicMaterial({
          color: n.isAttacker ? 0xef4444 : 0x38bdf8,
          transparent: true,
          opacity: 0.25,
        });
        arcsGroup.add(new THREE.Line(beamGeo, beamMat));
      });
    } else {
      // 3. Cyber Matrix Radar
      const dishGeo = new THREE.CircleGeometry(10, 48);
      const dishMat = new THREE.MeshBasicMaterial({
        color: 0x0369a1,
        transparent: true,
        opacity: 0.12,
        side: THREE.DoubleSide,
      });
      const dish = new THREE.Mesh(dishGeo, dishMat);
      dish.rotation.x = -Math.PI / 2.3;
      baseGroup.add(dish);

      // Radar Concentric Circles
      [3, 6, 9].forEach((r) => {
        const ringGeo = new THREE.RingGeometry(r - 0.05, r + 0.05, 48);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.4,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2.3;
        baseGroup.add(ring);
      });

      // Rotating radar beam line
      const sweepGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(9.8, 0, 0),
      ]);
      const sweepMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
      const sweep = new THREE.Line(sweepGeo, sweepMat);
      sweep.rotation.x = -Math.PI / 2.3;
      baseGroup.add(sweep);
      radarSweepRef.current = sweep;

      nodes.forEach((n, idx) => {
        const angle = (idx / nodeCount) * Math.PI * 2;
        const rad = 2.5 + ((idx * 2) % 7);
        const x = Math.cos(angle) * rad;
        const z = Math.sin(angle) * rad;
        n.position.set(x, 0, z);
        n.position.applyAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2.3);

        const blipGeo = new THREE.SphereGeometry(n.isAttacker ? 0.35 : 0.25, 8, 8);
        const blipMat = new THREE.MeshBasicMaterial({
          color: n.isAttacker ? 0xef4444 : 0x22c55e,
        });
        const mesh = new THREE.Mesh(blipGeo, blipMat);
        mesh.position.copy(n.position);
        mesh.userData = { node: n };
        nodesGroup.add(mesh);
        n.mesh = mesh;
      });
    }
  };

  // Initialize Three.js WebGL canvas
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 600;
    const height = container.clientHeight || (isCompact ? 320 : 540);

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = zoomRef.current;
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Background particle dust
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 350;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 80;
      starPos[i + 1] = (Math.random() - 0.5) * 80;
      starPos[i + 2] = (Math.random() - 0.5) * 80;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.18, transparent: true, opacity: 0.4 });
    const stars = new THREE.Points(starsGeo, starMat);
    scene.add(stars);

    rebuildScene();

    // Raycaster for hover inspection
    const raycaster = new THREE.Raycaster();
    const mouseCoord = new THREE.Vector2();

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseCoord.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouseCoord.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;

      if (isDraggingRef.current) {
        const deltaX = e.clientX - prevMouseRef.current.x;
        const deltaY = e.clientY - prevMouseRef.current.y;
        targetRotationRef.current.y += deltaX * 0.007;
        targetRotationRef.current.x += deltaY * 0.007;
        targetRotationRef.current.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, targetRotationRef.current.x));
        prevMouseRef.current = { x: e.clientX, y: e.clientY };
      } else {
        // Raycasting check
        raycaster.setFromCamera(mouseCoord, camera);
        if (nodesGroupRef.current) {
          const intersects = raycaster.intersectObjects(nodesGroupRef.current.children);
          if (intersects.length > 0) {
            const hit = intersects[0].object;
            if (hit.userData && hit.userData.node) {
              setHoveredNode(hit.userData.node);
            }
          } else {
            setHoveredNode(null);
          }
        }
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomRef.current += e.deltaY * 0.02;
      zoomRef.current = Math.max(10, Math.min(45, zoomRef.current));
      camera.position.z = zoomRef.current;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('wheel', handleWheel, { passive: false });

    // Animation Loop
    let lastTime = performance.now();
    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) * 0.001;
      lastTime = currentTime;

      if (!isPaused) {
        targetRotationRef.current.y += 0.35 * speed * delta;
      }

      // Smooth camera dampening
      rotationRef.current.x += (targetRotationRef.current.x - rotationRef.current.x) * 0.08;
      rotationRef.current.y += (targetRotationRef.current.y - rotationRef.current.y) * 0.08;

      if (baseMeshRef.current && nodesGroupRef.current && arcsGroupRef.current) {
        baseMeshRef.current.rotation.x = rotationRef.current.x;
        baseMeshRef.current.rotation.y = rotationRef.current.y;
        nodesGroupRef.current.rotation.x = rotationRef.current.x;
        nodesGroupRef.current.rotation.y = rotationRef.current.y;
        arcsGroupRef.current.rotation.x = rotationRef.current.x;
        arcsGroupRef.current.rotation.y = rotationRef.current.y;
      }

      if (radarSweepRef.current) {
        radarSweepRef.current.rotation.z += 1.8 * speed * delta;
      }

      stars.rotation.y += 0.05 * delta;

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [mode, isPaused, speed, isCompact]);

  const switchMode = (newMode: ViewMode) => {
    setMode(newMode);
    cyberAudio.playChirp();
  };

  const resetCamera = () => {
    targetRotationRef.current = { x: 0.2, y: 0 };
    zoomRef.current = isCompact ? 28 : 22;
    if (cameraRef.current) cameraRef.current.position.z = zoomRef.current;
    cyberAudio.playClick();
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-700/70 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none' : ''
      }`}
    >
      {/* 3D Cyber HUD Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/80 bg-slate-950/70 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/40">
            <Cpu className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-wide text-white flex items-center gap-2">
              <span>3D CYBER TOPOLOGY MATRIX</span>
              <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-mono font-medium text-sky-300 ring-1 ring-sky-500/30">
                WEBGL 3D
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Target: {capture?.original_filename || 'demo_pcap'} • Active Nodes: {hostNodesRef.current.length}
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center space-x-1.5 rounded-lg bg-slate-900/90 p-1 ring-1 ring-slate-800">
          <button
            onClick={() => switchMode('globe')}
            className={`flex items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              mode === 'globe' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Threat Globe</span>
          </button>
          <button
            onClick={() => switchMode('constellation')}
            className={`flex items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              mode === 'constellation' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            <span>Constellation</span>
          </button>
          <button
            onClick={() => switchMode('radar')}
            className={`flex items-center space-x-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              mode === 'radar' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Matrix Radar</span>
          </button>
        </div>

        {/* Playback & View Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setIsPaused(!isPaused);
              cyberAudio.playClick();
            }}
            title={isPaused ? 'Resume Rotation' : 'Pause Rotation'}
            className="rounded-lg bg-slate-800/80 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white ring-1 ring-slate-700"
          >
            {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => {
              const speeds = [0.5, 1.0, 2.0];
              const next = speeds[(speeds.indexOf(speed) + 1) % speeds.length];
              setSpeed(next);
              cyberAudio.playClick();
            }}
            className="rounded-lg bg-slate-800/80 px-2 py-1 text-[11px] font-mono text-slate-300 hover:bg-slate-700 hover:text-white ring-1 ring-slate-700"
          >
            {speed}x
          </button>
          <button
            onClick={resetCamera}
            title="Reset Camera View"
            className="rounded-lg bg-slate-800/80 p-1.5 text-slate-300 hover:bg-slate-700 hover:text-white ring-1 ring-slate-700"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setIsFullscreen(!isFullscreen);
              cyberAudio.playChirp();
            }}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Presentation'}
            className="rounded-lg bg-sky-500/20 p-1.5 text-sky-400 hover:bg-sky-500/30 ring-1 ring-sky-500/40"
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        className={`relative w-full cursor-grab active:cursor-grabbing ${
          isFullscreen ? 'h-[calc(100vh-60px)]' : isCompact ? 'h-80' : 'h-[500px]'
        }`}
      />

      {/* Floating 3D Node Inspection HUD Card */}
      {hoveredNode && (
        <div className="pointer-events-none absolute bottom-4 left-4 z-20 w-64 rounded-xl border border-sky-500/40 bg-slate-950/90 p-3.5 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <span className="font-mono text-xs font-bold text-sky-400 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${hoveredNode.isAttacker ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
              {hoveredNode.ip}
            </span>
            {hoveredNode.isAttacker && (
              <span className="flex items-center gap-1 rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-bold text-red-400 ring-1 ring-red-500/40">
                <ShieldAlert className="h-2.5 w-2.5" /> THREAT
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-slate-500">Bytes:</span>
              <p className="font-semibold text-slate-200">{(hoveredNode.bytes / 1024).toFixed(1)} KB</p>
            </div>
            <div>
              <span className="text-slate-500">Packets:</span>
              <p className="font-semibold text-slate-200">{hoveredNode.packets.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Hint Bar */}
      <div className="absolute bottom-2 right-4 pointer-events-none text-[10px] font-mono text-slate-500 flex items-center gap-3">
        <span>Click + Drag to Rotate 360°</span>
        <span>•</span>
        <span>Scroll to Zoom</span>
        <span>•</span>
        <span>Hover Nodes to Inspect</span>
      </div>
    </div>
  );
}
