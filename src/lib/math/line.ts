import { Vector2D } from "./vector2d.js";

export class Line {

	static from(l:Line) {
		return new Line(Vector2D.from(l.a), Vector2D.from(l.b))
	}

	a:Vector2D
	b:Vector2D
	constructor(start:Vector2D, end:Vector2D) {
		this.a = Vector2D.from(start)
		this.b = Vector2D.from(end)
	}

	get length() : number {
		return this.a.distanceTo(this.b)
	}
	
	set length(v: number) {
		const center = this.midpoint()
		const dir = this.toVec()

		const half = v / 2

		this.a = Vector2D.from(center).subtract(dir.scale(half))
		this.b = Vector2D.from(center).add(dir.scale(half))
	}

	midpoint() {
		return Vector2D.from(this.a).add(this.b).divide(2)
	}

	toVec() {
		return Vector2D.from(this.b).subtract(this.a).normalize()
	}

	traceOnPoint(p:Vector2D) {
		const epsilon = 0.0001
		return Math.abs(this.orient(p)) < epsilon
	}

	/**Read orient on Vector2d to lear more. */
	orient(p:Vector2D) {
		return p.orient(this.a, this.b)
	}
}