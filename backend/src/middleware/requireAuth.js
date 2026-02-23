import { verifyAccessToken } from "../auth/jwt.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = header.slice("Bearer ".length);
  try {
    req.user = verifyAccessToken(token); // { sub, role }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}