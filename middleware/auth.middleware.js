import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "skillhub_fallback_secret";

/**
 * Authentication Middleware
 * Verifies the JWT from the Authorization header
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ ok: false, error: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user info (id, role, studentId) to the request
    next();
  } catch (err) {
    res.status(401).json({ ok: false, error: "Invalid or expired token." });
  }
}

/**
 * Role Authorization Middleware
 * Only allows specific roles to access the route
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: "Access forbidden. Insufficient permissions." });
    }
    next();
  };
}
