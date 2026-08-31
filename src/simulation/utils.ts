import { Line } from "../lib/math/line.js";
import { Vector2D } from "../lib/math/vector2d.js";
import type { Connection, Node, Spring, Triangle } from "./types.js";

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




export function triangles(connections: Connection[]): Triangle[] {
	const links = new Map<number, Set<number>>()

	for (const {a, b} of connections) {
		if (!links.has(a)) links.set(a, new Set())
		if (!links.has(b)) links.set(b, new Set())

		links.get(a)!.add(b)
		links.get(b)!.add(a)
	}

	const result: Triangle[] = []

	for (const [a, bs] of links) {
		for (const b of bs) {
			if (b <= a) continue

			for (const c of links.get(b)!) {
				if (c <= b) continue
				if (bs.has(c)) result.push({a, b, c})
			}
		}
	}

	return result
}




function isClockwise(nodes:[[number, Node], [number, Node], [number, Node]]) {
	const l = new Line(nodes[0][1].pos, nodes[1][1].pos);
	return l.orient(nodes[2][1].pos) < 0
}




export function clockwise(nodes:[[number, Node], [number, Node], [number, Node]]):[number, number, number] {
	if (isClockwise(nodes)) {
		return [
			nodes[0][0],
			nodes[1][0],
			nodes[2][0],
		]
	} else {
		return [
			nodes[0][0],
			nodes[2][0],
			nodes[1][0],
		]
	}
}

console.log(clockwise([
	[0, {locked:false, pos:new Vector2D(0, 0), vel: new Vector2D()}],
	[1, {locked:false, pos:new Vector2D(-1, 0), vel: new Vector2D()}],
	[2, {locked:false, pos:new Vector2D(-1, 1), vel: new Vector2D()}]
]))




export function correctTriangle(triangle:[number, number, number], nodes:Map<number, Node>) {
	const n0 = nodes.get(triangle[0])
	const n1 = nodes.get(triangle[1])
	const n2 = nodes.get(triangle[2])
	if (!n0 || !n1 || !n2) throw new Error("error");
	
	if (
		isClockwise([
			[triangle[0], n0],
			[triangle[1], n1],
			[triangle[2], n2],
		])
	) {
		return
	}


}

