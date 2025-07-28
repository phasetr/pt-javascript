import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { setupDatabase, getDatabase } from "./src/db/setup.js";
import {
	findAllNumbers,
	createNumber,
	updateNumber,
	deleteNumber,
} from "@pnpm-e2e/core";

const app = new Hono();

let isInitialized = false;

// Database middleware
app.use("*", async (c, next) => {
	if (!isInitialized) {
		await setupDatabase();
		isInitialized = true;
	}

	const db = getDatabase();
	c.set("db", db);
	await next();
});

// Routes
app.get("/", async (c) => {
	try {
		const db = c.get("db");
		const numbers = await findAllNumbers(db);

		console.log("Numbers from findAllNumbers:", numbers);
		console.log("Numbers type:", typeof numbers);
		console.log("Numbers isArray:", Array.isArray(numbers));

		const safeNumbers = Array.isArray(numbers) ? numbers : [];

		const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Numbers List</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 2rem; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #ddd; }
            th { border-bottom: 2px solid #ddd; }
            .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
            .btn { background-color: #4CAF50; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 4px; }
            .edit-link { color: #2196F3; margin-right: 1rem; }
            .delete-link { color: #f44336; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Numbers List</h2>
            <a href="/numbers/new" data-testid="create-new-button" class="btn">Add New</a>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Number</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${
								safeNumbers.length > 0
									? safeNumbers
											.map(
												(number) => `
                  <tr>
                    <td>${number.id}</td>
                    <td>${number.name}</td>
                    <td>${number.number}</td>
                    <td>${new Date(number.createdAt).toLocaleString()}</td>
                    <td>
                      <a href="/numbers/${number.id}" data-testid="edit-link-${number.id}" class="edit-link">Edit</a>
                      <a href="/numbers/${number.id}/delete" data-testid="delete-link-${number.id}" class="delete-link">Delete</a>
                    </td>
                  </tr>
                `,
											)
											.join("")
									: '<tr><td colspan="5">No data available or invalid data format</td></tr>'
							}
            </tbody>
          </table>
        </body>
      </html>
    `;

		return c.html(html);
	} catch (error) {
		console.error("Error in index route:", error);
		return c.text(`Error: ${error.message}`, 500);
	}
});

// Simple form for testing
app.get("/numbers/new", (c) => {
	const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Add New Number</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 2rem; }
          .form-group { margin-bottom: 1rem; }
          label { display: block; margin-bottom: 0.5rem; }
          input { padding: 0.5rem; width: 300px; }
          button { background-color: #4CAF50; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h2>Add New Number</h2>
        <form method="POST" action="/numbers">
          <div class="form-group">
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" data-testid="name-input" required>
          </div>
          <div class="form-group">
            <label for="number">Number:</label>
            <input type="number" id="number" name="number" data-testid="number-input" required>
          </div>
          <button type="submit" data-testid="submit-button">Add Number</button>
          <a href="/" style="margin-left: 1rem;">Cancel</a>
        </form>
      </body>
    </html>
  `;
	return c.html(html);
});

// Create number
app.post("/numbers", async (c) => {
	try {
		const db = c.get("db");
		const formData = await c.req.formData();
		const name = formData.get("name");
		const number = formData.get("number");

		if (!name || !number) {
			return c.text("Name and number are required", 400);
		}

		const result = await createNumber(
			{ name: name.toString(), number: parseInt(number.toString()) },
			db,
		);
		if (result.success) {
			return c.redirect("/");
		} else {
			return c.text(`Error: ${result.error.message}`, 500);
		}
	} catch (error) {
		console.error("Error creating number:", error);
		return c.text(`Error: ${error.message}`, 500);
	}
});

const port = process.env.PORT || 3000;

serve(
	{
		fetch: app.fetch,
		port: port,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
