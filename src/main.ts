import * as sim from "./simulation.js"




var mouseState:"make"|"move"|"connect"|"delete"|"pan"|"select" = "make"




sim.canvas.addEventListener("click", e => {
	if (mouseState === "make") {
		sim.makeNode(sim.mousePosition)
	}
})




sim.canvas.addEventListener("mousemove", e => {
	if (mouseState !== "select") return
	const mPos = sim.mousePosition
	for (const [id, node] of sim.nodes) {
		
	}
})

