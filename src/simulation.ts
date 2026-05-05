import type { Node, Spring } from "./types";
import { GET, Vector2D } from "./utils.js";
import type * as Ser from "./serialized-types.js";


type DrawFnc = (ctx:CanvasRenderingContext2D)=>void


export const canvas = GET<HTMLCanvasElement>("canvas")
const ctx = canvas.getContext("2d")
if (!ctx)throw new Error("error");



export const nodes = new Map<number, Node>()
export const struts = new Set<Spring>()
export const cameraPos = new Vector2D(0,0)

const mousePos:Vector2D = new Vector2D(0,0)
const floor = 600
const drawQueue = {
	permanent: new Set<DrawFnc>(),
	once:      new Set<DrawFnc>(),
}

var mouseAttached:undefined|number




let nextId = 0
export function makeNode(position:Vector2D, velocity:Vector2D = new Vector2D(0,0)) {
	nextId++
	while (nodes.has(nextId)) {
		nextId++
	}
	let id = nextId
	const node:Node = {
		pos:Vector2D.from(position),
		vel:Vector2D.from(velocity),
		locked:false,
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




export function connect(idA:number, idB:number, length?:number, dampening = 2, stiffness = 50) {
	const nodeA = nodes.get(idA)
	const nodeB = nodes.get(idB)
	if (!nodeA || !nodeB) return false
	if (length === undefined) {
		struts.add({
			connection:{a:idA, b:idB},
			dampening,
			stiffness,
			length: nodeA.pos.distanceTo(nodeB.pos),
		})
	} else {
		struts.add({
			connection:{a:idA, b:idB},
			dampening,
			stiffness,
			length,
		})
	}
	return true
}




export function setMouseAttach(id?:number) {
	mouseAttached = id
}

export function getMouseAttach() {
	return mouseAttached
}




let now = Date.now()
const tick = () => {
	let n = Date.now()
	const deltaT = (n - now) / 1000
	now = n
	
	ctx.setTransform(1,0,0,1,0,0)
	ctx.clearRect(0, 0, canvas.width, canvas.height)
	ctx.translate(-cameraPos.x, -cameraPos.y)

	ctx.beginPath()
	ctx.moveTo(0, floor)
	ctx.lineTo(canvas.width, floor)
	ctx.stroke()

	ctx.fillStyle = "magenta"
	nodes.forEach((val,key)=>{
		ctx.fillRect(val.pos.x - 5, val.pos.y - 5, 10, 10)
	})

	ctx.strokeStyle = "black"
	for (const connection of struts) {
		const start = nodes.get(connection.connection.a)?.pos
		if (!start) continue
		const end = nodes.get(connection.connection.b)?.pos
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
		struts.values().toArray(),
		0,
		floor,
		deltaT
	)

	requestAnimationFrame(tick)
}
tick()




function simStruts(
	nodes: Map<number, { pos: Vector2D; vel: Vector2D; }>,
	springs: Spring[],
	dt:number
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

		simSpring(b, a, spring.length, spring.stiffness, spring.dampening, dt);
	}

}




function simSpring(
	b: { pos: Vector2D; vel: Vector2D; }, 
	a: { pos: Vector2D; vel: Vector2D; }, 
	length:number, 
	stiffness:number, 
	dampening:number, 
	dt: number
) {
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




function simulatePhysics(
	nodes: Map<number, Node>,
	springs: Spring[],
	gravity: number,
	floor: number,
	dt:number
) {
	simStruts(nodes, springs, dt);

	if (mouseAttached) {
		const node = nodes.get(mouseAttached)
		if (!node) return

		const mockNode = {pos: Vector2D.from(mousePosition), vel: new Vector2D(0,0)}

		simSpring(node, mockNode, 0, 100, 1, dt)
	}

	for (const node of nodes.values()) {
		node.vel.y += gravity * dt;

		node.pos.x += node.vel.x * dt;
		node.pos.y = Math.min(node.pos.y + node.vel.y * dt, floor);
	}
}




export function toSave():{nodes:Ser.Node[], struts:Spring[]} {
	return {
		nodes:nodes.entries().toArray().map(([id, node]) => ({
			id,
			pos:{x:node.pos.x, y:node.pos.y},
			vel:{x:node.vel.x, y:node.vel.y},
		})),
		struts:struts.values().toArray().map(s => structuredClone(s))
	}
}

