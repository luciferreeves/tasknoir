import NextAuth from "next-auth";
import { authOptions } from "~/server/auth/config";

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
export default NextAuth(authOptions);
