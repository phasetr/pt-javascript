import type { Context } from "hono";
import { createRoute } from "honox/factory";
import { dbMiddleware } from "../../middleware/db";
import type { Bindings } from "../../types/bindings";

export const GET = createRoute(
	dbMiddleware,
	(c: Context<{ Bindings: Bindings }>) => {
		return c.render(
			<div>
				<h2>Add New Number</h2>
				<form method="post">
					<div style={{ marginBottom: "1rem" }}>
						<label
							htmlFor="name"
							style={{ display: "block", marginBottom: "0.5rem" }}
						>
							Name:
						</label>
						<input
							type="text"
							id="name"
							name="name"
							required
							style={{
								padding: "0.5rem",
								width: "100%",
								maxWidth: "300px",
								border: "1px solid #ddd",
								borderRadius: "4px",
							}}
						/>
					</div>
					<div style={{ marginBottom: "1rem" }}>
						<label
							htmlFor="number"
							style={{ display: "block", marginBottom: "0.5rem" }}
						>
							Number:
						</label>
						<input
							type="number"
							id="number"
							name="number"
							required
							style={{
								padding: "0.5rem",
								width: "100%",
								maxWidth: "300px",
								border: "1px solid #ddd",
								borderRadius: "4px",
							}}
						/>
					</div>
					<div style={{ display: "flex", gap: "1rem" }}>
						<button
							type="submit"
							style={{
								backgroundColor: "#4CAF50",
								color: "white",
								padding: "0.5rem 1rem",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
							}}
						>
							Create
						</button>
						<a
							href="/"
							style={{
								backgroundColor: "#f44336",
								color: "white",
								padding: "0.5rem 1rem",
								textDecoration: "none",
								borderRadius: "4px",
							}}
						>
							Cancel
						</a>
					</div>
				</form>
			</div>,
		);
	},
);
