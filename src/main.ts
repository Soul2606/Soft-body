import * as sim from "./simulation.js"
import type { Node } from "./types.js"
import { GET } from "./utils.js"


const infoList = GET<HTMLUListElement>("info")

var mouseState:"make"|"move"|"connect"|"delete"|"pan"|"select" = "make"


window.addEventListener("keydown", e => {
	console.log("keydown", e.code);
	
	switch (e.code) {
		case "KeyM":
			switch (mouseState) {
				case "make":
					mouseState = "select"
					break;
				case "select":
					mouseState = "move"
					break;
				case "move":
					mouseState = "make"
					break;
			}
			console.log(mouseState);
			break;
		case "Escape":
			console.log("escape");
			
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


	if (mouseState === "move") {
		let closest
		let closestDist = Infinity
		for (const [id, node] of sim.nodes) {
			const dist = node.pos.distanceTo(sim.mousePosition)
			if (dist < closestDist) {
				closestDist = dist
				closest = id
			}
		}
		if (!closest) return
		sim.setMouseAttach(closest)
	}
})




sim.canvas.addEventListener("mousemove", e => {
	if (mouseState !== "select") return
	const mPos = sim.mousePosition
	infoList.innerHTML = ""
	for (const [id, node] of sim.nodes) {
		if (node.pos.distanceTo(mPos) > 10) continue
		infoList.innerHTML += `<li>${id}</li>`
	}
})




sim.addToAnimationFrame(ctx => {
	if (mouseState === "make") {
		const mPos = sim.mousePosition
		for (const [id, node] of validConnections()) {
			ctx.beginPath()
			ctx.moveTo(mPos.x, mPos.y)
			ctx.lineTo(node.pos.x, node.pos.y)
			ctx.stroke()
		}
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