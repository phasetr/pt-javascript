import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const app = express();
const PORT = 8000;

const prisma = new PrismaClient();
app.get("/", (req, res) => {
  console.log("Hello World!");
  res.send("<h1>Hello World!</h1>");
});

app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { username, email, password: hashedPassword } });
  return res.json(user);
})
app.listen(PORT, () => console.log(`server is running on port ${PORT}`))
