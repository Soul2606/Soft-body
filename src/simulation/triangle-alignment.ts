import { Line } from "../lib/math/line.js"
import { Vector2D } from "../lib/math/vector2d.js"
import type { Node } from "./types"

type Triangle = {
	a:number,
	b:number,
	c:number
}

const triangles:Triangle[] = []


export function add(node0:number, node1:number, node2:number, nodes:Map<number, Node>) {
	triangles.push(clockwise({a:node0, b:node1, c:node2}, nodes))
}

export function correct(nodes:Map<number, Node>) {
	for (const triangle of triangles) {
		const n0 = nodes.get(triangle.a)
		const n1 = nodes.get(triangle.b)
		const n2 = nodes.get(triangle.c)
		if (!n0 || !n1 || !n2) throw new Error("error");
		
		if (
			isClockwise([n0, n1, n2])
		) {
			continue
		}
	
		const l0 = {
			line:new Line(n0.pos, n1.pos),
			node:n2
		}
		const l1 = {
			line:new Line(n1.pos, n2.pos),
			node:n0
		}
		const l2 = {
			line:new Line(n2.pos, n0.pos),
			node:n1
		}
	
		const group = [l0, l1, l2].sort((a,b) => 
			a.line.length - b.line.length
		)

		const short = group[2]!
		const opposing = [group[1]!, group[0]!]
	
		short.node.pos = reflectPoint(
			short.node.pos,
			short.line.a,
			short.line.b
		)

		const av = group.reduce((prev, l) => 
			prev.add(l.node.vel)
		, new Vector2D())

		for (const node of group) {
			node.node.vel.add(av).divide(4)
		}
	}
}




function isClockwise(nodes:[Node, Node, Node]) {
	const l = new Line(nodes[0].pos, nodes[1].pos);
	return l.orient(nodes[2].pos) < 0
}




function clockwise(triangle:Triangle, nodes:Map<number, Node>):Triangle {
	const n0 = nodes.get(triangle.a)
	const n1 = nodes.get(triangle.b)
	const n2 = nodes.get(triangle.c)
	if (!n0 || !n1 || !n2) throw new Error("error");

	if (isClockwise([n0, n1, n2])) {
		return {
			a:triangle.a,
			b:triangle.b,
			c:triangle.c,
		}
	} else {
		return {
			a:triangle.a,
			c:triangle.c,
			b:triangle.b,
		}
	}
}


function reflectPoint(
	p: Vector2D,
	a: Vector2D,
	b: Vector2D
): Vector2D {
	const dx = b.x - a.x
	const dy = b.y - a.y

	const t = (
		(p.x - a.x) * dx +
		(p.y - a.y) * dy
	) / (dx * dx + dy * dy)

	const x = a.x + t * dx
	const y = a.y + t * dy

	return new Vector2D(
		2 * x - p.x,
		2 * y - p.y
	)
}
