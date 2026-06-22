export function applyGravity(entity, gravity, dt) {
  entity.vy += gravity * dt;
}

export function applyFriction(vx, friction, dt) {
  if (Math.abs(vx) < friction * dt) return 0;
  return vx - Math.sign(vx) * friction * dt;
}

export function applyAcceleration(vx, accel, dt, maxSpeed) {
  vx += accel * dt;
  if (Math.abs(vx) > maxSpeed) vx = Math.sign(vx) * maxSpeed;
  return vx;
}
