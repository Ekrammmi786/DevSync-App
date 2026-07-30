import AppSettings from "../models/AppSettings.js";

export const adminOnly = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({
            success: false,
            message: "access denied, admin only.",
            code: "ADMIN_ONLY"
        });
    }
    next();
};

export const maintenanceCheck = async (req, res, next) => {
    if (req.path.startsWith("/api/admin")) {
        return next();
    }
    try {
        const settings = await AppSettings.findOne();
        if (settings && settings.maintenanceMode) {
            if (req.user && req.user.isAdmin) {
                return next();
            }
            return res.status(503).json({
                success: false,
                message: settings.maintenanceMessage || "server is under maintenance"
            });
        }
        next();
    } catch (error) {
        next();
    }
};
