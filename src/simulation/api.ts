import { Vector2D } from "../lib/math/vector2d.js";
import type * as Ser from "./serialized-types.js";
import * as sim from "./simulation.js";
import { type DrawFnc, drawQueue, nodes, struts } from "./simulation.js";
import type { Spring, Node } from "./types.js";
import * as TriAl from "./triangle-alignment.js";


export const canvas = sim.canvas

export const mousePosition = sim.mousePosition



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




export function connect(idA: number, idB: number, length?: number, dampening = 2, stiffness = 50) {
	const nodeA = nodes.get(idA);
	const nodeB = nodes.get(idB);
	if (!nodeA || !nodeB) return false;
	const len = length === undefined ? nodeA.pos.distanceTo(nodeB.pos) : length;

	const spring: Spring = {
		connection: { a: idA, b: idB },
		dampening,
		stiffness,
		length: len,
	};

	const commons = connectedTo(idA).filter(id =>
		connectedTo(idB).includes(id)
	)

	for (const common of commons) {
		TriAl.add(idA, idB, common, nodes)
	}
	
	struts.add(spring);

	return structuredClone(spring);
}




export function deleteNode(id:number){
	nodes.delete(id)

	const connecting = sim.struts.values().toArray().filter(v =>
		v.connection.a === id || v.connection.b === id
	)

	for (const c of connecting) {
		struts.delete(c)
	}
}


export function deleteStrut(idA:number, idB:number) {
	const strut = struts.values().toArray().find(s =>
		s.connection.a === idA && s.connection.b === idB
	)
	if (strut) struts.delete(strut)
}




export function getNodes() {
	return new Map<number, Node>(
		nodes
		.entries()
		.toArray()
		.map<[number, Node]>(([key, val]) => ([
			key,
			{
				locked:val.locked,
				pos:Vector2D.from(val.pos),
				vel:Vector2D.from(val.vel)
			} satisfies Node
		]))
	)
}

export function getStruts() {
	return new Set<Spring>(structuredClone(struts.values().toArray()))
}




export function moveTo(target: Vector2D, nodeId: number) {
	const node = nodes.get(nodeId);
	if (!node) return false;

	const connected = connectedStruts(nodeId);
	if (!connected) return false;


	for (const spring of connected) {
		const isA = spring.connection.a === nodeId;
		const node = nodes.get(isA ? spring.connection.b : spring.connection.a);
		if (!node) continue;
		const oldPos = Vector2D.from(node.pos);
		spring.length = target.distanceTo(oldPos);
	}

	node.pos = Vector2D.from(target);

	return true;
}




export function connectedStruts(nodeId: number) {
	const node = nodes.get(nodeId);
	if (!node) return [];

	return structuredClone(
		struts
		.values()
		.toArray()
		.filter(spr => 
			spr.connection.a === nodeId || spr.connection.b === nodeId
		)
	)
}



export function connectedTo(nodeId:number) {
	const ids:number[] = []
	for (const strut of connectedStruts(nodeId)) {
		if (strut.connection.a === nodeId) {
			ids.push(strut.connection.b)
		} else {
			ids.push(strut.connection.a)
		}
	}
	return ids
}




export async function load(url: string) {
	const json: { nodes: Ser.Node[]; struts: Spring[]; } = await (await fetch(url)).json();
	const nodes = json.nodes
	const struts = json.struts
	const idMap = new Map<number, number>()

	for (const node of nodes) {
		const {id} = makeNode(
			new Vector2D(node.pos.x, node.pos.y),
			new Vector2D(node.vel.x, node.vel.y)
		)
		idMap.set(node.id, id)
	}

	for (const spring of struts) {
		connect(
			idMap.get(spring.connection.a)!,
			idMap.get(spring.connection.b)!,
			spring.length,
			spring.dampening,
			spring.stiffness,
		)
	}
}




export function toSave(): { nodes: Ser.Node[]; struts: Spring[]; } {
	return {
		nodes: nodes.entries().toArray().map(([id, node]) => ({
			id,
			pos: { x: node.pos.x, y: node.pos.y },
			vel: { x: node.vel.x, y: node.vel.y },
			locked: node.locked,
		} satisfies Ser.Node)),
		struts: struts.values().toArray().map(s => structuredClone(s))
	};
}




export function addToAnimationFrame(fnc: DrawFnc) {
	drawQueue.persist.add(fnc);
	return () => drawQueue.persist.delete(fnc);
}




export function closestNode(
	maxDistance = Infinity) {
	let nodes = sim.nodes.entries().toArray()
	const mPos = sim.mousePosition

	nodes = nodes.filter(([key, val]) => val.pos.distanceTo(mPos) < maxDistance
	)

	let distance = Infinity
	let node: [number, Node] | undefined
	for (const [id, val] of nodes) {
		const dist = val.pos.distanceTo(mPos)
		if (distance > dist) {
			distance = dist
			node = [id, val]
		}
	}

	return node
}




export var mouseAttached: undefined | number;

export function setMouseAttach(id?:number) {
	mouseAttached = id
}


