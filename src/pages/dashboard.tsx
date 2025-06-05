import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";
import Navbar from "~/components/Navbar";
import Loading from "~/components/Loading";

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status === "loading") return; // Still loading
        if (!session) {
            void router.push("/auth/signin");
            return;
        }
    }, [session, status, router]);

    if (status === "loading") {
        return <Loading />;
    }

    if (!session) {
        return <Loading />;
    }

    return (
        <>
            <Head>
                <title>Dashboard - Task Noir</title>
                <meta name="description" content="Your task management dashboard" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    <div className="rounded-xl bg-white/10 p-8 backdrop-blur-sm">
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Welcome back, {session.user.name}! 👋
                            </h1>
                            <p className="text-white/70 text-lg">
                                Ready to tackle your tasks today?
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Tasks Overview Card */}
                            <div className="rounded-lg bg-white/5 p-6 border border-white/10">
                                <h3 className="text-xl font-semibold text-white mb-4">📋 Tasks Overview</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/70">Total Tasks</span>
                                        <span className="text-2xl font-bold text-white">0</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/70">Completed</span>
                                        <span className="text-xl font-semibold text-green-400">0</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-white/70">Pending</span>
                                        <span className="text-xl font-semibold text-yellow-400">0</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions Card */}
                            <div className="rounded-lg bg-white/5 p-6 border border-white/10">
                                <h3 className="text-xl font-semibold text-white mb-4">⚡ Quick Actions</h3>
                                <div className="space-y-3">
                                    <button className="w-full rounded-lg bg-[hsl(280,100%,70%)]/20 border border-[hsl(280,100%,70%)]/30 px-4 py-3 text-white hover:bg-[hsl(280,100%,70%)]/30 transition-colors">
                                        ➕ Add New Task
                                    </button>
                                    <button className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white hover:bg-white/20 transition-colors">
                                        📊 View Analytics
                                    </button>
                                    <button className="w-full rounded-lg bg-white/10 border border-white/20 px-4 py-3 text-white hover:bg-white/20 transition-colors">
                                        ⚙️ Settings
                                    </button>
                                </div>
                            </div>

                            {/* Profile Card */}
                            <div className="rounded-lg bg-white/5 p-6 border border-white/10">
                                <h3 className="text-xl font-semibold text-white mb-4">👤 Profile</h3>
                                <div className="space-y-2">
                                    <div className="text-white/80">
                                        <span className="block text-sm text-white/60">Name:</span>
                                        <span className="font-medium">{session.user.name}</span>
                                    </div>
                                    <div className="text-white/80">
                                        <span className="block text-sm text-white/60">Email:</span>
                                        <span className="font-medium">{session.user.email}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="mt-8">
                            <h2 className="text-2xl font-bold text-white mb-4">📈 Recent Activity</h2>
                            <div className="rounded-lg bg-white/5 p-6 border border-white/10">
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">🎯</div>
                                    <p className="text-white/70">No activity yet</p>
                                    <p className="text-sm text-white/50 mt-1">
                                        Start by creating your first task!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
