import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "~/server/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    console.log("Testing database connection...");
    
    // Test database connection
    await db.$connect();
    console.log("Database connected successfully");
    
    // Test a simple query
    const userCount = await db.user.count();
    console.log("User count query successful:", userCount);
    
    // Test environment variables
    const envCheck = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasAuthSecret: !!process.env.AUTH_SECRET,
      hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
      nodeEnv: process.env.NODE_ENV,
    };
    
    console.log("Environment check:", envCheck);
    
    await db.$disconnect();
    
    res.status(200).json({ 
      status: "OK", 
      userCount,
      environment: envCheck,
      message: "Database connection successful" 
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    res.status(500).json({ 
      status: "ERROR", 
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
