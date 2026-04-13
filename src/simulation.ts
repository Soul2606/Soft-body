import type { Connection, Node, Spring } from "./types";
import { GET, Vector2D } from "./utils.js";


type DrawFnc = (ctx:CanvasRenderingContext2D)=>void


export const canvas = GET<HTMLCanvasElement>("canvas")
const ctx = canvas.getContext("2d")
if (!ctx)throw new Error("error");



export const nodes = new Map<number, Node>()
export const connections:Connection[] = []
export const cameraPos = new Vector2D(0,0)

const mousePos:Vector2D = new Vector2D(0,0)
const floor = 600
const drawQueue = {
	permanent: new Set<DrawFnc>(),
	once:      new Set<DrawFnc>(),
}


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



/**Constantly mutated to match mouse position in world. */
export const mousePosition:Readonly<Vector2D> = mousePos

canvas.addEventListener("mousemove", e=>{
	const rect = canvas.getBoundingClientRect();
	mousePos.x = e.clientX - rect.left + cameraPos.x
	mousePos.y = e.clientY - rect.top + cameraPos.y
})




export function addToAnimationFrame(fnc:DrawFnc) {
	drawQueue.permanent.add(fnc)
	return ()=>drawQueue.permanent.delete(fnc)
}




const tick = () => {
	ctx.setTransform(1,0,0,1,0,0)
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	ctx.translate(-cameraPos.x, -cameraPos.y)

	ctx.fillRect(mousePos.x - 5, mousePos.y - 5, 10, 10)

	ctx.beginPath()
	ctx.moveTo(0, floor)
	ctx.lineTo(canvas.width, floor)

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

	for (const fnc of drawQueue.permanent) {
		fnc(ctx)
	}

	for (const fnc of drawQueue.once) {
		fnc(ctx)
	}
	drawQueue.once.clear()

	simulatePhysics(
		nodes, 
		connections.map(v =>	({
			length:75,
			connection:v,
			dampening:2,
			stiffness:50
		})),
		10,
		floor
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




