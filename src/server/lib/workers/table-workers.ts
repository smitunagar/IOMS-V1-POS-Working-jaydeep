// Web Worker for overlap detection
const overlapWorkerCode = `
self.onmessage = function(e) {
  const { tables, action } = e.data;
  
  function hasOverlap(rect1, rect2) {
    // AABB collision detection with rotation support
    const r1 = getRotatedBounds(rect1);
    const r2 = getRotatedBounds(rect2);
    
    return !(r1.right < r2.left || 
             r2.right < r1.left || 
             r1.bottom < r2.top || 
             r2.bottom < r1.top);
  }
  
  function getRotatedBounds(table) {
    const { x, y, w, h, rotation = 0 } = table;
    const cx = x + w / 2;
    const cy = y + h / 2;
    
    if (rotation === 0) {
      return { left: x, right: x + w, top: y, bottom: y + h };
    }
    
    // For rotated rectangles, calculate bounding box
    const rad = rotation * Math.PI / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    const corners = [
      { x: -w/2, y: -h/2 },
      { x: w/2, y: -h/2 },
      { x: w/2, y: h/2 },
      { x: -w/2, y: h/2 }
    ];
    
    const rotated = corners.map(corner => ({
      x: cx + corner.x * cos - corner.y * sin,
      y: cy + corner.x * sin + corner.y * cos
    }));
    
    const xs = rotated.map(p => p.x);
    const ys = rotated.map(p => p.y);
    
    return {
      left: Math.min(...xs),
      right: Math.max(...xs),
      top: Math.min(...ys),
      bottom: Math.max(...ys)
    };
  }
  
  const overlaps = [];
  
  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      if (tables[i].id !== tables[j].id && hasOverlap(tables[i], tables[j])) {
        overlaps.push([tables[i].id, tables[j].id]);
      }
    }
  }
  
  self.postMessage({ overlaps });
};
`;

const chairLayoutWorkerCode = `
self.onmessage = function(e) {
  const { table } = e.data;
  const { shape, capacity, x, y, w, h } = table;
  
  function generateChairPositions(table) {
    const chairs = [];
    const { shape, capacity, x, y, w, h } = table;
    
    if (shape === 'round') {
      const radius = Math.min(w, h) / 2;
      const centerX = x + w / 2;
      const centerY = y + h / 2;
      const chairDistance = radius + 30; // 30px from table edge
      
      for (let i = 0; i < capacity; i++) {
        const angle = (i * 2 * Math.PI) / capacity;
        chairs.push({
          x: centerX + Math.cos(angle) * chairDistance,
          y: centerY + Math.sin(angle) * chairDistance,
          rotation: angle + Math.PI // Face the table
        });
      }
    } else {
      // Rectangle/Square - distribute along edges
      const chairsPerSide = Math.ceil(capacity / 4);
      const chairWidth = 25;
      const chairDistance = 35;
      
      // Top edge
      const topChairs = Math.min(chairsPerSide, Math.floor(w / 40));
      for (let i = 0; i < topChairs && chairs.length < capacity; i++) {
        chairs.push({
          x: x + (w / (topChairs + 1)) * (i + 1) - chairWidth / 2,
          y: y - chairDistance,
          rotation: Math.PI / 2 // Face down
        });
      }
      
      // Right edge
      const rightChairs = Math.min(chairsPerSide, Math.floor(h / 40));
      for (let i = 0; i < rightChairs && chairs.length < capacity; i++) {
        chairs.push({
          x: x + w + chairDistance,
          y: y + (h / (rightChairs + 1)) * (i + 1) - chairWidth / 2,
          rotation: Math.PI // Face left
        });
      }
      
      // Bottom edge
      for (let i = 0; i < topChairs && chairs.length < capacity; i++) {
        chairs.push({
          x: x + w - (w / (topChairs + 1)) * (i + 1) - chairWidth / 2,
          y: y + h + chairDistance,
          rotation: -Math.PI / 2 // Face up
        });
      }
      
      // Left edge
      for (let i = 0; i < rightChairs && chairs.length < capacity; i++) {
        chairs.push({
          x: x - chairDistance,
          y: y + h - (h / (rightChairs + 1)) * (i + 1) - chairWidth / 2,
          rotation: 0 // Face right
        });
      }
    }
    
    return chairs.slice(0, capacity);
  }
  
  const chairs = generateChairPositions(table);
  self.postMessage({ chairs });
};
`;

export function createOverlapWorker(): Worker {
  const blob = new Blob([overlapWorkerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

export function createChairLayoutWorker(): Worker {
  const blob = new Blob([chairLayoutWorkerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}
