import type { Node, Spring } from "./types";
import { GET, simSpring, simStruts } from "./utils.js";
import { Vector2D } from "../lib/math/vector2d.js";


export type DrawFnc = (ctx:CanvasRenderingContext2D)=>void


export const canvas = GET<HTMLCanvasElement>("canvas")
const ctx = canvas.getContext("2d")
if (!ctx)throw new Error("error");



export const nodes = new Map<number, Node>()
export const struts = new Set<Spring>()
export const cameraPos = new Vector2D(0,0)

const mousePos:Vector2D = new Vector2D(0,0)
const floor = 600
export const drawQueue = {
	persist: new Set<DrawFnc>(),
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




export function connect(idA:number, idB:number, length?:number, dampening = 2, stiffness = 50) {
	const nodeA = nodes.get(idA)
	const nodeB = nodes.get(idB)
	if (!nodeA || !nodeB) return false
	const len = length === undefined ? nodeA.pos.distanceTo(nodeB.pos) : length

	const spring:Spring = {
		connection:{a:idA, b:idB},
		dampening,
		stiffness,
		length:len,
	}

	struts.add(spring)

	return spring
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

	for (const fnc of drawQueue.persist) {
		fnc(ctx)
	}

	for (const fnc of drawQueue.once) {
		fnc(ctx)
	}
	drawQueue.once.clear()

	simulatePhysics(
		nodes, 
		struts.values().toArray(),
		deltaT,
		{
			gravity:0,
			floor:floor,
			drag:0.4,
		}
	)

	requestAnimationFrame(tick)
}
tick()




function simulatePhysics(
	nodes: Map<number, Node>,
	springs:Spring[],
	dt:number,
	options:{
		gravity:number
		floor:number
		drag:number
	}
) {
	simStruts(nodes, springs, dt);

	if (mouseAttached) {
		const node = nodes.get(mouseAttached)
		if (!node) return

		const mockNode = {pos: Vector2D.from(mousePosition), vel: new Vector2D(0,0)}

		simSpring(node, mockNode, 0, 100, 1, dt)
	}

	for (const node of nodes.values()) {
		node.vel.y += options.gravity * dt;
		node.vel.subtract(new Vector2D(options.drag * node.vel.length * dt))

		node.pos.x += node.vel.x * dt;
		node.pos.y = Math.min(node.pos.y + node.vel.y * dt, options.floor);
	}
}





