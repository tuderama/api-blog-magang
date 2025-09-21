import jwt from "jsonwebtoken";

export const authorize = (req, res, next) => {
    try {
        const accessToken = req.cookies?.accessToken;
        if (!accessToken) return res.status(401).json({status: "error", code: 401, message: 'Unauthorized'});
        const payload = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET)
        req.user = {id: payload.sub};
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') return res.status(401).json({
            status: "error",
            code: 401,
            message: "Expired token"
        });
        return res.status(401).json({status: "error", code: 401, message: "Invalid token"});
    }
}