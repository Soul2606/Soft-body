import * as sim from "./simulation/simulation.js"
import * as api from "./simulation/api.js"
import type { Node, Spring } from "./simulation/types.js"
import { distanceToLine, GET as get } from "./simulation/utils.js"


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
		let closest = api.closestNode(10)
		if (!closest) return
		sim.setMouseAttach(closest[0])
	}


	if (mouseState === "delete") {
		const node = api.closestNode(10)

		if (node === undefined) {
			const spring = closestSpring(10)
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
		const node = api.closestNode(10)
		if (node === undefined) return
		if (interacting === undefined) {
			interacting = node[0]
			return
		}

		sim.connect(node[0], interacting)
		interacting = undefined
	}


	if (mouseState === "move") {
		const closest = api.closestNode(10)
		if (!closest) return

		interacting = closest[0]
	}
})



const mousePos = get("mouse-pos")
sim.canvas.addEventListener("mousemove", e => {
	mousePos.textContent = `${sim.mousePosition.x}, ${sim.mousePosition.y}`
	if (mouseState === "select") {
		const mPos = sim.mousePosition
		infoList.innerHTML = ""
		for (const [id, node] of sim.nodes) {
			if (node.pos.distanceTo(mPos) > 10) continue
			infoList.innerHTML += `<li>${id}</li>`
		}
	}


	if (mouseState === "move" && interacting) {
		api.moveTo(sim.mousePosition, interacting)
	}
})




api.addToAnimationFrame(ctx => {
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




function closestSpring(maxDistance = Infinity) {
	let spr = sim.struts.values().toArray()
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
	console.log(api.toSave());
	interacting = undefined
})




get("load").addEventListener("click", async () => {
	const res = await api.load("/saves/orb.json")
	for (const node of res.nodes) {
		sim.makeNode(node.pos)
	}

	for (const spring of res.struts) {
		sim.connect(
			spring.connection.a,
			spring.connection.b,
			spring.length,
			spring.dampening,
			spring.stiffness,
		)
	}
})

