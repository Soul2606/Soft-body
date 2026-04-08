import { simulatePhysics } from "./simulation.js";
import type { Connection, Vector2D, Node } from "./types";

console.log("Hello world!");

const canvas = document.getElementById("canvas") as HTMLCanvasElement | null
if (!canvas) throw new Error("error");
const ctx = canvas.getContext("2d")
if (!ctx)throw new Error("error");




function makeNodes(pos:Vector2D[]) {
	const nodes = new Map<string, Node>()
	for (let i = 0; i < pos.length; i++) {
		const p = pos[i]!;
		nodes.set(String(i), {
			pos:p,
			vel:{x:0, y:0}
		})
	}
	return nodes
}


const nodes = makeNodes([
	{x:10, y:10},
	{x:50, y:50},
	{x:250, y:150},
	{x:50, y:150},
])

const connections:Connection[] = [
	{a:"0", b:"1"},
	{a:"1", b:"2"},
	{a:"2", b:"0"},
	{a:"3", b:"0"},
	{a:"3", b:"2"},
	{a:"3", b:"1"},
]




const mousePos:Vector2D = {x:0, y:0}
canvas.addEventListener("mousemove", e=>{
	const rect = canvas.getBoundingClientRect();
	mousePos.x = e.clientX - rect.left
	mousePos.y = e.clientY - rect.top
})




const tick = () => {
	ctx.clearRect(0, 0, canvas.width, canvas.height)

	ctx.fillRect(mousePos.x-5, mousePos.y-5, 10, 10)

	ctx.fillStyle = "magenta"
	nodes.forEach((val,key)=>{
		ctx.fillRect(val.pos.x - 5, val.pos.y - 5, 10, 10)
	})

	ctx.strokeStyle = "black"
	for (const connection of connections) {
		const start = nodes.get(connection.a)?.pos
		if (!start) continue
		const end = nodes.get(connection.b)?.pos
		if (!end) continue
		ctx.beginPath()
		ctx.moveTo(start.x, start.y)
		ctx.lineTo(end.x, end.y)
		ctx.stroke()
	}

	simulatePhysics(
		nodes, 
		connections.map(v =>	({
			length:75,
			connection:v,
			dampening:2,
			stiffness:50
		})),
		10,
		600
	)

	requestAnimationFrame(tick)
}
tick()




