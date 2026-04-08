import type { Connection, Node, Vector2D } from "./types.js";




type Spring = {
	length: number;
	stiffness: number;
	dampening: number;
	connection: Connection;
};



export function simSpringMutable(
	nodes: Map<string, { pos: Vector2D; vel: Vector2D }>,
	springs: Spring[],
	dt = 0.016
) {
	const forces = new Map<string, Vector2D>()

	// init forces
	for (const [id] of nodes) {
		forces.set(id, { x: 0, y: 0 })
	}

	// spring forces
	for (const spring of springs) {
		const a = nodes.get(spring.connection.a)
		const b = nodes.get(spring.connection.b)
		if (!a || !b) continue

		const dx = b.pos.x - a.pos.x
		const dy = b.pos.y - a.pos.y
		const dist = Math.hypot(dx, dy) || 0.0001

		const dirX = dx / dist
		const dirY = dy / dist

		const stretch = dist - spring.length
		const forceMag = spring.stiffness * stretch

		const fx = dirX * forceMag
		const fy = dirY * forceMag

		const damp = spring.dampening

		// apply forces directly
		a.vel.x += fx * dt
		a.vel.y += fy * dt

		b.vel.x -= fx * dt
		b.vel.y -= fy * dt

		// damping (per spring is a nice touch btw)
		a.vel.x *= (1 - damp * dt)
		a.vel.y *= (1 - damp * dt)
		b.vel.x *= (1 - damp * dt)
		b.vel.y *= (1 - damp * dt)
	}

}




export function simulatePhysics(
	nodes:Map<string, { pos: Vector2D; vel: Vector2D }>,
	springs:Spring[],
	gravity:number,
	floor:number,
	dt = 0.016
) {
	simSpringMutable(nodes, springs, dt)

	// integrate (pulled out)
	for (const node of nodes.values()) {
		node.vel.y += gravity * dt

		node.pos.x += node.vel.x * dt
		node.pos.y = Math.min(node.pos.y + node.vel.y * dt, floor)
	}
}

