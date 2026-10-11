import { Vector2D } from "./lib/math/vector2d.js";
import * as Sim from "./simulation/api.js"
import * as TriAl from "./simulation/triangle-alignment.js";
import type { Node } from "./simulation/types.js"
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
			Sim.setMouseAttach()
			break;
	}
})




Sim.canvas.addEventListener("click", e => {
	if (mouseState === "make") {
		const ids = validConnections().map(v => v[0])
		const data = Sim.makeNode(Sim.mousePosition)
		for (const id of ids) {
			Sim.connect(data.id, id)
		}
	}


	if (mouseState === "drag") {
		if (Sim.mouseAttached !== undefined) {
			Sim.setMouseAttach()
			return
		}
		let closest = Sim.closestNode(10)
		if (!closest) return
		Sim.setMouseAttach(closest[0])
	}


	if (mouseState === "delete") {
		const node = Sim.closestNode(10)

		if (node === undefined) {
			const spring = closestSpring(10)
			if (spring === undefined) return
			Sim.deleteStrut(spring.connection.a, spring.connection.b)
			return
		}

		const id = node[0]
		Sim.deleteNode(id)
	}


	if (mouseState === "connect") {
		const node = Sim.closestNode(10)
		if (node === undefined) return
		if (interacting === undefined) {
			interacting = node[0]
			return
		}

		Sim.connect(node[0], interacting)
		interacting = undefined
	}


	if (mouseState === "move") {
		const closest = Sim.closestNode(10)
		if (!closest) return

		interacting = closest[0]
	}
})



const mousePos = get("mouse-pos")
Sim.canvas.addEventListener("mousemove", e => {
	mousePos.textContent = `${Sim.mousePosition.x}, ${Sim.mousePosition.y}`
	if (mouseState === "select") {
		const mPos = Sim.mousePosition
		infoList.innerHTML = ""
		for (const [id, node] of Sim.getNodes()) {
			if (node.pos.distanceTo(mPos) > 10) continue
			infoList.innerHTML += `<li>${id}</li>`
		}
	}


	if (mouseState === "move" && interacting) {
		Sim.moveTo(Sim.mousePosition, interacting)
	}
})




Sim.addToAnimationFrame(ctx => {
	const mPos = Sim.mousePosition

	if (mouseState === "make") {
		for (const [id, node] of validConnections()) {
			ctx.beginPath()
			ctx.moveTo(mPos.x, mPos.y)
			ctx.lineTo(node.pos.x, node.pos.y)
			ctx.stroke()
		}
	}

	for (const [id, node] of Sim.getNodes()) {
		if (id !== interacting) continue
		ctx.beginPath()
		ctx.moveTo(node.pos.x, node.pos.y)
		ctx.lineTo(mPos.x, mPos.y)
		ctx.stroke()
	}
})




function validConnections() {
	const results:[number, Node][] = []
	const mPos = Sim.mousePosition
	for (const node of Sim.getNodes()) {
		if (node[1].pos.distanceTo(mPos) < 100) {
			results.push(node)
		}
	}
	return results
}




function closestSpring(maxDistance = Infinity) {
	let spr = Sim.getStruts().values().toArray()
	const mPos = Sim.mousePosition
	const springs = spr.map(val => {
		const nodeA = Sim.getNodes().get(val.connection.a)
		const nodeB = Sim.getNodes().get(val.connection.b)
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
	console.log(Sim.toSave());
	interacting = undefined
})




get("load").addEventListener("click", () => {
	Sim.load("/saves/orb.json")
})


// It does not work!
{
	const n1 = Sim.makeNode(new Vector2D(100,100))
	const n2 = Sim.makeNode(new Vector2D(200,100))
	const n3 = Sim.makeNode(new Vector2D(150,200))
	TriAl.add(n1.id, n2.id, n3.id, Sim.getNodes())
}