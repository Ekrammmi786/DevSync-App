import jwt from "jsonwebtoken";
import "dotenv/config";
import User from "../models/user.js";

export const protectRoute = async(req,res,next)=>{

try{
    const token = req.cookies.jwt;
    if(!token){
        return res.status(401).json({
            message:"Not authorized, no token"
        })
    }
    const decode = jwt.verify(token,process.env.JWT_SECRET_KEY);

    if(!decode){
        return res.status(401).json({
            message:"Not authorized, invalid token"
        })
    }
    const user = await User.findById(decode.userId).select("-password");
    
    if(!user){
        return res.status(401).json({
            message:"Not authorized, user not found"
        })
    }
    req.user = user;
    next();

}catch(error){
    console.error(error);
    return res.status(500).json({
        message:error.message
    })



}



}
