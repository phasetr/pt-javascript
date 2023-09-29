const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const isAuthenticated = require("../middlewares/isAuthenticated");
const prisma = new PrismaClient();

// ユーザー情報取得用API
router.get("/find", isAuthenticated, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId }
    });
    if (!user) {
      res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: "Internal server error" });
  }
})

router.get("/profile/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    // TODO: パスワードなど余計な情報を削る
    const profile = await prisma.profile.findUnique({
      where: { userId: parseInt(userId) },
      include: {
        user: {
          include: { profile: true }
        }
      }
    });
    if (!profile) {
      res.status(404).json({ message: "Profile not found" });
    }

    return res.status(200).json(profile);
  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: "Internal server error" });
  }
})

module.exports = router;
