import React, { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { api } from "~/utils/api";
import Navbar from "~/components/Navbar";
import Loading from "~/components/Loading";
import UserAvatar from "~/components/UserAvatar";

export default function Profile() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get profile data
    const { data: profile, isLoading, refetch } = api.user.getMyProfile.useQuery();

    // Update mutations
    const updateProfileMutation = api.user.updateProfile.useMutation({
        onSuccess: () => {
            void refetch();
            setIsEditing(false);
        },
        onError: (error) => {
            alert(error.message || "Failed to update profile");
        },
    });

    const [formData, setFormData] = useState({
        name: "",
        bio: "",
    });

    // Form state management
    React.useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name ?? "",
                bio: profile.bio ?? "",
            });
        }
    }, [profile]);

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

    if (!session || !profile) {
        return <Loading />;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateProfileMutation.mutate(formData);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // For now, we'll implement a simple image upload flow
        // In a real implementation, this would upload to S3
        setUploadingImage(true);

        try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json() as { url: string };

            // Update profile with new image URL
            updateProfileMutation.mutate({ image: data.url });
        } catch (error) {
            console.error('Image upload failed:', error);
            alert('Failed to upload image');
        } finally {
            setUploadingImage(false);
        }
    };

    const isAdmin = session.user.role === "ADMIN";

    return (
        <>
            <Head>
                <title>Profile - Task Noir</title>
                <meta name="description" content="User profile" />
            </Head>
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="space-y-8">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn btn-primary"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Profile Image and Basic Info */}
                            <div className="lg:col-span-1">
                                <div className="card p-6 space-y-6">
                                    <div className="text-center">
                                        <div className="relative inline-block">
                                            <UserAvatar
                                                user={{
                                                    id: profile.id,
                                                    name: profile.name,
                                                    email: profile.email,
                                                    image: profile.image
                                                }}
                                                size="xxl"
                                                clickable={false}
                                                showName={false}
                                                className="mx-auto"
                                            />
                                            {isEditing && (
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={uploadingImage}
                                                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90 transition-colors shadow-lg"
                                                    title="Change profile picture"
                                                    aria-label="Change profile picture"
                                                >
                                                    {uploadingImage ? (
                                                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    )}
                                                </button>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="hidden"
                                                aria-label="Upload profile image"
                                            />
                                        </div>
                                        <h2 className="mt-4 text-xl font-semibold text-foreground">
                                            {profile.name}
                                        </h2>
                                        <p className="text-muted-foreground">{profile.email}</p>
                                        <div className="mt-2 flex items-center justify-center space-x-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.role === "ADMIN"
                                                ? "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300"
                                                : "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                                                }`}>
                                                {profile.role}
                                            </span>
                                            {profile.emailVerified && (
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
                                                <div className="text-2xl font-bold text-primary">{profile._count.ownedProjects}</div>
                                                <div className="text-sm text-muted-foreground">Projects Owned</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-primary">{profile._count.projectMembers}</div>
                                                <div className="text-sm text-muted-foreground">Project Member</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-primary">{profile._count.ownedTasks}</div>
                                                <div className="text-sm text-muted-foreground">Tasks Created</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-primary">{profile._count.assignedTasks}</div>
                                                <div className="text-sm text-muted-foreground">Tasks Assigned</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-border">
                                        <p className="text-sm text-muted-foreground">
                                            Member since {new Date(profile.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Profile Details */}
                            <div className="lg:col-span-2">
                                <div className="card p-6">
                                    {isEditing ? (
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            <h3 className="text-lg font-semibold text-foreground">Edit Profile</h3>

                                            <div>
                                                <label className="label">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                    className="input"
                                                    required
                                                    aria-label="Full name"
                                                />
                                            </div>

                                            <div>
                                                <label className="label">Bio</label>
                                                <textarea
                                                    value={formData.bio}
                                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                    className="input min-h-[100px] resize-none"
                                                    placeholder="Tell us about yourself..."
                                                />
                                            </div>

                                            <div className="flex space-x-4">
                                                <button
                                                    type="submit"
                                                    disabled={updateProfileMutation.isPending}
                                                    className="btn btn-primary"
                                                >
                                                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsEditing(false);
                                                        setFormData({
                                                            name: profile.name ?? "",
                                                            bio: profile.bio ?? "",
                                                        });
                                                    }}
                                                    className="btn btn-ghost"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-semibold text-foreground">About</h3>

                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Bio</h4>
                                                <p className="text-foreground">
                                                    {profile.bio ?? "No bio provided yet."}
                                                </p>
                                            </div>

                                            <div>
                                                <h4 className="text-sm font-medium text-muted-foreground mb-2">Contact Information</h4>
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm font-medium text-foreground">Email:</span>
                                                        <span className="text-sm text-muted-foreground">{profile.email}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {isAdmin && (
                                                <div>
                                                    <h4 className="text-sm font-medium text-muted-foreground mb-2">Admin Panel</h4>
                                                    <div className="space-y-2">
                                                        <Link
                                                            href="/admin/users"
                                                            className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
                                                        >
                                                            Manage Users
                                                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </Link>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
