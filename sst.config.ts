// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "task-noir",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          region: "ap-south-1",
        },
      },
    };
  },
  async run() {
    const web = new sst.aws.Nextjs("TaskNoirWeb", {
      environment: {
        DATABASE_URL: process.env.DATABASE_URL!,
        AUTH_SECRET: process.env.AUTH_SECRET!,
        NODE_ENV: "production",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        NEXT_PUBLIC_SUPABASE_ANON_KEY:
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      },
    });

    // Debug: Print what we're deploying with
    console.log("Deploying with:");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.log("AUTH_SECRET exists:", !!process.env.AUTH_SECRET);
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    console.log(
      "SUPABASE_SERVICE_ROLE_KEY exists:",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
    console.log(
      "NEXT_PUBLIC_SUPABASE_URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    );
    console.log(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY exists:",
      !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
    console.log("Node Environment:", process.env.NODE_ENV);
    console.log("Stage:", process.env.SST_STAGE);

    return {
      url: web.url,
    };
  },
});
