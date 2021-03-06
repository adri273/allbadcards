declare module "deep-extend"
{
	/** Recursive object extending. */
	declare function deepExtend<T, U>(target: T, source: U): T & U;
	declare function deepExtend<T, U, V>(target: T, source1: U, source2: V): T & U & V;
	declare function deepExtend<T, U, V, W>(target: T, source1: U, source2: V, source3: W): T & U & V & W;
	declare function deepExtend(target: any, ...sources: any[]): any;
	declare namespace deepExtend {}
	export = deepExtend;
}