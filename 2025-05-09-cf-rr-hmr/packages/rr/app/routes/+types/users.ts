import type { LoaderFunctionArgs, MetaFunction } from "react-router";

export interface User {
	id: number;
	name: string;
	email: string;
	created_at: string;
}

export namespace Route {
	export type LoaderArgs = LoaderFunctionArgs;
	export type MetaFn = MetaFunction;

	export interface LoaderData {
		users: User[];
	}

	export interface ComponentProps {
		loaderData: LoaderData;
	}
}
