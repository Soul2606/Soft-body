import * as sim from "./simulation.js"
import type { Node } from "./types.js"
import { GET } from "./utils.js"


const infoList = GET<HTMLUListElement>("info")

var mouseState:"make"|"move"|"connect"|"delete"|"pan"|"select" = "make"


window.addEventListener("keypress", e => {
	if (e.code !== "KeyM") return
	switch (mouseState) {
		case "make":
			mouseState = "select"
			break;
		case "select":
			mouseState = "make"
			break;
	}
	console.log(mouseState);
})




sim.canvas.addEventListener("click", e => {
	if (mouseState === "make") {
		const ids = validConnections().map(v => v[0])
		const data = sim.makeNode(sim.mousePosition)
		for (const id of ids) {
			sim.connections.push({a:data.id, b:id})
		}
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



// IT WORKS PERFECTLY!
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