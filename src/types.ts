import type { Vector2D } from "./utils.js";


export type Connection = { a: number; b: number; };


export type Node = {
	pos: Vector2D;
	vel: Vector2D;
};


export type Spring = {
	length: number;
	stiffness: number;
	dampening: number;
	connection: Connection;
};

