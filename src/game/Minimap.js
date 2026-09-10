// Tactical Radar Minimap Canvas Renderer
export class Minimap {
  constructor(canvasId = 'minimap-canvas') {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.radarRadius = 66; // 160px canvas
    this.sweepAngle = 0;
    this.worldRange = 60; // 60m radar radius for full level range
  }

  render(player, enemies, bomb) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // Clear background
    ctx.clearRect(0, 0, w, h);

    // Radar dark circular background
    ctx.fillStyle = 'rgba(4, 10, 18, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, this.radarRadius, 0, Math.PI * 2);
    ctx.fill();

    // Radar concentric distance rings (15m, 30m, 45m)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
    ctx.lineWidth = 1;
    [22, 44, 66].forEach((r, idx) => {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    });

    // Crosshairs (Forward/Back, Left/Right)
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
    ctx.beginPath();
    ctx.moveTo(cx - this.radarRadius, cy);
    ctx.lineTo(cx + this.radarRadius, cy);
    ctx.moveTo(cx, cy - this.radarRadius);
    ctx.lineTo(cx, cy + this.radarRadius);
    ctx.stroke();

    // Cardinal / Forward Indicator
    ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('FWD', cx, cy - this.radarRadius + 3);

    // Rotating Radar Sweep Beam
    this.sweepAngle = (this.sweepAngle + 0.05) % (Math.PI * 2);
    const grad = ctx.createConicGradient(this.sweepAngle, cx, cy);
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.35)');
    grad.addColorStop(0.12, 'rgba(0, 240, 255, 0.0)');
    grad.addColorStop(1, 'rgba(0, 240, 255, 0.0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, this.radarRadius, 0, Math.PI * 2);
    ctx.fill();

    const playerPos = player.position;
    const playerYaw = player.yaw;
    const scale = this.radarRadius / this.worldRange;

    // --- Render Bomb Marker (Prominent Glowing Yellow Star + Pulse Ring) ---
    if (bomb && !bomb.isDefused) {
      const dx = bomb.position.x - playerPos.x;
      const dz = bomb.position.z - playerPos.z;

      // Project relative to player orientation (Forward = UP, Right = RIGHT)
      const localRight = dx * Math.cos(playerYaw) - dz * Math.sin(playerYaw);
      const localForward = -dx * Math.sin(playerYaw) - dz * Math.cos(playerYaw);

      const dist = Math.hypot(localRight, localForward);
      const clampDist = Math.min(this.radarRadius - 4, dist * scale);
      const angle = Math.atan2(-localForward, localRight); // Canvas angle (-Y is UP)

      const bx = cx + Math.cos(angle) * clampDist;
      const by = cy + Math.sin(angle) * clampDist;

      // Outer pulsing ring
      const pulseSize = 6 + (Date.now() % 1000) / 150;
      ctx.strokeStyle = 'rgba(255, 204, 0, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(bx, by, pulseSize, 0, Math.PI * 2);
      ctx.stroke();

      // Golden Star / Core Diamond
      ctx.fillStyle = '#ffcc00';
      ctx.shadowColor = '#ffcc00';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fill();

      // Label "★ BOMB" next to blip
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffe066';
      ctx.font = 'bold 8px monospace';
      ctx.fillText('BOMB', bx + 7, by - 4);
    }

    // --- Render Enemy Blips (Red Dots) ---
    enemies.forEach(enemy => {
      if (enemy.isDead) return;

      const dx = enemy.root.position.x - playerPos.x;
      const dz = enemy.root.position.z - playerPos.z;

      const localRight = dx * Math.cos(playerYaw) - dz * Math.sin(playerYaw);
      const localForward = -dx * Math.sin(playerYaw) - dz * Math.cos(playerYaw);

      const dist = Math.hypot(localRight, localForward);
      if (dist <= this.worldRange) {
        const ex = cx + localRight * scale;
        const ey = cy - localForward * scale;

        ctx.fillStyle = enemy.state === 'combat' ? '#ff2233' : (enemy.state === 'suspicious' ? '#ffaa00' : '#ff5566');
        ctx.shadowColor = '#ff2233';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(ex, ey, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // --- Render Player (Center Cyan Directional Arrow pointing straight UP) ---
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = '#00f0ff';
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 5);
    ctx.lineTo(-5, 5);
    ctx.closePath();
    ctx.fill();

    // Player forward FOV vision cone
    ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, 32, -Math.PI / 2 - 0.45, -Math.PI / 2 + 0.45);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
