import mongoose from "mongoose";

export default async function dbConnect() {
  await mongoose.connect(
    "mongodb+srv://mmehari:Showmeariver2023@cluster0.rfn7yp7.mongodb.net/hiteshDB?retryWrites=true&w=majority&appName=Cluster0"
  );
  console.log("Monggodb connected successfully...");
}
