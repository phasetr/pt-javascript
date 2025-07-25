import type { Database } from "@pnpm-e2e/core";
import { createNumber } from "@pnpm-e2e/core";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

type Variables = {
	db: Database;
};

export default createRoute(async (c: Context<{ Variables: Variables }>) => {
	if (c.req.method === "POST") {
		const formData = await c.req.formData();
		const name = formData.get("name") as string;
		const number = formData.get("number") as string;

		if (name && number) {
			// const db = c.get("db");
			// await createNumber(db, {
			// 	name,
			// 	number: parseInt(number, 10),
			// });
			return c.redirect("/");
		}
	}

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
});
