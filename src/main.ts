import * as sim from "./simulation.js"
import type { Node, Spring } from "./types.js"
import { distanceToLine, GET as get } from "./utils.js"


const infoList = get<HTMLUListElement>("info")

var mouseState:"make"|"drag"|"connect"|"delete"|"pan"|"select"|"move" = "make"
var interacting:number|undefined



get("select").addEventListener("click", () => {
	mouseState = "select"
	interacting = undefined
})

get("add").addEventListener("click", () => {
	mouseState = "make"
	interacting = undefined
})

get("delete").addEventListener("click", () => {
	mouseState = "delete"
	interacting = undefined
})

get("drag").addEventListener("click", () => {
	mouseState = "drag"
	interacting = undefined
})

get("connect").addEventListener("click", () => {
	mouseState = "connect"
	interacting = undefined
})

get("move").addEventListener("click", () => {
	mouseState = "move"
	interacting = undefined
})




window.addEventListener("keydown", e => {
	console.log("keydown", e.code);
	
	switch (e.code) {
		case "Escape":
			console.log("escape");
			interacting = undefined
			sim.setMouseAttach()
			break;
	}
})




sim.canvas.addEventListener("click", e => {
	if (mouseState === "make") {
		const ids = validConnections().map(v => v[0])
		const data = sim.makeNode(sim.mousePosition)
		for (const id of ids) {
			sim.connect(data.id, id)
		}
	}


	if (mouseState === "drag") {
		if (sim.getMouseAttach() !== undefined) {
			sim.setMouseAttach()
			return
		}
		let closest = closestNode(sim.nodes.entries().toArray(), 10)
		if (!closest) return
		sim.setMouseAttach(closest[0])
	}


	if (mouseState === "delete") {
		const node = closestNode(sim.nodes.entries().toArray(), 10)

		if (node === undefined) {
			const spring = closestSpring(sim.struts.values().toArray(), 10)
			if (spring === undefined) return
			sim.struts.delete(spring)
			return
		}

		const id = node[0]
		sim.nodes.delete(id)
		const connecting = sim.struts.values().toArray().filter(v =>
			v.connection.a === id || v.connection.b === id
		)

		for (const c of connecting) {
			sim.struts.delete(c)
		}
	}


	if (mouseState === "connect") {
		const node = closestNode(sim.nodes.entries().toArray(), 10)
		if (node === undefined) return
		if (interacting === undefined) {
			interacting = node[0]
			return
		}

		sim.connect(node[0], interacting)
		interacting = undefined
	}


	if (mouseState === "move") {
		const closest = closestNode(sim.nodes.entries().toArray(), 10)
		if (!closest) return

		interacting = closest[0]
	}
})




sim.canvas.addEventListener("mousemove", e => {
	if (mouseState === "select") {
		const mPos = sim.mousePosition
		infoList.innerHTML = ""
		for (const [id, node] of sim.nodes) {
			if (node.pos.distanceTo(mPos) > 10) continue
			infoList.innerHTML += `<li>${id}</li>`
		}
	}


	if (mouseState === "move" && interacting) {
		sim.moveTo(sim.mousePosition, interacting)
	}
})




sim.addToAnimationFrame(ctx => {
	const mPos = sim.mousePosition

	if (mouseState === "make") {
		for (const [id, node] of validConnections()) {
			ctx.beginPath()
			ctx.moveTo(mPos.x, mPos.y)
			ctx.lineTo(node.pos.x, node.pos.y)
			ctx.stroke()
		}
	}

	for (const [id, node] of sim.nodes) {
		if (id !== interacting) continue
		ctx.beginPath()
		ctx.moveTo(node.pos.x, node.pos.y)
		ctx.lineTo(mPos.x, mPos.y)
		ctx.stroke()
	}
})




function validConnections() {
	const results:[number, Node][] = []
	const mPos = sim.mousePosition
	for (const node of sim.nodes) {
		if (node[1].pos.distanceTo(mPos) < 100) {
			results.push(node)
		}
	}
	return results
}




function closestNode(
	nodes: [number, Node][],
	maxDistance = Infinity
) {
	const mPos  = sim.mousePosition

	nodes = nodes.filter(([key,val]) =>
		val.pos.distanceTo(mPos) < maxDistance
	)

	let distance = Infinity
	let node:[number, Node]|undefined
	for (const [id, val] of nodes) {
		const dist = val.pos.distanceTo(mPos)
		if (distance > dist) {
			distance = dist
			node = [id, val]
		}
	}

	return node
}




function closestSpring(spr:Spring[], maxDistance = Infinity) {
	const mPos = sim.mousePosition
	const springs = spr.map(val => {
		const nodeA = sim.nodes.get(val.connection.a)
		const nodeB = sim.nodes.get(val.connection.b)
		if (!nodeA || !nodeB) return null
		return {
			spring:   val,
			dist: distanceToLine(mPos, {
				pos1: nodeA.pos,
				pos2: nodeB.pos
			}),
		}
	}).filter(val =>
		val !== null
	).filter(val =>
		val.dist < maxDistance
	)

	if (springs.length === 0) return

	let distance = Infinity
	let spring
	for (const val of springs) {
		if (distance > val.dist) {
			distance = val.dist
			spring = val.spring
		}
	}

	return spring
}




get("save").addEventListener("click", () => {
	console.log(sim.toSave());
	interacting = undefined
})
