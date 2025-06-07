import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import { api } from "~/utils/api";
import Navbar from "~/components/Navbar";
import Loading from "~/components/Loading";

interface UserWithCounts {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: "USER" | "ADMIN";
    bio: string | null;
    emailVerified: boolean;
    createdAt: Date;
    _count: {
        ownedProjects: number;
        projectMembers: number;
        assignedTasks: number;
        ownedTasks: number;
    };
}

export default function AdminUsers() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [editingUser, setEditingUser] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        name: "",
        bio: "",
        role: "USER" as "USER" | "ADMIN",
        emailVerified: false,
    });

    // Get all users (admin only)
    const { data: users, isLoading, refetch } = api.user.getAll.useQuery();

    // Cast users to the proper type since we know we're an admin
    const typedUsers = users as UserWithCounts[] | undefined;

    // Update user mutation
    const updateUserMutation = api.user.updateUserProfile.useMutation({
        onSuccess: () => {
            void refetch();
            setEditingUser(null);
        },
        onError: (error) => {
            alert(error.message || "Failed to update user");
        },
    });

    // Authentication and authorization check
    React.useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            void router.push("/auth/signin");
            return;
        }
        if (session.user.role !== "ADMIN") {
            void router.push("/dashboard");
        }
    }, [session, status, router]);

    if (status === "loading" || isLoading) {
        return <Loading />;
    }

    if (!session || session.user.role !== "ADMIN") {
        return <Loading />;
    }

    const handleEditUser = (user: UserWithCounts) => {
        setEditingUser(user.id);
        setEditForm({
            name: user.name ?? "",
            bio: user.bio ?? "",
            role: user.role,
            emailVerified: user.emailVerified,
        });
    };

    const handleSaveUser = (userId: string) => {
        updateUserMutation.mutate({
            id: userId,
            ...editForm,
        });
    };

    const handleCancelEdit = () => {
        setEditingUser(null);
        setEditForm({
            name: "",
            bio: "",
            role: "USER",
            emailVerified: false,
        });
    };

    return (
        <>
            <Head>
                <title>User Management - Task Noir Admin</title>
                <meta name="description" content="Admin user management" />
            </Head>
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground">User Management</h1>
                                <p className="text-muted-foreground mt-2">
                                    Manage user accounts, roles, and permissions
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300">
                                    Admin Panel
                                </span>
                            </div>
                        </div>

                        {/* Users Table */}
                        <div className="card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                User
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Role
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Activity
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Joined
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-card divide-y divide-border">
                                        {typedUsers?.map((user) => (
                                            <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center overflow-hidden">
                                                                {user.image ? (
                                                                    <Image
                                                                        className="h-10 w-10 rounded-full object-cover"
                                                                        src={user.image}
                                                                        alt=""
                                                                        width={40}
                                                                        height={40}
                                                                    />
                                                                ) : (
                                                                    <span className="text-sm font-medium text-primary-foreground">
                                                                        {user.name.charAt(0).toUpperCase()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-foreground">
                                                                {editingUser === user.id ? (<input
                                                                    type="text"
                                                                    value={editForm.name}
                                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                                    className="input text-sm py-1 px-2 w-48"
                                                                    aria-label="User name"
                                                                    placeholder="User name"
                                                                />
                                                                ) : (
                                                                    user.name
                                                                )}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {user.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {editingUser === user.id ? (
                                                        <select
                                                            value={editForm.role}
                                                            onChange={(e) => setEditForm({ ...editForm, role: e.target.value as "USER" | "ADMIN" })}
                                                            className="select text-sm py-1 px-2"
                                                            aria-label="User role"
                                                        >
                                                            <option value="USER">User</option>
                                                            <option value="ADMIN">Admin</option>
                                                        </select>
                                                    ) : (
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === "ADMIN"
                                                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                                                            : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="space-y-1">
                                                        {editingUser === user.id ? (
                                                            <label className="flex items-center space-x-2 text-sm">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={editForm.emailVerified}
                                                                    onChange={(e) => setEditForm({ ...editForm, emailVerified: e.target.checked })}
                                                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                                                    aria-label="Email verified status"
                                                                />
                                                                <span>Email Verified</span>
                                                            </label>
                                                        ) : (
                                                            user.emailVerified ? (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                                                                    Verified
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
                                                                    Unverified
                                                                </span>
                                                            )
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                    <div className="space-y-1">
                                                        <div>{user._count.ownedProjects} projects owned</div>
                                                        <div>{user._count.assignedTasks} tasks assigned</div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {editingUser === user.id ? (
                                                        <div className="space-x-2">
                                                            <button
                                                                onClick={() => handleSaveUser(user.id)}
                                                                disabled={updateUserMutation.isPending}
                                                                className="btn btn-primary btn-sm"
                                                            >
                                                                {updateUserMutation.isPending ? "Saving..." : "Save"}
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="btn btn-ghost btn-sm"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEditUser(user)}
                                                            className="btn btn-ghost btn-sm"
                                                        >
                                                            Edit
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {editingUser && (
                            <div className="card p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Edit Bio</h3>
                                <div>
                                    <label className="label">Bio</label>
                                    <textarea
                                        value={editForm.bio}
                                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                                        className="input min-h-[100px] resize-none"
                                        placeholder="User bio..."
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
