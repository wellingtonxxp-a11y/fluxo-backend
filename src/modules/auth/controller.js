import { user as _user } from "../../config/prisma";
import { hash, compare } from "bcrypt";
import { sign } from "jsonwebtoken";

async function register(req, res) {
  const { name, email, password } = req.body;

  try {
    const hashed = await hash(password, 10);

    const user = await _user.create({
      data: { name, email, password: hashed }
    });

    const token = sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });

  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    res.status(500).json({ error: "Erro register" });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  try {
    const user = await _user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: "Usuário não encontrado" });
    }

    const valid = await compare(password, user.password);

    if (!valid) {
      return res.status(400).json({ error: "Senha inválida" });
    }

    const token = sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user });

  } catch {
    res.status(500).json({ error: "Erro login" });
  }
}

export default { register, login };