import mongoose from "mongoose";

const appSettingsSchema = new mongoose.Schema(
    {
        maintenanceMode:{
            type: Boolean,
            default: false,
        },
        maintenanceMessage:{
            type: String,
            default: "server is under maintenance, please try again later."
        },
        appVersion:{
            type: String,
            default: "1.0.0",
        },
        appName:{
            type: String,
            default: "devSync",
        },
        announcement:{
            type: String,
            default: "",
        },
    },
    {
        timestamps:true,
    }
);

const AppSettings = mongoose.model("AppSettings", appSettingsSchema);

export default AppSettings;
