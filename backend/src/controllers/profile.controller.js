import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";

export async function uploadProfilePicture(req, res) {
    try{
        if(!req.file){
            return res.status(400).json({success:false,message:"No file uploaded",
                code:"NO_FILE"});
            
        }
   const result = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
      {
        folder: "devsync/profile-pics",
        transformation: [{ width: 400, height: 400, crop: "fill" }],
      }
    );
    await User.findByIdAndUpdate(req.user._id,{
        profilePic:result.secure_url
    })
    res.json({success:true,data:{message:"Profile picture uploaded successfully",url:result.secure_url}})   
    
}catch(error){
    console.error("Error uploading profile picture:", error);
    return res.status(500).json({success:false,message:"Internal server error",code:"INTERNAL_SERVER_ERROR"});

}
}