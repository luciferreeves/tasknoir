import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";
import Loading from "~/components/Loading";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (session) {
      // User is logged in, redirect to dashboard
      void router.push("/dashboard");
    } else {
      // User is not logged in, redirect to signin
      void router.push("/auth/signin");
    }
  }, [session, status, router]);

  return (
    <>
      <Head>
        <title>Task Noir</title>
        <meta name="description" content="Task management application" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Loading />
    </>
  );
}
