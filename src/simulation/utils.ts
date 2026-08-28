import { Vector2D } from "../lib/math/vector2d.js";
import type { Spring } from "./types.js";

export function GET<T extends HTMLElement = HTMLElement>(id:string) {
	const el = document.getElementById(id)
	if (!el) throw new Error("Element does not exist");
	return el as T
}





export function distanceToLine(
	pos: Vector2D,
	line: { pos1: Vector2D; pos2: Vector2D }
) {
	const { pos1, pos2 } = line
	const a = pos1.y - pos2.y
	const b = pos2.x - pos1.x
	const c = pos1.x * pos2.y - pos2.x * pos1.y
	return Math.abs(a * pos.x + b * pos.y + c) / Math.sqrt(a * a + b * b)
}




/** Returns the area inside the polygon from the points assuming they form a closed loop */
export function area(points: Vector2D[]): number {
	if (points.length < 3) return 0

	let sum = 0

	for (let i = 0; i < points.length; i++) {
		const a = points[i]!
		const b = points[(i + 1) % points.length]!

		sum += a.x * b.y - b.x * a.y
	}

	return Math.abs(sum) * 0.5
}




export function simSpring(
	b: { pos: Vector2D; vel: Vector2D; },
	a: { pos: Vector2D; vel: Vector2D; },
	length: number,
	stiffness: number,
	dampening: number,
	dt: number) {
	const dx = b.pos.x - a.pos.x;
	const dy = b.pos.y - a.pos.y;
	const dist = Math.hypot(dx, dy) || 0.0001;

	const dirX = dx / dist;
	const dirY = dy / dist;

	const stretch = dist - length;
	const forceMag = stiffness * stretch;

	const fx = dirX * forceMag;
	const fy = dirY * forceMag;

	const damp = dampening;

	// apply forces directly
	a.vel.x += fx * dt;
	a.vel.y += fy * dt;

	b.vel.x -= fx * dt;
	b.vel.y -= fy * dt;

	// damping (per spring is a nice touch btw)
	a.vel.x *= (1 - damp * dt);
	a.vel.y *= (1 - damp * dt);
	b.vel.x *= (1 - damp * dt);
	b.vel.y *= (1 - damp * dt);
}




export function simStruts(
	nodes: Map<number, { pos: Vector2D; vel: Vector2D; }>,
	springs: Spring[],
	dt: number) {
	const forces = new Map<number, Vector2D>();

	// init forces
	for (const [id] of nodes) {
		forces.set(id, new Vector2D(0, 0));
	}

	// spring forces
	for (const spring of springs) {
		const a = nodes.get(spring.connection.a);
		const b = nodes.get(spring.connection.b);
		if (!a || !b) continue;

		simSpring(b, a, spring.length, spring.stiffness, spring.dampening, dt);
	}

}

