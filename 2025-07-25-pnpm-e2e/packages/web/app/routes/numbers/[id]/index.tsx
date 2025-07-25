import { findNumberById, updateNumber } from "@pnpm-e2e/core";
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

			return c.render(<EditNumberForm id={id} existingValues={number} />);
		} catch (error) {
			console.error("Error fetching number:", error);
			return c.text("Number not found", 404);
		}
	},
);

export const POST = createRoute(
	dbMiddleware,
	async (c: Context<{ Bindings: Bindings; Variables: Variables }>) => {
		const id = Number.parseInt(c.req.param("id"));
		if (Number.isNaN(id)) {
			return c.text("Invalid ID", 400);
		}

		const formData = await c.req.formData();
		const name = (formData.get("name") as string)?.trim();
		const numberValue = formData.get("number") as string;
		const number = Number(numberValue);

		try {
			const errors: string[] = [];
			if (!name) {
				errors.push("Name is required");
			}
			if (!numberValue || Number.isNaN(number)) {
				errors.push("Number must be a valid integer");
			}

			if (errors.length > 0) {
				const db = c.get("db");
				const existingNumber = await findNumberById(db, id);
				return c.render(
					<EditNumberForm
						id={id}
						errors={errors}
						values={{ name: name || "", number: numberValue || "" }}
						existingValues={existingNumber}
					/>,
				);
			}

			const db = c.get("db");
			try {
				await updateNumber(db, id, { name, number });
				return c.redirect("/", 303);
			} catch (error) {
				if (
					error instanceof Error &&
					error.message.includes("UNIQUE constraint failed")
				) {
					errors.push("Name already exists");
					const existingNumber = await findNumberById(db, id);
					return c.render(
						<EditNumberForm
							id={id}
							errors={errors}
							values={{ name: name || "", number: numberValue || "" }}
							existingValues={existingNumber}
						/>,
					);
				}
				throw error;
			}
		} catch (error) {
			console.error("Error updating number:", error);
			const id = Number.parseInt(c.req.param("id"));
			return c.render(
				<EditNumberForm
					id={id}
					errors={["Failed to update number"]}
					existingValues={{ name, number }}
				/>,
			);
		}
	},
);

function EditNumberForm({
	id: _id,
	errors = [],
	values,
	existingValues,
}: {
	id: number;
	errors?: string[];
	values?: { name: string; number: string };
	existingValues?: { name: string; number: number };
}) {
	const displayValues = values || {
		name: existingValues?.name || "",
		number: existingValues?.number?.toString() || "",
	};

	return (
		<div>
			<h2>Edit Number</h2>
			{errors.length > 0 && (
				<div
					style={{
						backgroundColor: "#f8d7da",
						color: "#721c24",
						padding: "1rem",
						borderRadius: "4px",
						marginBottom: "1rem",
					}}
				>
					<ul style={{ margin: 0, paddingLeft: "1.5rem" }}>
						{errors.map((error) => (
							<li key={error}>{error}</li>
						))}
					</ul>
				</div>
			)}
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
						value={displayValues.name}
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
						value={displayValues.number}
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
						Update
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
		</div>
	);
}
