const jwt = require("jsonwebtoken");

export default function auth(req: any, res: any, next: any) {
  const header = req.headers["authorization"];

  if (!header) {
    return res.status(401).json({ success: false, error: "Token ausente" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "changeme");
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Token inválido" });
  }
}
