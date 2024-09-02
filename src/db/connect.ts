import mongoose from "mongoose";

export default async function dbConnect() {
  await mongoose.connect("");
  console.log("Monggodb connected successfully...");
}
//comment
