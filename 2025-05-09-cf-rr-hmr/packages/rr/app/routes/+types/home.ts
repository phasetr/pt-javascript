import type { LoaderFunctionArgs, MetaFunction } from "react-router";

export namespace Route {
	export type LoaderArgs = LoaderFunctionArgs;
	export type MetaFn = MetaFunction;

	export interface LoaderData {
		message: string;
	}

	export interface ComponentProps {
		loaderData: LoaderData;
	}
}
