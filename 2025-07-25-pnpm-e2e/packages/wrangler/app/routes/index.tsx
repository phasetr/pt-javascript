import { type Database, findAllNumbers } from "@pnpm-e2e/core";
import type { Context } from "hono";
import { createRoute } from "honox/factory";
import { dbMiddleware } from "../middleware/db";

type Variables = {
	db: Database;
};

export default createRoute(
	dbMiddleware,
	async (c: Context<{ Variables: Variables }>) => {
		try {
			const db = c.get("db");
			const numbers = await findAllNumbers(db);

			return c.render(
				<div>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							alignItems: "center",
							marginBottom: "2rem",
						}}
					>
						<h2 style={{ margin: 0 }}>Numbers List</h2>
						<a
							href="/numbers/new"
							data-testid="create-new-button"
							style={{
								backgroundColor: "#4CAF50",
								color: "white",
								padding: "0.5rem 1rem",
								textDecoration: "none",
								borderRadius: "4px",
							}}
						>
							Add New
						</a>
					</div>

					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead>
							<tr style={{ borderBottom: "2px solid #ddd" }}>
								<th style={{ padding: "1rem", textAlign: "left" }}>ID</th>
								<th style={{ padding: "1rem", textAlign: "left" }}>Name</th>
								<th style={{ padding: "1rem", textAlign: "left" }}>Number</th>
								<th style={{ padding: "1rem", textAlign: "left" }}>
									Created At
								</th>
								<th style={{ padding: "1rem", textAlign: "left" }}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{numbers.map((number) => (
								<tr key={number.id} style={{ borderBottom: "1px solid #ddd" }}>
									<td style={{ padding: "1rem" }}>{number.id}</td>
									<td style={{ padding: "1rem" }}>{number.name}</td>
									<td style={{ padding: "1rem" }}>{number.number}</td>
									<td style={{ padding: "1rem" }}>
										{new Date(number.createdAt).toLocaleString()}
									</td>
									<td style={{ padding: "1rem" }}>
										<a
											href={`/numbers/${number.id}`}
											data-testid={`edit-link-${number.id}`}
											style={{ marginRight: "1rem", color: "#2196F3" }}
										>
											Edit
										</a>
										<a
											href={`/numbers/${number.id}/delete`}
											data-testid={`delete-link-${number.id}`}
											style={{ color: "#f44336" }}
										>
											Delete
										</a>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>,
			);
		} catch (error) {
			console.error("Error in index route:", error);
			throw error;
		}
	},
);
