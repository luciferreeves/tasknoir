import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "~/server/db";

const signupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("Signup attempt started");
    const { name, email, password } = signupSchema.parse(req.body);
    console.log("Signup data validated for email:", email);

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });
    console.log("Existing user check complete");

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log("Password hashed successfully");

    // Create user
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });
    console.log("User created successfully:", user.id);

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _password, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword });
  } catch (error) {
    console.error("Signup error details:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: error.errors[0]?.message });
    }
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
