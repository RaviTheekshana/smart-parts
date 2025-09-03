import jwt from "jsonwebtoken";

export function auth(required = true) {
  return (req, res, next) => {
    const hdr = req.headers.authorization || "";
    const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
    if (!token) {
      if (required) return res.status(401).json({ msg: "No token" });
      return next();
    }
    try {
      const data = jwt.verify(token, process.env.JWT_SECRET || "devsecret");
      req.user = data;
      return next();
    } catch (e) {
      return res.status(401).json({ msg: "Invalid token" });
    }
  };
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ msg: "Forbidden" });
    }
    next();
  };
}
