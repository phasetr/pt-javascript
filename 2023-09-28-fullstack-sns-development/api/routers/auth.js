const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const generateIdenticon = require("../utils/generateIdenticon");
const prisma = new PrismaClient();

// 新規ユーザー登録API
router.post("/register", async (req, res) => {
  try{
    const { username, email, password } = req.body;
    const defaultIconImage = generateIdenticon(email);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        profile: {
          create: {
            bio: "Hello!",
            profileImageUrl: defaultIconImage
          }
        }
      },
      include: {
        profile: true
      }
    });
    return res.json(user);
  } catch (err){
    console.log(err)
    // TODO: エラーの型を切って適切な返り値を設定する
    return res.json(err);
  }
})

// ログインAPI
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = jwt.sign({ id: user.id }, process.env.SECRET_KEY, { expiresIn: "1d" });
  return res.json({ token });
})

module.exports = router;
