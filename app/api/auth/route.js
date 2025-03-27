import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/user";

export async function POST(req) {
  await connectDB();
  const { name, email, password, action } = await req.json();

  if (action === "signup") {
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({ name, email, password: hashedPassword });

    return NextResponse.json({ message: "User registered successfully", userId: newUser._id }, { status: 201 });
  } 
  
  else if (action === "login") {
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    const response = NextResponse.json({ message: "Login successful", userId: user._id }, { status: 200 });

    
    response.cookies.set("token", token, { httpOnly: true, secure: true, maxAge: 86400 });
    return response;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
