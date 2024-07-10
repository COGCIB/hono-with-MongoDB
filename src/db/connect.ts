import mongoose from "mongoose";

export default async function dbConnect() {
  await mongoose.connect("mongodb://localhost:27017");
  console.log("Monggodb connected successfully...");
}
