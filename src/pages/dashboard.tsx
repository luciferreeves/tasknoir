import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
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
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    <div className="card p-8">
                        <div className="mb-8">
                            <h1 className="text-4xl font-bold text-foreground mb-2">
                                Welcome back, {session.user.name}! 👋
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Ready to tackle your tasks today?
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Tasks Overview Card */}
                            <div className="card p-6 hover-lift">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <span className="text-xl">📋</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground">Tasks Overview</h3>
                                </div>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                                        <span className="text-muted-foreground font-medium">Total Tasks</span>
                                        <span className="text-xl font-semibold text-foreground">0</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-success/5">
                                        <span className="text-muted-foreground font-medium">Completed</span>
                                        <span className="text-xl font-semibold text-green-600 dark:text-green-400">0</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-warning/5">
                                        <span className="text-muted-foreground font-medium">Pending</span>
                                        <span className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">0</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions Card */}
                            <div className="card p-6 hover-lift">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <span className="text-xl">⚡</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground">Quick Actions</h3>
                                </div>
                                <div className="space-y-3">
                                    <Link href="/tasks/new" className="block">
                                        <button className="w-full btn btn-primary justify-start gap-3">
                                            <span className="text-lg">➕</span>
                                            Add New Task
                                        </button>
                                    </Link>
                                    <Link href="/projects/new" className="block">
                                        <button className="w-full btn btn-outline justify-start gap-3">
                                            <span className="text-lg">📁</span>
                                            Create Project
                                        </button>
                                    </Link>
                                    <Link href="/tasks" className="block">
                                        <button className="w-full btn btn-outline justify-start gap-3">
                                            <span className="text-lg">📊</span>
                                            View All Tasks
                                        </button>
                                    </Link>
                                </div>
                            </div>

                            {/* Profile Card */}
                            <div className="card p-6 hover-lift">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <span className="text-xl">👤</span>
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground">Profile</h3>
                                </div>
                                <div className="space-y-4">
                                    {session.user?.image && (
                                        <div className="flex justify-center">
                                            <Image
                                                className="h-16 w-16 rounded-full border-2 border-border shadow-sm object-cover"
                                                src={session.user.image}
                                                alt="Profile"
                                                width={64}
                                                height={64}
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-3">
                                        <div className="p-3 rounded-lg bg-muted/30">
                                            <span className="block text-sm text-muted-foreground font-medium mb-1">Name</span>
                                            <span className="font-medium text-foreground">{session.user.name}</span>
                                        </div>
                                        <div className="p-3 rounded-lg bg-muted/30">
                                            <span className="block text-sm text-muted-foreground font-medium mb-1">Email</span>
                                            <span className="font-medium text-foreground text-sm">{session.user.email}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="mt-8">
                            <h2 className="text-2xl font-bold text-foreground mb-4">📈 Recent Activity</h2>
                            <div className="card p-6">
                                <div className="text-center py-8">
                                    <div className="text-4xl mb-2">🎯</div>
                                    <p className="text-muted-foreground">No activity yet</p>
                                    <p className="text-sm text-muted-foreground mt-1">
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
