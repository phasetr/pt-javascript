const router = require("express").Router();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = new PrismaClient();

// つぶやき投稿用API
router.post("/post", async (req, res) => {
  const { content } = req.body;
  if(!content){
    return res.status(400).json({ message: "Empty post" });
  }

  try{
    const newPost = await prisma.post.create({
      data: {
        content: content,
        authorId: 1 // TODO: ログインユーザーのIDを取得する
      },
    });
    return res.status(201).json(newPost);
  } catch (err){
    console.log(err)
    return res.status(500).json({ message: "Internal server error" });
  }
})

// 最新つぶやき取得用API
/*
router.post("/login", async (req, res) => {
})
*/

module.exports = router;
