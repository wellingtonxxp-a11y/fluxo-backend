"use strict";
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../../../prisma"); // ⚠️ caminho baseado no seu ajuste
const router = express.Router();
/* =========================
   REGISTER
========================= */
router.post("/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ error: "Email e senha obrigatórios" });
        }
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });
        if (existingUser) {
            return res.status(400).json({ error: "Email já cadastrado" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                name: name || "User",
                email,
                password: hashedPassword
            }
        });
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (err) {
        console.error("REGISTER ERROR:", err);
        return res.status(500).json({ error: "Erro ao registrar" });
    }
});
/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ error: "Email e senha obrigatórios" });
        }
        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) {
            return res.status(400).json({ error: "Usuário não encontrado" });
        }
        if (!user.isActive) {
            return res.status(403).json({ error: "Usuário desativado" });
        }
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(400).json({ error: "Senha inválida" });
        }
        // 🔥 Atualiza último login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        });
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        return res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });
    }
    catch (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ error: "Erro login" });
    }
});
module.exports = router;
//# sourceMappingURL=routes.js.map