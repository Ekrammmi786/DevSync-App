import AppSettings from "../models/AppSettings.js";
import { getCache, setCache } from "../lib/cache.js";

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
    // Allow admin routes + login + refresh during maintenance
    // (login/refresh needed so admin can authenticate and turn OFF maintenance)
    const isAllowedPath =
        req.path.startsWith("/api/admin") ||
        req.path === "/api/auth/login" ||
        req.path === "/api/auth/refresh";
    if (isAllowedPath) {
        return next();
    }
    try {
        const cacheKey = "admin-settings";
        let settings = getCache(cacheKey);
        if (!settings) {
            settings = await AppSettings.findOne();
            if (settings) {
                setCache(cacheKey, settings, 600);
            }
        }
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
