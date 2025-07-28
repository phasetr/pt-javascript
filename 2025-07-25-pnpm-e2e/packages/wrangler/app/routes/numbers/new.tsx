import { createNumber } from "@pnpm-e2e/core";
import type { Context } from "hono";
import { createRoute } from "honox/factory";
import { dbMiddleware } from "../../middleware/db";
import type { Bindings, Variables } from "../../types/bindings";

export const POST = createRoute(
	dbMiddleware,
	async (c: Context<{ Bindings: Bindings; Variables: Variables }>) => {
		try {
			const formData = await c.req.formData();
			const name = (formData.get("name") as string)?.trim();
			const numberValue = formData.get("number") as string;
			const number = Number(numberValue);

			const errors: string[] = [];
			if (!name) {
				errors.push("Name is required");
			}
			if (!numberValue || Number.isNaN(number)) {
				errors.push("Number must be a valid integer");
			}

			if (errors.length > 0) {
				return c.render(
					<NewNumberForm
						errors={errors}
						values={{ name: name || "", number: numberValue || "" }}
					/>,
				);
			}

			const db = c.get("db");
			try {
				await createNumber(db, { name, number });
				return c.redirect("/", 303);
			} catch (error) {
				if (
					error instanceof Error &&
					error.message.includes("UNIQUE constraint failed")
				) {
					errors.push("Name already exists");
					return c.render(
						<NewNumberForm
							errors={errors}
							values={{ name: name || "", number: numberValue || "" }}
						/>,
					);
				}
				throw error;
			}
		} catch (error) {
			console.error("Error creating number:", error);
			return c.render(<NewNumberForm errors={["Failed to create number"]} />);
		}
	},
);

function NewNumberForm({
	errors = [],
	values = { name: "", number: "" },
}: {
	errors?: string[];
	values?: { name: string; number: string };
}) {
	return (
		<div>
			<h2>Add New Number</h2>
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
						data-testid="name-input"
						defaultValue={values.name}
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
						data-testid="number-input"
						defaultValue={values.number}
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
						data-testid="submit-button"
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
		</div>
	);
}

export const GET = createRoute(
	dbMiddleware,
	(c: Context<{ Bindings: Bindings; Variables: Variables }>) => {
		return c.render(<NewNumberForm />);
	},
);
