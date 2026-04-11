import type { Connection, Vector2D, Node, Spring } from "./types";




const canvas = document.getElementById("canvas") as HTMLCanvasElement | null
if (!canvas) throw new Error("error");
const ctx = canvas.getContext("2d")
if (!ctx)throw new Error("error");



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




function simSpringMutable(
	nodes: Map<string, { pos: Vector2D; vel: Vector2D; }>,
	springs: Spring[],
	dt = 0.016
) {
	const forces = new Map<string, Vector2D>();

	// init forces
	for (const [id] of nodes) {
		forces.set(id, { x: 0, y: 0 });
	}

	// spring forces
	for (const spring of springs) {
		const a = nodes.get(spring.connection.a);
		const b = nodes.get(spring.connection.b);
		if (!a || !b) continue;

		const dx = b.pos.x - a.pos.x;
		const dy = b.pos.y - a.pos.y;
		const dist = Math.hypot(dx, dy) || 0.0001;

		const dirX = dx / dist;
		const dirY = dy / dist;

		const stretch = dist - spring.length;
		const forceMag = spring.stiffness * stretch;

		const fx = dirX * forceMag;
		const fy = dirY * forceMag;

		const damp = spring.dampening;

		// apply forces directly
		a.vel.x += fx * dt;
		a.vel.y += fy * dt;

		b.vel.x -= fx * dt;
		b.vel.y -= fy * dt;

		// damping (per spring is a nice touch btw)
		a.vel.x *= (1 - damp * dt);
		a.vel.y *= (1 - damp * dt);
		b.vel.x *= (1 - damp * dt);
		b.vel.y *= (1 - damp * dt);
	}

}




function simulatePhysics(
	nodes: Map<string, { pos: Vector2D; vel: Vector2D; }>,
	springs: Spring[],
	gravity: number,
	floor: number,
	dt = 0.016
) {
	simSpringMutable(nodes, springs, dt);

	// integrate (pulled out)
	for (const node of nodes.values()) {
		node.vel.y += gravity * dt;

		node.pos.x += node.vel.x * dt;
		node.pos.y = Math.min(node.pos.y + node.vel.y * dt, floor);
	}
}




