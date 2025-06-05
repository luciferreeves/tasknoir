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
      },
    });

    // Debug: Print what we're deploying with
    console.log("Deploying with:");
    console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
    console.log("AUTH_SECRET exists:", !!process.env.AUTH_SECRET);
    console.log("NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    console.log("Stage:", process.env.SST_STAGE);

    return {
      url: web.url,
    };
  },
});
