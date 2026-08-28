export class Vector2D {

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

	static toKey(vec:Vector2D) {
		return vec.x + ":" + vec.y
	}

	static fromKey(str:string) {
		const arr = str.split(":")
		if (arr.length !== 2) return
		const [x, y] = arr.map(Number)
		if (x === undefined) return
		if (y === undefined) return
		if (!Number.isFinite(x)) return
		if (!Number.isFinite(y)) return
		return new Vector2D(x, y)
	}

	// ======================= Properties =======================

	x: number
	y: number
	constructor(x:number = 0, y?:number){
		this.x = x
		if (y === undefined) {
			this.y = x
		} else {
			this.y = y
		}	
	}

	get length(): number {
		return Math.sqrt(this.x * this.x + this.y * this.y);
	}

	add(value: Vector2D) {
		this.x += value.x,
		this.y += value.y
		return this
	}

	subtract(value: Vector2D) {
		this.x -= value.x,
		this.y -= value.y
		return this
	}

	multiply(value: Vector2D) {
		this.x *= value.x
		this.y *= value.y
		return this
	}

	divide(value: number|Vector2D) {
		if (value instanceof Vector2D) {
			this.x /= value.x
			this.y /= value.y
			return this
		}
		this.x /= value
		this.y /= value
		return this
	}

	scale(value:number){
		this.x *= value
		this.y *= value
		return this
	}

	normalized() {
		const len = this.length;
		return len === 0 ? new Vector2D() : Vector2D.from(this).scale(1 / len);
	}

	normalize() {
		const len = this.length;
		len === 0 ? this.scale(0) : this.scale(1 / len);
		return this
	}

	distanceTo(vec:Vector2D){
		return Math.sqrt((vec.x - this.x)**2 + (vec.y - this.y)**2)
	}

	/**
	 * The result is:
	 * - Positive if v is clockwise from u.
	 * - Negative if v is counterclockwise from u.
	 * - Zero if they are parallel.
	 * 
	 * Example:
	 * 
	 * u = (1,0) right
	 * v = (0,1) down
	 * 
	 * Positive ⇒ turning clockwise from u to v.
	 * 
	 * u = (1,0) right
	 * v = (0,-1) up
	 * 
	 * Negative ⇒ turning counterclockwise.
	 */
	cross(vec:Vector2D){
		return this.x * vec.y - this.y * vec.x
	}

	/**
	 * p.orient(a, b)
	 *
	 * Returns the orientation of point p relative to
	 * the directed line a → b.
	 *
	 * > If I stand at a and look toward b,
	 * > is p to the left or right?
	 *
	 * Positive  => p is on one side.
	 * 
	 * Negative  => p is on the other side.
	 * 
	 * Zero      => p lies on the line.
	 */
	orient(a:Vector2D, b:Vector2D) {
		return Vector2D.from(a).subtract(b).cross(Vector2D.from(this).subtract(b))
	}

	/**
	 * Positive angles rotate clockwise.
	 */
	rotate(deg:number) {
		const rad = deg / 180 * Math.PI
		const cos = Math.cos(rad)
		const sin = Math.sin(rad)
		
		const nx = this.x * cos - this.y * sin
		this.y = this.x * sin + this.y * cos
		this.x = nx
		
		return this
	}

	/**
	 * Returns a rotated copy of this vector.
	 *
	 * Positive angles rotate clockwise.
	 */
	rotated(deg:number) {
		return Vector2D.from(this).rotate(deg)
	}
};