import type { Connection, Node, Spring } from "./types";
import { Vector2D } from "./utils.js";




const _canvas = document.getElementById("canvas") as HTMLCanvasElement | null
if (!_canvas) throw new Error("error");
const ctx = _canvas.getContext("2d")
if (!ctx)throw new Error("error");


export const canvas = _canvas

export const nodes = new Map<number, Node>()
export const connections:Connection[] = []

let nextId = 0
export function makeNode(position:Vector2D, velocity:Vector2D = new Vector2D(0,0)) {
	nextId++
	while (nodes.has(nextId)) {
		nextId++
	}
	let id = nextId
	const node:Node = {
		pos:Vector2D.from(position),
		vel:Vector2D.from(velocity)
	}
	nodes.set(id, node)
	return { id, node }
}




const mousePos:Vector2D = new Vector2D(0,0)
export const mousePosition:Readonly<Vector2D> = mousePos

_canvas.addEventListener("mousemove", e=>{
	const rect = _canvas.getBoundingClientRect();
	mousePos.x = e.clientX - rect.left
	mousePos.y = e.clientY - rect.top
})




const tick = () => {
	ctx.clearRect(0, 0, _canvas.width, _canvas.height)

	ctx.fillRect(mousePos.x-5, mousePos.y-5, 10, 10)

	ctx.fillStyle = "magenta"
	nodes.forEach((val,key)=>{
		ctx.fillRect(val.pos.x - 5, val.pos.y - 5, 10, 10)
	})

	ctx.strokeStyle = "black"
	for (const connection of connections) {
		const start = nodes.get(connection.a)?.pos
		if (!start) continue
		const end = nodes.get(connection.b)?.pos
		if (!end) continue
		ctx.beginPath()
		ctx.moveTo(start.x, start.y)
		ctx.lineTo(end.x, end.y)
		ctx.stroke()
	}

	simulatePhysics(
		nodes, 
		connections.map(v =>	({
			length:75,
			connection:v,
			dampening:2,
			stiffness:50
		})),
		10,
		600
	)

	requestAnimationFrame(tick)
}
tick()




function simSpringMutable(
	nodes: Map<number, { pos: Vector2D; vel: Vector2D; }>,
	springs: Spring[],
	dt = 0.016
) {
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

		const dx = b.pos.x - a.pos.x;
		const dy = b.pos.y - a.pos.y;
		const dist = Math.hypot(dx, dy) || 0.0001;

		const dirX = dx / dist;
		const dirY = dy / dist;

		const stretch = dist - spring.length;
		const forceMag = spring.stiffness * stretch;

		const fx = dirX * forceMag;
		const fy = dirY * forceMag;

		const damp = spring.dampening;

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

}




function simulatePhysics(
	nodes: Map<number, { pos: Vector2D; vel: Vector2D; }>,
	springs: Spring[],
	gravity: number,
	floor: number,
	dt = 0.016
) {
	simSpringMutable(nodes, springs, dt);

	// integrate (pulled out)
	for (const node of nodes.values()) {
		node.vel.y += gravity * dt;

		node.pos.x += node.vel.x * dt;
		node.pos.y = Math.min(node.pos.y + node.vel.y * dt, floor);
	}
}




