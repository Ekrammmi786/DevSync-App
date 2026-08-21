import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            required: true, 
    }

    