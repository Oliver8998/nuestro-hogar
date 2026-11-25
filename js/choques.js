const MAX_PASO = 1.2;

export function separar(cuerpos, dt, libre) {
  const n = cuerpos.length;
  if (n < 2) return;
  const k = Math.min(1, dt * 12);
  for (let pasada = 0; pasada < 2; pasada++) {
    for (let a = 0; a < n; a++) {
      const A = cuerpos[a];
      for (let b = a + 1; b < n; b++) {
        const B = cuerpos[b];
        if (A.fijo && B.fijo) continue;
        if (Math.abs((A.y || 0) - (B.y || 0)) > 0.35) continue;
        let dx = B.p.x - A.p.x;
        let dz = B.p.z - A.p.z;
        let d = Math.hypot(dx, dz);
        const min = A.r + B.r;
        if (d >= min) continue;
        if (d < 1e-4) {
          const ang = (a * 2.39 + b * 1.31) % (Math.PI * 2);
          dx = Math.cos(ang);
          dz = Math.sin(ang);
          d = 1;
        }
        const nx = dx / d;
        const nz = dz / d;
        const solape = Math.min(min - d, MAX_PASO * dt + 0.02) * k;
        const ia = A.fijo ? 0 : 1 / (A.peso || 1);
        const ib = B.fijo ? 0 : 1 / (B.peso || 1);
        const suma = ia + ib;
        if (!suma) continue;
        let pa = solape * ia / suma;
        let pb = solape * ib / suma;
        const lateral = (A.mueve && B.mueve && (A.vx || 0) * nx + (A.vz || 0) * nz > 0) ? 0.35 : 0;
        const mover = (C, s, sx, sz, lado) => {
          if (!s) return true;
          const tx = C.p.x + sx * s - lado * sz * s;
          const tz = C.p.z + sz * s + lado * sx * s;
          if (libre && !libre(tx, tz, C)) return false;
          C.p.x = tx;
          C.p.z = tz;
          return true;
        };
        const okA = mover(A, pa, -nx, -nz, lateral);
        if (!okA && !B.fijo) pb += pa;
        const okB = mover(B, pb, nx, nz, lateral);
        if (!okB && okA && !A.fijo && pb) mover(A, pb, -nx, -nz, 0);
      }
    }
  }
}
