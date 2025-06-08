import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import Navbar from "~/components/Navbar";
import Loading from "~/components/Loading";
import UserAvatar from "~/components/UserAvatar";

export default function UserProfile() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { id: userId } = router.query;

    // Get user profile data
    const { data: user, isLoading } = api.user.getById.useQuery(
        { id: userId as string },
        { enabled: !!userId && status === "authenticated" }
    );

    // Authentication check
    React.useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            void router.push("/auth/signin");
        }
    }, [session, status, router]);

    if (status === "loading" || isLoading) {
        return <Loading />;
    }

    if (!session) {
        return <Loading />;
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-foreground">User Not Found</h1>
                        <p className="text-muted-foreground mt-2">The user you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to view their profile.</p>
                        <Link href="/dashboard" className="btn btn-primary mt-4">
                            Back to Dashboard
                        </Link>
                    </div>
                </main>
            </div>
        );
    }

    const isOwnProfile = session.user.id === user.id;
    const isAdmin = session.user.role === "ADMIN";

    return (
        <>
            <Head>
                <title>{user.name || user.email} - Profile - Task Noir</title>
                <meta name="description" content={`${user.name || user.email}'s profile`} />
            </Head>
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold text-foreground">
                                {isOwnProfile ? "My Profile" : `${user.name || user.email}'s Profile`}
                            </h1>
                            {isOwnProfile && (
                                <Link href="/profile" className="btn btn-primary">
                                    Edit Profile
                                </Link>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Profile Image and Basic Info */}
                            <div className="lg:col-span-1">
                                <div className="card p-6 space-y-6">
                                    <div className="text-center">
                                        <div className="flex justify-center">
                                            <UserAvatar
                                                user={user}
                                                size="xxl"
                                                clickable={false}
                                                showName={false}
                                            />
                                        </div>
                                        <h2 className="mt-4 text-xl font-semibold text-foreground">
                                            {user.name ?? user.email}
                                        </h2>
                                        <p className="text-muted-foreground">{user.email}</p>
                                        <div className="mt-2 flex items-center justify-center space-x-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "ADMIN"
                                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                                                }`}>
                                                {user.role}
                                            </span>
                                            {user.emailVerified && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                                    Verified
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="space-y-4">
                                        <h3 className="text-lg font-semibold text-foreground">Statistics</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-primary">{user._count.ownedProjects}</div>
                                                <div className="text-sm text-muted-foreground">Projects Owned</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-primary">{user._count.projectMembers}</div>
                                                <div className="text-sm text-muted-foreground">Project Member</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-primary">{user._count.ownedTasks}</div>
                                                <div className="text-sm text-muted-foreground">Tasks Created</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-primary">{user._count.assignedTasks}</div>
                                                <div className="text-sm text-muted-foreground">Tasks Assigned</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border">
                                        <p className="text-sm text-muted-foreground">
                                            Member since {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Details */}
                            <div className="lg:col-span-2">
                                <div className="card p-6">
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-foreground">About</h3>

                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Bio</h4>
                                            <p className="text-foreground">
                                                {user.bio ?? "No bio provided yet."}
                                            </p>
                                        </div>

                                        <div>
                                            <h4 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-foreground">Email:</span>
                                                    <span className="text-sm text-muted-foreground">{user.email}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {isAdmin && !isOwnProfile && (
                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Admin Actions</h4>
                                                <div className="space-y-2">
                                                    <Link
                                                        href="/admin/users"
                                                        className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
                                                    >
                                                        Manage in Admin Panel
                                                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </Link>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
