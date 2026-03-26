import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

// Simple force-directed graph layout
class GraphSimulation {
  constructor(nodes, edges, width, height) {
    // Spread nodes in a small centered circle
    const cx = width / 2;
    const cy = height / 2;
    const spread = Math.min(width, height) * 0.15;

    this.nodes = nodes.map((n, i) => {
      const angle = (i / Math.max(nodes.length, 1)) * Math.PI * 2;
      return {
        ...n,
        x: cx + Math.cos(angle) * spread + (Math.random() - 0.5) * 40,
        y: cy + Math.sin(angle) * spread + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
      };
    });
    this.edges = edges;
    this.width = width;
    this.height = height;
  }

  tick() {
    const { nodes, edges } = this;
    const repulsion = 800;
    const attraction = 0.03;
    const damping = 0.7;
    const centerGravity = 0.03;
    const idealDist = 150;

    // Repulsion between nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 10);
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) continue;
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const force = attraction * (dist - idealDist);
      const fx = (dx / Math.max(dist, 1)) * force;
      const fy = (dy / Math.max(dist, 1)) * force;
      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    // Center gravity
    for (const node of nodes) {
      node.vx += (this.width / 2 - node.x) * centerGravity;
      node.vy += (this.height / 2 - node.y) * centerGravity;
    }

    // Update positions
    for (const node of nodes) {
      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;
      node.x = Math.max(80, Math.min(this.width - 80, node.x));
      node.y = Math.max(80, Math.min(this.height - 80, node.y));
    }
  }
}

export default function GraphView({ pages, onSelectPage, onClose }) {
  const canvasRef = useRef(null);
  const simRef = useRef(null);
  const animRef = useRef(null);
  const hoveredRef = useRef(null);
  const draggingRef = useRef(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  themeRef.current = theme;

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Build graph data
  const buildGraph = useCallback(() => {
    const nodes = pages.map((p, i) => ({
      id: p.id,
      label: p.title || 'Untitled',
      isFirst: i === 0,
      type: p.type,
    }));

    const edges = [];
    for (let i = 1; i < pages.length; i++) {
      edges.push({ source: pages[i - 1].id, target: pages[i].id });
    }

    for (const page of pages) {
      if (typeof page.content === 'string') {
        for (const other of pages) {
          if (other.id !== page.id && page.content.includes(other.title)) {
            const exists = edges.some(
              e => (e.source === page.id && e.target === other.id) ||
                   (e.source === other.id && e.target === page.id)
            );
            if (!exists) {
              edges.push({ source: page.id, target: other.id });
            }
          }
        }
      }
    }

    return { nodes, edges };
  }, [pages]);

  // Initialize simulation & animation loop (runs once)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const initTimer = setTimeout(() => {
      const w = window.innerWidth;
      const h = window.innerHeight - 60;
      canvas.width = w;
      canvas.height = h;

      const { nodes, edges } = buildGraph();
      simRef.current = new GraphSimulation(nodes, edges, w, h);
    }, 100);

    let tickCount = 0;
    function animate() {
      const sim = simRef.current;
      const canvas = canvasRef.current;
      if (!sim || !canvas) {
        animRef.current = requestAnimationFrame(animate);
        return;
      }

      if (tickCount < 200) sim.tick();
      tickCount++;

      const ctx = canvas.getContext('2d');
      drawGraph(ctx, sim, canvas.width, canvas.height, hoveredRef.current, themeRef.current);
      animRef.current = requestAnimationFrame(animate);
    }
    animRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight - 60;
      if (simRef.current) {
        simRef.current.width = canvas.width;
        simRef.current.height = canvas.height;
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(initTimer);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [buildGraph]);

  // Mouse interactions — all use refs, no state re-renders
  const getNodeAtPos = useCallback((x, y) => {
    if (!simRef.current) return null;
    for (const node of simRef.current.nodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy < 22 * 22) return node;
    }
    return null;
  }, []);

  const handleMouseMove = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggingRef.current && simRef.current) {
      const node = simRef.current.nodes.find(n => n.id === draggingRef.current);
      if (node) {
        node.x = x + dragOffsetRef.current.x;
        node.y = y + dragOffsetRef.current.y;
        node.vx = 0;
        node.vy = 0;
      }
      return;
    }

    const node = getNodeAtPos(x, y);
    hoveredRef.current = node?.id || null;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = node ? 'pointer' : 'default';
    }
  }, [getNodeAtPos]);

  const handleMouseDown = useCallback((e) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAtPos(x, y);
    if (node) {
      draggingRef.current = node.id;
      dragOffsetRef.current = { x: node.x - x, y: node.y - y };
    }
  }, [getNodeAtPos]);

  const handleMouseUp = useCallback((e) => {
    if (draggingRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const node = getNodeAtPos(x, y);
        if (node && node.id === draggingRef.current) {
          onSelectPage(draggingRef.current);
          onClose();
        }
      }
      draggingRef.current = null;
    }
  }, [getNodeAtPos, onSelectPage, onClose]);

  const handleMouseLeave = useCallback(() => {
    hoveredRef.current = null;
    draggingRef.current = null;
  }, []);

  return (
    <motion.div
      className="graph-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="graph-header">
        <span className="graph-title">Graph View</span>
        <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Press Esc to close</span>
        <button className="graph-close" onClick={onClose}>×</button>
      </div>
      <canvas
        ref={canvasRef}
        className="graph-canvas"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </motion.div>
  );
}

function drawGraph(ctx, sim, width, height, hoveredId, theme) {
  const isDark = theme === 'dark';

  // Background
  ctx.fillStyle = isDark ? '#1C1C1E' : '#F5F5F7';
  ctx.fillRect(0, 0, width, height);

  // Grid
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.06)';
  ctx.lineWidth = 1;
  const gridSize = 60;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Edges
  for (const edge of sim.edges) {
    const source = sim.nodes.find(n => n.id === edge.source);
    const target = sim.nodes.find(n => n.id === edge.target);
    if (!source || !target) continue;

    const isHighlighted = hoveredId === source.id || hoveredId === target.id;
    ctx.beginPath();
    ctx.moveTo(source.x, source.y);
    ctx.lineTo(target.x, target.y);
    ctx.strokeStyle = isHighlighted
      ? (isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)')
      : (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)');
    ctx.lineWidth = isHighlighted ? 2 : 1;
    ctx.stroke();
  }

  // Nodes
  for (const node of sim.nodes) {
    const isHovered = hoveredId === node.id;
    const radius = isHovered ? 14 : node.isFirst ? 10 : 12;

    // Glow
    if (isHovered || node.isFirst) {
      const gradient = ctx.createRadialGradient(node.x, node.y, radius, node.x, node.y, radius * 3);
      gradient.addColorStop(0, node.isFirst
        ? 'rgba(0, 122, 255, 0.25)'
        : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)'));
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius * 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = node.isFirst ? '#007AFF' : (isDark ? '#FFFFFF' : '#1D1D1F');
    ctx.fill();

    if (isHovered) {
      ctx.strokeStyle = '#007AFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Label
    ctx.fillStyle = isDark ? '#FFFFFF' : '#1D1D1F';
    ctx.font = `${isHovered ? '600' : '500'} ${isHovered ? 14 : 13}px Inter, -apple-system, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(node.label, node.x + radius + 8, node.y);
  }
}
