import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import { api } from "~/utils/api";
import Loading from "~/components/Loading";
import Navbar from "~/components/Navbar";

const ProjectDetailPage: NextPage = () => {
    const router = useRouter();
    const { data: session, status } = useSession();
    const { id } = router.query;

    // State for member management
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMemberEmail, setNewMemberEmail] = useState("");
    const [isAddingMember, setIsAddingMember] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const projectQuery = api.project.getById.useQuery(
        { id: id as string },
        { enabled: !!id && status === "authenticated" }
    );

    const project = projectQuery.data;
    const isLoading = projectQuery.isLoading;
    const error = projectQuery.error;

    const tasksQuery = api.task.getAll.useQuery(
        { projectId: id as string },
        { enabled: !!id && status === "authenticated" }
    );

    const projectTasks = tasksQuery.data;

    // User search for autocomplete
    const userSearchQuery = api.user.search.useQuery(
        { query: searchQuery, limit: 5 },
        {
            enabled: searchQuery.length >= 2,
            refetchOnWindowFocus: false,
        }
    );

    // Member management mutations
    const addMemberMutation = api.project.addMember.useMutation({
        onSuccess: () => {
            setNewMemberEmail("");
            setSearchQuery("");
            setShowAddMember(false);
            setIsAddingMember(false);
            void projectQuery.refetch();
        },
        onError: (error) => {
            setIsAddingMember(false);
            alert(error.message || "An error occurred");
        },
    });

    const removeMemberMutation = api.project.removeMember.useMutation({
        onSuccess: () => {
            void projectQuery.refetch();
        },
        onError: (error) => {
            alert(error.message || "An error occurred");
        },
    });

    // Check if current user is owner or admin
    const isOwner = project?.owner.id === session?.user.id;
    const isAdmin = session?.user.role === "ADMIN";
    const canManageMembers = isOwner || isAdmin;

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberEmail.trim() || !project) return;

        setIsAddingMember(true);
        addMemberMutation.mutate({
            projectId: project.id,
            userEmail: newMemberEmail.trim(),
        });
    };

    const handleRemoveMember = (userId: string) => {
        if (!project) return;

        if (confirm("Are you sure you want to remove this member from the project?")) {
            removeMemberMutation.mutate({
                projectId: project.id,
                userId,
            });
        }
    };

    if (status === "loading" || isLoading) return <Loading />;

    if (status === "unauthenticated") {
        void router.push("/auth/signin");
        return <Loading />;
    }

    if (error) {
        return (
            <>
                <Head>
                    <title>Project Error - Task Noir</title>
                    <meta name="description" content="Error loading project" />
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <div className="min-h-screen bg-background">
                    <Navbar />
                    <div className="container mx-auto px-4 py-8">
                        <div className="card text-center p-8">
                            <div className="text-6xl mb-4">⚠️</div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Project</h2>
                            <p className="text-destructive mb-6">
                                {error.message ?? "Something went wrong while loading the project"}
                            </p>
                            <Link href="/projects" className="btn btn-primary">
                                Back to Projects
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!project) {
        return (
            <>
                <Head>
                    <title>Project Not Found - Task Noir</title>
                    <meta name="description" content="Project not found" />
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <div className="min-h-screen bg-background">
                    <Navbar />
                    <div className="container mx-auto px-4 py-8">
                        <div className="card text-center p-8">
                            <div className="text-6xl mb-4">🔍</div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Project Not Found</h2>
                            <p className="text-muted-foreground mb-6">
                                The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
                            </p>
                            <Link href="/projects" className="btn btn-primary">
                                Back to Projects
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const completedTasks = projectTasks?.filter(task => task.status === "COMPLETED").length ?? 0;
    const totalTasks = projectTasks?.length ?? 0;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "URGENT": return "badge badge-destructive";
            case "HIGH": return "badge badge-danger";
            case "MEDIUM": return "badge badge-warning";
            case "LOW": return "badge badge-success";
            default: return "badge badge-secondary";
        }
    };

    const getTaskStatusColor = (status: string) => {
        switch (status) {
            case "TODO": return "badge badge-secondary";
            case "IN_PROGRESS": return "badge badge-primary";
            case "REVIEW": return "badge badge-warning";
            case "COMPLETED": return "badge badge-success";
            default: return "badge badge-secondary";
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/projects"
                                className="btn btn-ghost"
                            >
                                ← Back to Projects
                            </Link>
                        </div>
                        <div className="flex space-x-2">
                            <Link
                                href={`/tasks/new?projectId=${project.id}`}
                                className="btn btn-primary"
                            >
                                Add Task
                            </Link>
                            <Link
                                href={`/projects/${project.id}/edit`}
                                className="btn btn-secondary"
                            >
                                Edit Project
                            </Link>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-foreground mb-2">{project.title}</h1>
                    {project.description && (
                        <p className="text-muted-foreground mb-4">{project.description}</p>
                    )}

                    <div className="flex items-center space-x-4 mb-4">
                        {project.timeline && (
                            <span className="text-sm text-muted-foreground">
                                Timeline: {project.timeline}
                            </span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-foreground">Progress</span>
                            <span className="text-sm text-muted-foreground">
                                {completedTasks}/{totalTasks} tasks completed
                            </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                            <div
                                className={`bg-primary h-3 rounded-full transition-all duration-300 ${progressPercentage === 0 ? 'w-0' :
                                    progressPercentage <= 25 ? 'w-1/4' :
                                        progressPercentage <= 50 ? 'w-1/2' :
                                            progressPercentage <= 75 ? 'w-3/4' :
                                                'w-full'
                                    }`}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Project Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Tasks Section */}
                        <div className="card mb-8">
                            <div className="p-6 border-b border-border">
                                <h2 className="text-xl font-semibold text-foreground">Tasks</h2>
                            </div>
                            <div className="p-6">
                                {projectTasks && projectTasks.length > 0 ? (
                                    <div className="space-y-4">
                                        {projectTasks.map((task) => (
                                            <div key={task.id} className="card border hover-lift transition-all p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <Link
                                                        href={`/tasks/${task.id}`}
                                                        className="text-lg font-medium text-foreground hover:text-primary"
                                                    >
                                                        {task.title}
                                                    </Link>
                                                    <div className="flex space-x-2">
                                                        <span className={getTaskStatusColor(task.status)}>
                                                            {task.status.replace('_', ' ')}
                                                        </span>
                                                        <span className={getPriorityColor(task.priority)}>
                                                            {task.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                                {task.description && (
                                                    <p className="text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                                                )}
                                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                    <div className="flex items-center space-x-4">
                                                        {task.assignments && task.assignments.length > 0 && (
                                                            <span>Assigned to: {task.assignments[0]?.user.name ?? task.assignments[0]?.user.email}</span>
                                                        )}
                                                        {task.dueDate && (
                                                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                    <span>Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground mb-4">No tasks yet</p>
                                        <Link
                                            href={`/tasks/new?projectId=${project.id}`}
                                            className="btn btn-primary"
                                        >
                                            Create First Task
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Milestones Section - Remove this section since milestones don't exist in schema */}

                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Project Info */}
                        <div className="card">
                            <div className="p-6 border-b border-border">
                                <h3 className="text-lg font-semibold text-foreground">Project Info</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">Owner</span>
                                    <p className="text-foreground">{project.owner.name ?? project.owner.email}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">Created</span>
                                    <p className="text-foreground">{new Date(project.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                                    <p className="text-foreground">{new Date(project.updatedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Team Members */}
                        <div className="card">
                            <div className="p-6 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-foreground">Team Members</h3>
                                    {canManageMembers && (
                                        <button
                                            onClick={() => setShowAddMember(true)}
                                            className="btn btn-primary btn-sm"
                                        >
                                            Add Member
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="p-6">
                                {/* Owner */}
                                <div className="mb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                                                {(project.owner.name ?? project.owner.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <span className="text-foreground font-medium">
                                                    {project.owner.name ?? project.owner.email}
                                                </span>
                                                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                                    Owner
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Members */}
                                {project.members && project.members.length > 0 ? (
                                    <div className="space-y-3">
                                        {project.members.map((member) => (
                                            <div key={member.id} className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-secondary-foreground text-sm font-medium">
                                                        {(member.user.name ?? member.user.email).charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="text-foreground">
                                                            {member.user.name ?? member.user.email}
                                                        </span>
                                                        <div className="text-xs text-muted-foreground">
                                                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                {canManageMembers && (
                                                    <button
                                                        onClick={() => handleRemoveMember(member.user.id)}
                                                        className="btn btn-ghost btn-sm text-destructive hover:bg-destructive/10"
                                                        title="Remove member"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-muted-foreground text-sm">No team members yet</p>
                                        {canManageMembers && (
                                            <p className="text-muted-foreground text-xs mt-1">
                                                Add members to collaborate on this project
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Add Member Modal/Form */}
                                {showAddMember && (
                                    <div className="mt-4 p-4 border border-border rounded-lg bg-muted/50">
                                        <h4 className="text-sm font-medium text-foreground mb-3">Add New Member</h4>
                                        <form onSubmit={handleAddMember} className="space-y-3">
                                            <div className="relative">
                                                <label className="block text-sm font-medium text-foreground mb-3">
                                                    Email Address
                                                </label>
                                                <input
                                                    type="email"
                                                    value={newMemberEmail}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        setNewMemberEmail(value);
                                                        setSearchQuery(value);
                                                        setShowSuggestions(value.length >= 2);
                                                    }}
                                                    onFocus={() => {
                                                        if (newMemberEmail.length >= 2) {
                                                            setShowSuggestions(true);
                                                        }
                                                    }}
                                                    onBlur={() => {
                                                        // Delay hiding suggestions to allow click
                                                        setTimeout(() => setShowSuggestions(false), 200);
                                                    }}
                                                    placeholder="Enter user's email address"
                                                    autoComplete="email"
                                                    className="input focus:outline-none"
                                                    required
                                                    disabled={isAddingMember}
                                                />

                                                {/* Autocomplete Suggestions */}
                                                {showSuggestions && userSearchQuery.data && userSearchQuery.data.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                        {userSearchQuery.data.map((user, index) => (
                                                            <button
                                                                key={user.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setNewMemberEmail(user.email);
                                                                    setShowSuggestions(false);
                                                                    setSearchQuery("");
                                                                }}
                                                                className={`w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground flex items-center space-x-2 text-sm transition-colors ${index === 0 ? 'rounded-t-lg' : ''
                                                                    } ${index === userSearchQuery.data.length - 1 ? 'rounded-b-lg' : ''
                                                                    }`}
                                                            >
                                                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-xs font-medium">
                                                                    {(user.name ?? user.email).charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div className="font-medium text-foreground">
                                                                        {user.name ?? user.email}
                                                                    </div>
                                                                    {user.name && (
                                                                        <div className="text-xs text-muted-foreground">
                                                                            {user.email}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex space-x-2">
                                                <button
                                                    type="submit"
                                                    disabled={isAddingMember || !newMemberEmail.trim()}
                                                    className="btn btn-primary btn-sm"
                                                >
                                                    {isAddingMember ? "Adding..." : "Add Member"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowAddMember(false);
                                                        setNewMemberEmail("");
                                                        setSearchQuery("");
                                                        setShowSuggestions(false);
                                                    }}
                                                    className="btn btn-ghost btn-sm"
                                                    disabled={isAddingMember}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailPage;
