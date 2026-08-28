import { Vector2D } from "../lib/math/vector2d.js";
import type * as Ser from "./serialized-types.js";
import { type DrawFnc, drawQueue, nodes, struts } from "./simulation.js";
import type { Spring, Node } from "./types.js";




export function moveTo(target: Vector2D, nodeId: number) {
	const node = nodes.get(nodeId);
	if (!node) return false;

	const connected = connectedTo(nodeId);
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




export function connectedTo(nodeId: number) {
	const node = nodes.get(nodeId);
	if (!node) return;

	return struts.values().toArray().filter(spr => spr.connection.a === nodeId || spr.connection.b === nodeId
	);
}




export async function load(url: string) {
	const json: { nodes: Ser.Node[]; struts: Spring[]; } = await (await fetch(url)).json();

	return {
		nodes: json.nodes.map<Node>(n => ({
			pos: new Vector2D(n.pos.x, n.pos.y),
			vel: new Vector2D(n.pos.x, n.pos.y),
			locked: false,
		})),
		struts: json.struts,
	};
}




export function toSave(): { nodes: Ser.Node[]; struts: Spring[]; } {
	return {
		nodes: nodes.entries().toArray().map(([id, node]) => ({
			id,
			pos: { x: node.pos.x, y: node.pos.y },
			vel: { x: node.vel.x, y: node.vel.y },
			locked: node.locked,
		})),
		struts: struts.values().toArray().map(s => structuredClone(s))
	};
}




export function addToAnimationFrame(fnc: DrawFnc) {
	drawQueue.persist.add(fnc);
	return () => drawQueue.persist.delete(fnc);
}

