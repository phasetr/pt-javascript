import type { LoaderFunctionArgs, MetaFunction } from "react-router";

export interface Product {
	id: number;
	name: string;
	price: number;
	description: string;
	created_at: string;
}

export namespace Route {
	export type LoaderArgs = LoaderFunctionArgs;
	export type MetaFn = MetaFunction;

	export interface LoaderData {
		products: Product[];
	}

	export interface ComponentProps {
		loaderData: LoaderData;
	}
}
