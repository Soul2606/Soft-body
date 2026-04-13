import * as sim from "./simulation.js"
import { GET } from "./utils.js"


const infoList = GET("info")

var mouseState:"make"|"move"|"connect"|"delete"|"pan"|"select" = "make"

window.addEventListener("keypress", e => {
	if (e.code !== "KeyM") return
	switch (mouseState) {
		case "make":
			mouseState = "select"
			break;
		case "move":
		case "connect":
		case "delete":
		case "pan":
		case "select":
			mouseState = "make"
			break;
	}
	console.log(mouseState);
})




sim.canvas.addEventListener("click", e => {
	if (mouseState === "make") {
		sim.makeNode(sim.mousePosition)
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

