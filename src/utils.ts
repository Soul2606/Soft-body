
export function GET<T extends HTMLElement = HTMLElement>(id:string) {
	const el = document.getElementById(id)
	if (!el) throw new Error("Element does not exist");
	return el as T
}




export class Vector2D {

	static from(vec:Vector2D){
		return new Vector2D(vec.x, vec.y)
	}

	x: number
	y: number
	constructor(x:number, y:number){
		this.x = x
		this.y = y
	}

	distanceTo(vec:Vector2D){
		return Math.sqrt((vec.x - this.x)**2 + (vec.y - this.y)**2)
	}
};
