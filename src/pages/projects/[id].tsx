import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Head from "next/head";
import Link from "next/link";
import { useState, useEffect } from "react";
import { api } from "~/utils/api";
import Loading from "~/components/Loading";
import Navbar from "~/components/Navbar";
import UserAvatar from "~/components/UserAvatar";
import HtmlPreview from "~/components/HtmlPreview";

// Type definitions for milestones
interface MilestoneType {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
    completed: boolean;
    projectId: string;
    createdAt: Date;
    updatedAt: Date;
}

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

    // State for milestone management
    const [showAddMilestone, setShowAddMilestone] = useState(false);
    const [editingMilestone, setEditingMilestone] = useState<string | null>(null);
    const [milestoneForm, setMilestoneForm] = useState({
        title: "",
        description: "",
        dueDate: "",
    });

    // State for task hierarchy - pre-collapsed on project page
    const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());

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

    // Organize tasks into parent-child relationships
    const organizedTasks = () => {
        if (!projectTasks) return [];

        const parentTasks: typeof projectTasks = [];
        const subtasksByParent: Record<string, typeof projectTasks> = {};

        // Separate parent tasks and subtasks
        projectTasks.forEach(task => {
            if (task.parentTask) {
                subtasksByParent[task.parentTask.id] ??= [];
                subtasksByParent[task.parentTask.id]!.push(task);
            } else {
                parentTasks.push(task);
            }
        });

        // Create organized list with parent tasks followed by their subtasks
        const organized: (typeof projectTasks[0] & { isSubtask?: boolean; parentId?: string })[] = [];

        parentTasks.forEach(parentTask => {
            organized.push(parentTask);

            if (subtasksByParent[parentTask.id] && !collapsedParents.has(parentTask.id)) {
                subtasksByParent[parentTask.id]!.forEach(subtask => {
                    organized.push({ ...subtask, isSubtask: true, parentId: parentTask.id });
                });
            }
        });

        return organized;
    };

    const toggleParentCollapse = (parentId: string) => {
        setCollapsedParents(prev => {
            const newSet = new Set(prev);
            if (newSet.has(parentId)) {
                newSet.delete(parentId);
            } else {
                newSet.add(parentId);
            }
            return newSet;
        });
    };

    // Pre-collapse all parent tasks when data loads
    useEffect(() => {
        if (projectTasks) {
            const parentTaskIds = projectTasks
                .filter(task => !task.parentTask)
                .filter(task => projectTasks.some(t => t.parentTask?.id === task.id))
                .map(task => task.id);

            if (parentTaskIds.length > 0) {
                setCollapsedParents(new Set(parentTaskIds));
            }
        }
    }, [projectTasks]);

    // Milestone queries
    const milestonesQuery = api.milestone.getByProjectId.useQuery(
        { projectId: id as string },
        { enabled: !!id && status === "authenticated" }
    );

    const milestones = milestonesQuery.data;

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

    // Milestone management mutations
    const createMilestoneMutation = api.milestone.create.useMutation({
        onSuccess: () => {
            void milestonesQuery.refetch();
            setShowAddMilestone(false);
            setMilestoneForm({ title: "", description: "", dueDate: "" });
        },
        onError: (error) => {
            alert(error.message || "An error occurred");
        },
    });

    const updateMilestoneMutation = api.milestone.update.useMutation({
        onSuccess: () => {
            void milestonesQuery.refetch();
            setEditingMilestone(null);
            setMilestoneForm({ title: "", description: "", dueDate: "" });
        },
        onError: (error) => {
            alert(error.message || "An error occurred");
        },
    });

    const deleteMilestoneMutation = api.milestone.delete.useMutation({
        onSuccess: () => {
            void milestonesQuery.refetch();
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

    // Milestone management handlers
    const handleAddMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!project || !milestoneForm.title.trim()) return;

        createMilestoneMutation.mutate({
            projectId: project.id,
            title: milestoneForm.title.trim(),
            description: milestoneForm.description.trim() || undefined,
            dueDate: milestoneForm.dueDate ? new Date(milestoneForm.dueDate) : undefined,
        });
    };

    const handleEditMilestone = (milestone: MilestoneType) => {
        setEditingMilestone(milestone.id);
        setMilestoneForm({
            title: milestone.title,
            description: milestone.description ?? "",
            dueDate: milestone.dueDate ? new Date(milestone.dueDate).toISOString().split('T')[0]! : "",
        });
    };

    const handleUpdateMilestone = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingMilestone || !milestoneForm.title.trim()) return;

        updateMilestoneMutation.mutate({
            id: editingMilestone,
            title: milestoneForm.title.trim(),
            description: milestoneForm.description.trim() || undefined,
            dueDate: milestoneForm.dueDate ? new Date(milestoneForm.dueDate) : undefined,
        });
    };

    const handleDeleteMilestone = (milestoneId: string) => {
        if (confirm("Are you sure you want to delete this milestone?")) {
            deleteMilestoneMutation.mutate({ id: milestoneId });
        }
    };

    const handleToggleMilestone = (milestone: MilestoneType) => {
        updateMilestoneMutation.mutate({
            id: milestone.id,
            completed: !milestone.completed,
        });
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
            case "URGENT": return "priority-urgent";
            case "HIGH": return "priority-high";
            case "MEDIUM": return "priority-medium";
            case "LOW": return "priority-low";
            default: return "priority-medium";
        }
    };

    const getTaskStatusColor = (status: string) => {
        switch (status) {
            case "TODO": return "status-todo";
            case "IN_PROGRESS": return "status-in-progress";
            case "REVIEW": return "status-review";
            case "COMPLETED": return "status-completed";
            default: return "status-todo";
        }
    };

    return (
        <div>
            <Head>
                <title>{project.title} - Task Noir</title>
                <meta name="description" content={project.description ?? "Project details"} />
                <link rel="icon" href="/favicon.ico" />
            </Head>
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
                                <span className={`text-sm font-semibold ${progressPercentage >= 80 ? 'text-green-600' :
                                    progressPercentage >= 60 ? 'text-blue-600' :
                                        progressPercentage >= 40 ? 'text-yellow-600' :
                                            progressPercentage >= 20 ? 'text-orange-600' :
                                                'text-red-600'
                                    }`}>
                                    {Math.round(progressPercentage)}% ({completedTasks}/{totalTasks} tasks completed)
                                </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                <div
                                    className={`h-3 rounded-full transition-all duration-500 ease-out ${progressPercentage === 0 ? 'w-0 bg-muted' :
                                        progressPercentage >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                                            progressPercentage >= 60 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                                                progressPercentage >= 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                                                    progressPercentage >= 20 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                                                        'bg-gradient-to-r from-red-500 to-red-400'
                                        }`}
                                    style={{ width: `${progressPercentage}%` }}
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
                                            {organizedTasks().map((task) => {
                                                const hasSubtasks = !task.isSubtask && Boolean(task._count?.subTasks && task._count.subTasks > 0);
                                                const isCollapsed = collapsedParents.has(task.id);

                                                return (
                                                    <div key={task.id} className={`relative ${task.isSubtask ? 'ml-8' : ''}`}>
                                                        {/* Collapse/Expand button for parent tasks - positioned closer to task list area */}
                                                        {hasSubtasks && task._count && task._count.subTasks > 0 && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    toggleParentCollapse(task.id);
                                                                }}
                                                                className="absolute -left-10 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors shadow-sm"
                                                                aria-label={isCollapsed ? "Expand subtasks" : "Collapse subtasks"}
                                                            >
                                                                {isCollapsed ? "+" : "−"}
                                                            </button>
                                                        )}

                                                        <div className={`card border hover-lift transition-all p-4 ${task.isSubtask ? '-mt-3 mb-1' : 'mb-4'} last:mb-0`}>
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
                                                                <HtmlPreview
                                                                    content={task.description}
                                                                    className="text-muted-foreground mb-3 line-clamp-2"
                                                                    maxLength={150}
                                                                    stripHtml={true}
                                                                />
                                                            )}
                                                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                                <div className="flex items-center space-x-4">
                                                                    {task.assignments && task.assignments.length > 0 && (
                                                                        <div className="flex items-center space-x-2">
                                                                            <span>Assigned to:</span>
                                                                            <UserAvatar
                                                                                user={task.assignments[0]!.user}
                                                                                size="sm"
                                                                                clickable={true}
                                                                                showName={true}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    {task.dueDate && (
                                                                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                                                    )}
                                                                </div>
                                                                <span>Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
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

                            {/* Milestones Section */}
                            <div className="card">
                                <div className="p-6 border-b border-border">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-xl font-semibold text-foreground">Milestones</h2>
                                        {canManageMembers && (
                                            <button
                                                onClick={() => setShowAddMilestone(true)}
                                                className="btn btn-primary btn-sm"
                                            >
                                                Add Milestone
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="p-6">
                                    {/* Add Milestone Form */}
                                    {showAddMilestone && (
                                        <div className="mb-6 p-4 border border-border rounded-lg bg-muted/50">
                                            <h4 className="text-sm font-medium text-foreground mb-3">Add New Milestone</h4>
                                            <form onSubmit={handleAddMilestone} className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-2">
                                                        Title
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={milestoneForm.title}
                                                        onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                                                        placeholder="Enter milestone title"
                                                        className="input"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-foreground mb-2">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        value={milestoneForm.description}
                                                        onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                                                        placeholder="Enter milestone description (optional)"
                                                        className="textarea"
                                                        rows={4}
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor="milestone-due-date-add" className="block text-sm font-medium text-foreground mb-2">
                                                        Due Date
                                                    </label>
                                                    <input
                                                        id="milestone-due-date-add"
                                                        type="date"
                                                        value={milestoneForm.dueDate}
                                                        onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                                                        className="input"
                                                    />
                                                </div>
                                                <div className="flex space-x-2">
                                                    <button
                                                        type="submit"
                                                        disabled={createMilestoneMutation.isPending || !milestoneForm.title.trim()}
                                                        className="btn btn-primary btn-sm"
                                                    >
                                                        {createMilestoneMutation.isPending ? "Creating..." : "Create Milestone"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowAddMilestone(false);
                                                            setMilestoneForm({ title: "", description: "", dueDate: "" });
                                                        }}
                                                        className="btn btn-ghost btn-sm"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}

                                    {/* Milestones List */}
                                    {milestones && milestones.length > 0 ? (
                                        <div className="space-y-4">
                                            {milestones.map((milestone) => (
                                                <div key={milestone.id} className="card border p-4">
                                                    {editingMilestone === milestone.id ? (
                                                        <form onSubmit={handleUpdateMilestone} className="space-y-4">
                                                            <div>
                                                                <label htmlFor="milestone-title-edit" className="block text-sm font-medium text-foreground mb-2">
                                                                    Title
                                                                </label>
                                                                <input
                                                                    id="milestone-title-edit"
                                                                    type="text"
                                                                    value={milestoneForm.title}
                                                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                                                                    className="input"
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-foreground mb-2">
                                                                    Description
                                                                </label>
                                                                <textarea
                                                                    value={milestoneForm.description}
                                                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, description: e.target.value })}
                                                                    className="textarea"
                                                                    rows={4}
                                                                    placeholder="Enter milestone description (optional)"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label htmlFor="milestone-due-date-edit" className="block text-sm font-medium text-foreground mb-2">
                                                                    Due Date
                                                                </label>
                                                                <input
                                                                    id="milestone-due-date-edit"
                                                                    type="date"
                                                                    value={milestoneForm.dueDate}
                                                                    onChange={(e) => setMilestoneForm({ ...milestoneForm, dueDate: e.target.value })}
                                                                    className="input"
                                                                />
                                                            </div>
                                                            <div className="flex space-x-2">
                                                                <button
                                                                    type="submit"
                                                                    disabled={updateMilestoneMutation.isPending}
                                                                    className="btn btn-primary btn-sm"
                                                                >
                                                                    {updateMilestoneMutation.isPending ? "Saving..." : "Save Changes"}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingMilestone(null);
                                                                        setMilestoneForm({ title: "", description: "", dueDate: "" });
                                                                    }}
                                                                    className="btn btn-ghost btn-sm"
                                                                >
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </form>
                                                    ) : (
                                                        <div className="flex items-start space-x-4">
                                                            {/* Checkbox - Fixed size and separated */}
                                                            <div className="flex-shrink-0 pt-1">
                                                                <button
                                                                    onClick={() => handleToggleMilestone(milestone)}
                                                                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${milestone.completed
                                                                        ? 'bg-success border-success text-success-foreground'
                                                                        : 'border-border hover:border-primary'
                                                                        }`}
                                                                    disabled={updateMilestoneMutation.isPending}
                                                                >
                                                                    {milestone.completed && (
                                                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                </button>
                                                            </div>

                                                            {/* Content - Flexible width */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className={`font-medium ${milestone.completed ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                                                            {milestone.title}
                                                                        </h4>
                                                                        {milestone.description && (
                                                                            <p className={`text-sm mt-1 ${milestone.completed ? 'text-muted-foreground line-through' : 'text-muted-foreground'}`}>
                                                                                {milestone.description}
                                                                            </p>
                                                                        )}
                                                                        {milestone.dueDate && (
                                                                            <div className="flex items-center space-x-2 text-sm text-muted-foreground mt-2">
                                                                                <span className={`${milestone.completed ? 'text-muted-foreground line-through' : ''}`}>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                                                                                {new Date(milestone.dueDate) < new Date() && !milestone.completed && (
                                                                                    <span className="badge badge-destructive text-xs">Overdue</span>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {canManageMembers && (
                                                                        <div className="flex space-x-2 ml-4">
                                                                            <button
                                                                                onClick={() => handleEditMilestone(milestone)}
                                                                                className="btn btn-ghost btn-sm"
                                                                                title="Edit milestone"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={() => handleDeleteMilestone(milestone.id)}
                                                                                className="btn btn-ghost btn-sm text-destructive hover:bg-destructive/10"
                                                                                title="Delete milestone"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-muted-foreground mb-4">No milestones yet</p>
                                            {canManageMembers && (
                                                <button
                                                    onClick={() => setShowAddMilestone(true)}
                                                    className="btn btn-primary"
                                                >
                                                    Create First Milestone
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
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
                                        <UserAvatar
                                            user={project.owner}
                                            size="sm"
                                            clickable={true}
                                            showName={true}
                                        />
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
                                            <UserAvatar
                                                user={project.owner}
                                                size="sm"
                                                clickable={true}
                                                showName={true}
                                                className="flex items-center space-x-3"
                                            />
                                            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                                                Owner
                                            </span>
                                        </div>
                                    </div>

                                    {/* Members */}
                                    {project.members && project.members.length > 0 ? (
                                        <div className="space-y-3">
                                            {project.members.map((member) => (
                                                <div key={member.id} className="flex items-center justify-between">
                                                    <UserAvatar
                                                        user={member.user}
                                                        size="sm"
                                                        clickable={true}
                                                        showName={true}
                                                        className="flex items-center space-x-3"
                                                    />
                                                    <div className="text-xs text-muted-foreground">
                                                        Joined {new Date(member.joinedAt).toLocaleDateString()}
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
                                                                    title={`Add ${user.name || user.email} as project member`}
                                                                >
                                                                    <UserAvatar
                                                                        user={user}
                                                                        size="sm"
                                                                        clickable={false}
                                                                        showName={true}
                                                                    />
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
        </div>
    );
};

export default ProjectDetailPage;
