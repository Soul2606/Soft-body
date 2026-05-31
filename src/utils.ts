
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

	static fromNum(x:number) {
		return new Vector2D(x,x)
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

	orient(a:Vector2D, b:Vector2D) {
		return a.sub(this).cross(b.sub(this))
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




/**Returns the area of a regular polygon. */
export function areaRegPoly(cornersAmount: number, edgeLen: number) {
	return cornersAmount * edgeLen ** 2 /
		(4 * Math.tan(Math.PI / cornersAmount))
}





/**Assumes each point is connected in a loop. */
export function selfIntersectionPoly(points: Vector2D[]) {
	function edgesAdjacent(
		i: number,
		j: number,
		len: number
	) {
		return (
			i === j ||
			(i + 1) % len === j ||
			(j + 1) % len === i
		)
	}

	const indexes = new Set<number>()

	const len = points.length

	for (let i = 0; i < len; i++) {
		const a1 = points[i]!
		const a2 = points[(i + 1) % len]!

		for (let j = i + 1; j < len; j++) {

			if (edgesAdjacent(i,j,len)) continue

			const b1 = points[j]!
			const b2 = points[(j + 1) % len]!

			if (segmentsIntersect(a1, a2, b1, b2)) {
				indexes.add(i)
				indexes.add(j)
			} else {
			}
		}
	}
	return indexes
}

selfIntersectionPoly([
	new Vector2D(0,0),
	new Vector2D(1,0),
	new Vector2D(0,1),
	new Vector2D(1,-1),
	new Vector2D(-1,1),
	new Vector2D(-1,-1),
])





function segmentsIntersect(
	a1: Vector2D,
	a2: Vector2D,
	b1: Vector2D,
	b2: Vector2D
) {
	const o1 = a1.orient(a2, b1)
	const o2 = a1.orient(a2, b2)

	const o3 = b1.orient(b2, a1)
	const o4 = b1.orient(b2, a2)

	return (
		(o1 > 0) !== (o2 > 0) &&
		(o3 > 0) !== (o4 > 0)
	)
}
