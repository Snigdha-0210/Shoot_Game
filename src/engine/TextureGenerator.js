import * as THREE from 'three';

export class TextureGenerator {
  // Generate realistic wet cobblestone pavement texture
  static createCobblestoneTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Base dark wet asphalt/stone
    ctx.fillStyle = '#10141a';
    ctx.fillRect(0, 0, size, size);

    // Draw cobblestone grid with varying shapes and shades
    const rows = 16;
    const cols = 16;
    const cellW = size / cols;
    const cellH = size / rows;

    for (let r = 0; r < rows; r++) {
      const offsetX = (r % 2) * (cellW / 2);
      for (let c = -1; c < cols + 1; c++) {
        const x = c * cellW + offsetX;
        const y = r * cellH;

        // Individual stone tone
        const brightness = Math.floor(25 + Math.random() * 25);
        const stoneColor = `rgb(${brightness}, ${brightness + 4}, ${brightness + 8})`;
        ctx.fillStyle = stoneColor;

        // Rounded cobblestone rectangle
        const margin = 2.5;
        const stoneW = cellW - margin * 2;
        const stoneH = cellH - margin * 2;

        ctx.beginPath();
        ctx.roundRect(x + margin, y + margin, stoneW, stoneH, 4);
        ctx.fill();

        // Stone specular edge highlight (wet shine)
        ctx.strokeStyle = `rgba(200, 220, 255, ${0.15 + Math.random() * 0.15})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Subtle noise/grain on stone
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fillRect(x + margin + 4, y + margin + 4, stoneW - 8, stoneH - 8);
      }
    }

    // Wet puddles with specular gleam
    for (let i = 0; i < 4; i++) {
      const px = Math.random() * size;
      const py = Math.random() * size;
      const rad = 40 + Math.random() * 50;
      const grad = ctx.createRadialGradient(px, py, 5, px, py, rad);
      grad.addColorStop(0, 'rgba(80, 110, 140, 0.4)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    return texture;
  }

  // Generate European historic building brick/plaster wall texture
  static createBuildingWallTexture(baseColor = '#241c18') {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, size, size);

    // Weathered horizontal brick layers
    ctx.strokeStyle = '#120d0b';
    ctx.lineWidth = 2;
    const brickH = 20;
    const brickW = 45;

    for (let y = 0; y < size; y += brickH) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();

      const offset = (y / brickH) % 2 === 0 ? 0 : brickW / 2;
      for (let x = offset; x < size; x += brickW) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + brickH);
        ctx.stroke();

        if (Math.random() > 0.6) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
          ctx.fillRect(x + 2, y + 2, brickW - 4, brickH - 4);
        }
      }
    }

    // Weathered water stains / grunge gradient
    const grunge = ctx.createLinearGradient(0, 0, 0, size);
    grunge.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
    grunge.addColorStop(0.3, 'rgba(0, 0, 0, 0.1)');
    grunge.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = grunge;
    ctx.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 3);
    return texture;
  }

  // Generate glowing PCB circuit board texture with microchip traces
  static createCircuitBoardTexture() {
    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Dark high-tech motherboard blue/green
    ctx.fillStyle = '#081018';
    ctx.fillRect(0, 0, size, size);

    // Glowing cyan/blue circuit trace lines
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 10;

    for (let i = 0; i < 20; i++) {
      const startX = Math.random() * size;
      const startY = Math.random() * size;
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      let curX = startX;
      let curY = startY;
      for (let j = 0; j < 4; j++) {
        if (Math.random() > 0.5) {
          curX += (Math.random() - 0.5) * 80;
        } else {
          curY += (Math.random() - 0.5) * 80;
        }
        ctx.lineTo(curX, curY);
      }
      ctx.stroke();

      // Solder point / micro-node
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(curX, curY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central microprocessor socket
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#15202b';
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.strokeRect(size / 2 - 60, size / 2 - 60, 120, 120);
    ctx.fillRect(size / 2 - 60, size / 2 - 60, 120, 120);

    ctx.fillStyle = '#00f0ff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DISARM CORE', size / 2, size / 2 + 5);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}
