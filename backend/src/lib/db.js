import mongoose from "mongoose";
import dns from "dns";

dns.setServers([
    "8.8.4.4",
    "1.1.1.1"
])
export const connectDB = async () =>{

try{
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`mongodb connected:${conn.connection.host}`);

}catch(error){
    console.log("error in moongoose",error);
    process.exit(1)
}
} 