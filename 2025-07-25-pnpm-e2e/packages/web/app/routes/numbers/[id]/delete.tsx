import { deleteNumber, findNumberById } from "@pnpm-e2e/core";
import type { Context } from "hono";
import { createRoute } from "honox/factory";
import { dbMiddleware } from "../../../middleware/db";
import type { Bindings, Variables } from "../../../types/bindings";

export const GET = createRoute(
	dbMiddleware,
	async (c: Context<{ Bindings: Bindings; Variables: Variables }>) => {
		try {
			const id = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(id)) {
				return c.text("Invalid ID", 400);
			}

			const db = c.get("db");
			const number = await findNumberById(db, id);

			return c.render(<DeleteNumberConfirm number={number} />);
		} catch (error) {
			console.error("Error fetching number:", error);
			return c.text("Number not found", 404);
		}
	},
);

export const POST = createRoute(
	dbMiddleware,
	async (c: Context<{ Bindings: Bindings; Variables: Variables }>) => {
		try {
			const id = Number.parseInt(c.req.param("id"));
			if (Number.isNaN(id)) {
				return c.text("Invalid ID", 400);
			}

			const db = c.get("db");
			const success = await deleteNumber(db, id);

			if (!success) {
				return c.text("Number not found", 404);
			}

			return c.redirect("/", 303);
		} catch (error) {
			console.error("Error deleting number:", error);
			return c.text("Failed to delete number", 500);
		}
	},
);

function DeleteNumberConfirm({
	number,
}: {
	number: { id: number; name: string; number: number };
}) {
	return (
		<div>
			<h2>Delete Number</h2>
			<div
				style={{
					backgroundColor: "#fff3cd",
					color: "#856404",
					padding: "1rem",
					borderRadius: "4px",
					marginBottom: "2rem",
				}}
			>
				<p style={{ margin: 0 }}>
					Are you sure you want to delete this number?
				</p>
			</div>
			<div
				style={{
					backgroundColor: "#f8f9fa",
					padding: "1.5rem",
					borderRadius: "4px",
					marginBottom: "2rem",
				}}
			>
				<dl style={{ margin: 0 }}>
					<dt style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>ID:</dt>
					<dd style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
						{number.id}
					</dd>
					<dt style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>Name:</dt>
					<dd style={{ marginLeft: "2rem", marginBottom: "1rem" }}>
						{number.name}
					</dd>
					<dt style={{ fontWeight: "bold", marginBottom: "0.5rem" }}>
						Number:
					</dt>
					<dd style={{ marginLeft: "2rem", marginBottom: "0" }}>
						{number.number}
					</dd>
				</dl>
			</div>
			<div style={{ display: "flex", gap: "1rem" }}>
				<form method="post" style={{ margin: 0 }}>
					<button
						type="submit"
						style={{
							backgroundColor: "#dc3545",
							color: "white",
							padding: "0.5rem 1rem",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
						}}
					>
						Delete
					</button>
				</form>
				<a
					href="/"
					style={{
						backgroundColor: "#6c757d",
						color: "white",
						padding: "0.5rem 1rem",
						textDecoration: "none",
						borderRadius: "4px",
					}}
				>
					Cancel
				</a>
			</div>
		</div>
	);
}
