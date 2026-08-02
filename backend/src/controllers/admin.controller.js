import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import AppSettings from "../models/AppSettings.js";
import AsyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/Apierror.js";
import {
    getCache,
    setCache,
    delCache,
    delCacheByPattern,
    flushCache,
} from "../lib/cache.js";
import "dotenv/config";


export const seedAdmin = AsyncHandler(async (req, res) => {
    const { email, secretKey } = req.body;
    if (secretKey !== process.env.ADMIN_SECRET_KEY) {
        throw new ApiError(403, "Invalid secret key", "INVALID_SECRET_KEY");
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    }
    if (user.isAdmin) {
        throw new ApiError(400, "user is already admin", "ALREADY_ADMIN");
    }
    user.isAdmin = true;
    await user.save();
    const existingSettings = await AppSettings.findOne();
    if (!existingSettings) {
        await AppSettings.create({});
    }
    delCache("admin-dashboard");
    delCacheByPattern("admin-users-");
    res.json({
        success: true,
        data: { message: `${user.fullname} is now admin` },
    });
});

export const getDashboard = AsyncHandler(async (req, res) => {
    const cacheKey = "admin-dashboard";
    const cached = getCache(cacheKey);
    if (cached) {
        return res.json({ success: true, data: cached, source: "cache" });
    }
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const onboardedUsers = await User.countDocuments({ isOnBoarded: true });
    const adminCount = await User.countDocuments({ isAdmin: true });
    const totalFriendRequests = await FriendRequest.countDocuments();
    const pendingRequests = await FriendRequest.countDocuments({
        status: "pending",
    });
    const acceptedRequests = await FriendRequest.countDocuments({
        status: "accepted",
    });
    const rejectedRequests = await FriendRequest.countDocuments({
        status: "rejected",
    });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayUsers = await User.countDocuments({
        createdAt: { $gte: todayStart },
    });
    const data = {
        users: {
            total: totalUsers,
            verified: verifiedUsers,
            onboarded: onboardedUsers,
            admins: adminCount,
            today: todayUsers,
        },
        friendRequests: {
            total: totalFriendRequests,
            pending: pendingRequests,
            accepted: acceptedRequests,
            rejected: rejectedRequests,
        },
    };
    setCache(cacheKey, data, 300);
    res.json({ success: true, data, source: "database" });
});

export const getUsers = AsyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const { search = "", isAdmin, isVerified, isOnBoarded } = req.query;
    const cacheKey = `admin-users-${search}-${isAdmin || "all"}-${isVerified || "all"}-${isOnBoarded || "all"}-${limit}-${skip}`;
    const cached = getCache(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: cached.data,
            pagination: cached.pagination,
            source: "cache",
        });
    }
    const filter = {};
    if (search) {
        filter.$or = [
            { fullname: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
        ];
    }
    if (isAdmin !== undefined) filter.isAdmin = isAdmin === "true";
    if (isVerified !== undefined) filter.isVerified = isVerified === "true";
    if (isOnBoarded !== undefined) filter.isOnBoarded = isOnBoarded === "true";
    const users = await User.find(filter)
        .skip(skip)
        .limit(limit)
        .select(
            "-password -refreshToken -otpHash -otpExpiry -otpAttempts -otpResendCount -otpResendWindowStart",
        )
        .sort({ createdAt: -1 });
    const total = await User.countDocuments(filter);
    const responseData = {
        data: users,
        pagination: {
            page: Math.floor(skip / limit) + 1,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + limit < total,
        },
    };
    setCache(cacheKey, responseData, 60);
    res.json({ success: true, ...responseData, source: "database" });
});

export const getUserById = AsyncHandler(async (req, res) => {
    const cacheKey = `admin-user-${req.params.id}`;
    const cached = getCache(cacheKey);
    if (cached) {
        return res.json({ success: true, data: cached, source: "cache" });
    }
    const user = await User.findById(req.params.id)
        .select(
            "-password -refreshToken -otpHash -otpExpiry -otpAttempts -otpResendCount -otpResendWindowStart",
        )
        .populate(
            "friends",
            "fullname email profilePic techStack interests lookingFor availability timezone githubUsername linkedinUsername portfolioUrl"
        );
    if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    setCache(cacheKey, user, 60);
    res.json({ success: true, data: user, source: "database" });
});

export const createUser = AsyncHandler(async (req, res) => {
    const {
        fullname,
        email,
        password,
        role,
        codinglanguage,
        learninglanguage,
        location,
        bio,
        techStack,
        interests,
        lookingFor,
        availability,
        timezone,
        githubUsername,
        linkedinUsername,
        portfolioUrl,
        experience,
        isAdmin: makeAdmin,
        isVerified: markVerified,
    } = req.body;
    if (!fullname || !email || !password) {
        throw new ApiError(
            400,
            "Fullname, email and password are required",
            "FIELDS_REQUIRED",
        );
    }
    const existingUser = await User.findOne({ email });
    if (existingUser)
        throw new ApiError(400, "User already exists", "USER_EXISTS");
    const user = await User.create({
        fullname,
        email,
        password,
        role: role || "",
        codinglanguage: codinglanguage || [],
        learninglanguage: learninglanguage || [],
        location: location || "",
        bio: bio || "",
        techStack: techStack || [],
        interests: interests || [],
        lookingFor: lookingFor || "learning Buddy",
        availability: availability || "Occasional",
        timezone: timezone || "",
        githubUsername: githubUsername || "",
        linkedinUsername: linkedinUsername || "",
        portfolioUrl: portfolioUrl || "",
        experience: experience || "",
        isAdmin: makeAdmin || false,
        isVerified: markVerified || false,
        isOnBoarded: true,
    });
    delCache("admin-dashboard");
    delCacheByPattern("admin-users-");
    res.status(201).json({ success: true, data: user });
});

export const updateUser = AsyncHandler(async (req, res) => {
    const {
        fullname,
        email,
        role,
        codinglanguage,
        learninglanguage,
        location,
        bio,
        techStack,
        interests,
        lookingFor,
        availability,
        timezone,
        githubUsername,
        linkedinUsername,
        portfolioUrl,
        experience,
        isOnBoarded,
        isVerified,
    } = req.body;
    const updateData = {};
    if (fullname !== undefined) updateData.fullname = fullname;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (codinglanguage !== undefined) updateData.codinglanguage = codinglanguage;
    if (learninglanguage !== undefined)
        updateData.learninglanguage = learninglanguage;
    if (location !== undefined) updateData.location = location;
    if (bio !== undefined) updateData.bio = bio;
    if (techStack !== undefined) updateData.techStack = techStack;
    if (interests !== undefined) updateData.interests = interests;
    if (lookingFor !== undefined) updateData.lookingFor = lookingFor;
    if (availability !== undefined) updateData.availability = availability;
    if (timezone !== undefined) updateData.timezone = timezone;
    if (githubUsername !== undefined) updateData.githubUsername = githubUsername;
    if (linkedinUsername !== undefined)
        updateData.linkedinUsername = linkedinUsername;
    if (portfolioUrl !== undefined) updateData.portfolioUrl = portfolioUrl;
    if (experience !== undefined) updateData.experience = experience;
    if (isOnBoarded !== undefined) updateData.isOnBoarded = isOnBoarded;
    if (isVerified !== undefined) updateData.isVerified = isVerified;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
    }).select(
        "-password -refreshToken -otpHash -otpExpiry -otpAttempts -otpResendCount -otpResendWindowStart",
    );
    if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    delCache(`admin-user-${req.params.id}`);
    delCache("admin-dashboard");
    delCacheByPattern("admin-users-");
    res.json({ success: true, data: user });
});

export const deleteUser = AsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    await User.updateMany(
        { friends: user._id },
        { $pull: { friends: user._id } },
    );
    await FriendRequest.deleteMany({
        $or: [{ sender: user._id }, { recipient: user._id }],
    });
    await User.findByIdAndDelete(user._id);
    delCache(`admin-user-${user._id}`);
    delCache("admin-dashboard");
    delCacheByPattern("admin-users-");
    res.json({ success: true, data: { message: "User deleted successfully" } });
});

export const toggleAdmin = AsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw new ApiError(404, "User not found", "USER_NOT_FOUND");
    if (user._id.toString() === req.user._id.toString() && user.isAdmin) {
        throw new ApiError(
            400,
            "Cannot remove admin role from yourself",
            "SELF_ADMIN_REMOVE",
        );
    }
    user.isAdmin = !user.isAdmin;
    await user.save();
    delCache(`admin-user-${user._id}`);
    delCache("admin-dashboard");
    delCacheByPattern("admin-users-");
    res.json({
        success: true,
        data: {
            message: `admin role ${user.isAdmin ? "granted" : "removed"}`,
            isAdmin: user.isAdmin,
        },
    });
});

export const getFriendRequests = AsyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const skip = parseInt(req.query.skip) || 0;
    const { status, sender, recipient } = req.query;
    const cacheKey = `admin-friend-requests-${status || "all"}-${sender || "all"}-${recipient || "all"}-${limit}-${skip}`;
    const cached = getCache(cacheKey);
    if (cached) {
        return res.json({
            success: true,
            data: cached.data,
            pagination: cached.pagination,
            source: "cache",
        });
    }
    const filter = {};
    if (status) filter.status = status;
    if (sender) filter.sender = sender;
    if (recipient) filter.recipient = recipient;
    const requests = await FriendRequest.find(filter)
        .skip(skip)
        .limit(limit)
        .populate("sender", "fullname email profilePic")
        .populate("recipient", "fullname email profilePic")
        .sort({ createdAt: -1 });
    const total = await FriendRequest.countDocuments(filter);
    const responseData = {
        data: requests,
        pagination: {
            page: Math.floor(skip / limit) + 1,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasMore: skip + limit < total,
        },
    };
    setCache(cacheKey, responseData, 60);
    res.json({ success: true, ...responseData, source: "database" });
});

export const getSettings = AsyncHandler(async (req, res) => {
    const cacheKey = "admin-settings";
    const cached = getCache(cacheKey);
    if (cached) {
        return res.json({ success: true, data: cached, source: "cache" });
    }
    let settings = await AppSettings.findOne();
    if (!settings) {
        settings = await AppSettings.create({});
    }
    setCache(cacheKey, settings, 600);
    res.json({ success: true, data: settings, source: "database" });
});

export const updateSettings = AsyncHandler(async (req, res) => {
    const {
        maintenanceMode,
        maintenanceMessage,
        appVersion,
        appName,
        announcement,
    } = req.body;
    const updateData = {};
    if (maintenanceMode !== undefined)
        updateData.maintenanceMode = maintenanceMode;
    if (maintenanceMessage !== undefined)
        updateData.maintenanceMessage = maintenanceMessage;
    if (appVersion !== undefined) updateData.appVersion = appVersion;
    if (appName !== undefined) updateData.appName = appName;
    if (announcement !== undefined) updateData.announcement = announcement;
    let settings = await AppSettings.findOne();
    if (!settings) {
        settings = await AppSettings.create(updateData);
    } else {
        settings = await AppSettings.findByIdAndUpdate(settings._id, updateData, {
            new: true,
            runValidators: true,
        });
    }
    delCache("admin-settings");
    res.json({ success: true, data: settings });
});

export const shutdownServer = AsyncHandler(async (req, res) => {
    const { message } = req.body;
    let settings = await AppSettings.findOne();
    if (settings) {
        settings.maintenanceMode = true;
        settings.maintenanceMessage =
            message || "Server is under maintenance. Please try again later.";
        await settings.save();
    }

    delCache("admin-settings");
    delCache("admin-dashboard");
    res.json({ success: true, data: { message: "Server shutting down..." } });
    setTimeout(() => {
        process.emit("SIGTERM");
    }, 1000);
});

export const setMaintenance = AsyncHandler(async (req, res) => {
    const { maintenanceMode, maintenanceMessage } = req.body;
    if (maintenanceMode === undefined) {
        throw new ApiError(400, "maintenanceMode is required", "FIELDS_REQUIRED");
    }
    let settings = await AppSettings.findOne();
    if (!settings) {
        settings = await AppSettings.create({
            maintenanceMode,
            maintenanceMessage: maintenanceMessage || undefined,
        });
    } else {
        settings.maintenanceMode = maintenanceMode;
        if (maintenanceMessage !== undefined) {
            settings.maintenanceMessage = maintenanceMessage;
        }
        await settings.save();
    }
    delCache("admin-settings");
    delCache("admin-dashboard");
    res.json({
        success: true,
        data: {
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage,
            message: maintenanceMode
                ? "Maintenance mode is ON"
                : "Maintenance mode is OFF",
        },
    });
});

export const maintenanceOff = AsyncHandler(async (req, res) => {
    let settings = await AppSettings.findOne();
    if (!settings) {
        settings = await AppSettings.create({});
    }
    settings.maintenanceMode = false;
    await settings.save();
    delCache("admin-settings");
    delCache("admin-dashboard");
    res.json({
        success: true,
        data: {
            maintenanceMode: false,
            maintenanceMessage: settings.maintenanceMessage,
            message: "Maintenance mode is OFF",
        },
    });
});


export const getHealth = AsyncHandler(async (req, res) => {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    res.json({
        success: true,
        data: {
            status: "healthy",
            uptime: `${days}d ${hours}h ${minutes}m`,
            uptimeSeconds: uptime,
            memory: {
                rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
            },
            nodeVersion: process.version,
            platform: process.platform,
            timestamp: new Date().toISOString(),
        },
    });
});
