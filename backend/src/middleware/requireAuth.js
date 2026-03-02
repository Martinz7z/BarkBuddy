import { verifyAccessToken } from "../auth/jwt.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");

  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }

  try {
    const payload = verifyAccessToken(token);

    // JWT convention: user id is in "sub"
    req.user = {
      id: payload.sub,
      role: payload.role,
    };

    return next();
  } catch (e) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}