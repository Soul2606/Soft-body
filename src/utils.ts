
export function GET<T extends HTMLElement = HTMLElement>(id:string) {
	const el = document.getElementById(id)
	if (!el) throw new Error("Element does not exist");
	return el as T
}




export const relu = (val:number) => Math.max(0, val)




export class Vector2D {

	/** Returns the outward normal of the center vertex based on the two surrounding vertices. */
	static normal(center: Vector2D, right: Vector2D, left: Vector2D): Vector2D {
		const toRight = right.sub(center).normalized()
		const toLeft = left.sub(center).normalized()

		const tangent = toRight.add(toLeft).normalized()

		return new Vector2D(-tangent.y, tangent.x)
	}

	static average(points: Vector2D[]) {
		let x = 0
		let y = 0

		for (const p of points) {
			x += p.x
			y += p.y
		}

		return new Vector2D(
			x / points.length,
			y / points.length
		)
	}

	static from(vec:Vector2D){
		return new Vector2D(vec.x, vec.y)
	}

	x: number
	y: number
	constructor(x:number = 0, y:number = 0){
		this.x = x
		this.y = y
	}

	get length(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	add(other: Vector2D): Vector2D {
		return new Vector2D(
			this.x + other.x,
			this.y + other.y
		)
	}

	sub(other: Vector2D): Vector2D {
		return new Vector2D(
			this.x - other.x,
			this.y - other.y
		)
	}

	multiply(scalar: number|Vector2D): Vector2D {
		if (scalar instanceof Vector2D) {
			return new Vector2D(this.x * scalar.x, this.y * scalar.y);
		}
		return new Vector2D(this.x * scalar, this.y * scalar);
	}

	normalized(): Vector2D {
		const len = this.length;
		return len === 0 ? new Vector2D() : this.multiply(1 / len);
	}

	distanceTo(vec:Vector2D){
		return Math.sqrt((vec.x - this.x)**2 + (vec.y - this.y)**2)
	}

	cross(vec:Vector2D){
		return this.x * vec.y - this.y * vec.x
	}
};




export function distanceToLine(
	pos: Vector2D,
	line: { pos1: Vector2D; pos2: Vector2D }
) {
	const { pos1, pos2 } = line
	const a = pos1.y - pos2.y
	const b = pos2.x - pos1.x
	const c = pos1.x * pos2.y - pos2.x * pos1.y
	return Math.abs(a * pos.x + b * pos.y + c) / Math.sqrt(a * a + b * b)
}




/** Returns the area inside the polygon from the points assuming they form a closed loop */
export function area(points: Vector2D[]): number {
	if (points.length < 3) return 0

	let sum = 0

	for (let i = 0; i < points.length; i++) {
		const a = points[i]!
		const b = points[(i + 1) % points.length]!

		sum += a.x * b.y - b.x * a.y
	}

	return Math.abs(sum) * 0.5
}
