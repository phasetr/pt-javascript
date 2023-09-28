import express from "express";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const app = express();
const PORT = 8000;
const prisma = new PrismaClient();

app.use(express.json());

app.get("/", (req, res) => {
  console.log("Hello World!");
  res.send("<h1>Hello World!</h1>");
});

// 新規ユーザー登録API
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { username, email, password: hashedPassword } });
  return res.json(user);
})

// ログインAPI
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid password" });
  }
})

app.listen(PORT, () => console.log(`server is running on port ${PORT}`))
