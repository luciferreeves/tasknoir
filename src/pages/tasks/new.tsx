import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { api } from "~/utils/api";
import Loading from "~/components/Loading";
import Navbar from "~/components/Navbar";
import WysiwygEditor from "~/components/WysiwygEditor";
import TagInput from "~/components/TagInput";

interface ProjectType {
    id: string;
    title: string;
}

interface UserType {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: string;
}

interface TaskType {
    id: string;
    title: string;
    status: string;
}

interface Tag {
    id: string;
    name: string;
    color?: string | null;
}

const NewTaskPage: NextPage = () => {
    const router = useRouter();
    const { status } = useSession();
    const projectId = router.query.projectId as string | undefined;

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        projectId: projectId ?? "",
        parentTaskId: "",
        priority: "MEDIUM" as const,
        status: "TODO" as const,
        dueDate: "",
        estimatedHours: "",
        categoryIds: [] as string[],
        tagIds: [] as string[],
        dependencyIds: [] as string[],
        assigneeIds: [] as string[],
    });

    const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Queries
    const {
        data: projects,
        isLoading: projectsLoading
    } = api.project.getAll.useQuery(undefined, {
        enabled: status === "authenticated",
    });

    const {
        data: users,
        isLoading: usersLoading
    } = api.user.getAll.useQuery(undefined, {
        enabled: status === "authenticated",
    });

    // Query potential parent tasks when a project is selected
    const {
        data: potentialParentTasks,
        isLoading: parentTasksLoading
    } = api.task.getAll.useQuery(
        { projectId: formData.projectId },
        {
            enabled: status === "authenticated" && !!formData.projectId,
            refetchOnWindowFocus: false,
        }
    );

    const createTaskMutation = api.task.create.useMutation({
        onSuccess: (data: unknown) => {
            if (data && typeof data === 'object' && 'id' in data) {
                void router.push(`/tasks/${(data as { id: string }).id}`);
            }
        },
        onError: (error: unknown) => {
            console.error("Error creating task:", error);
            setIsSubmitting(false);
        },
    });

    if (status === "loading") return <Loading />;

    if (status === "unauthenticated") {
        void router.push("/auth/signin");
        return <Loading />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !formData.projectId) return;

        setIsSubmitting(true);

        const submitData = {
            title: formData.title,
            description: formData.description ?? undefined,
            projectId: formData.projectId,
            parentTaskId: formData.parentTaskId || undefined,
            priority: formData.priority,
            status: formData.status,
            dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
            estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
            assigneeIds: formData.assigneeIds.length > 0 ? formData.assigneeIds : undefined,
            tagIds: selectedTags.length > 0 ? selectedTags.map(tag => tag.id) : undefined,
            categoryIds: formData.categoryIds.length > 0 ? formData.categoryIds : undefined,
            dependencyIds: formData.dependencyIds.length > 0 ? formData.dependencyIds : undefined,
        };

        createTaskMutation.mutate(submitData);
    };

    const projectsList = (projects as ProjectType[] | undefined) ?? [];
    const usersList = (users as UserType[] | undefined) ?? [];
    const parentTasksList = (potentialParentTasks as TaskType[] | undefined) ?? [];

    return (
        <>
            <Head>
                <title>Create New Task | Task Management</title>
                <meta name="description" content="Create a new task to organize your work and track progress" />
            </Head>
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center space-x-4 mb-4">
                            <Link
                                href={formData.projectId ? `/projects/${formData.projectId}` : "/tasks"}
                                className="btn btn-ghost"
                            >
                                ← Back to {formData.projectId ? "Project" : "Tasks"}
                            </Link>
                        </div>
                        <h1 className="text-3xl font-bold text-foreground">Create New Task</h1>
                        <p className="text-muted-foreground mt-2">Add a new task to organize your work and track progress.</p>
                    </div>

                    {/* Form */}
                    <div className="max-w-4xl mx-auto">
                        <div className="card p-8">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                {/* Basic Information */}
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                                        Basic Information
                                    </h3>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="lg:col-span-2">
                                            <label htmlFor="title" className="label">
                                                Task Title *
                                            </label>
                                            <input
                                                type="text"
                                                id="title"
                                                required
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="input"
                                                placeholder="Enter task title"
                                            />
                                        </div>

                                        <div className="lg:col-span-2">
                                            <label htmlFor="description" className="label">
                                                Description
                                            </label>
                                            <WysiwygEditor
                                                content={formData.description}
                                                onChange={(value) => setFormData({ ...formData, description: value })}
                                                placeholder="Describe the task requirements and objectives..."
                                                height={200}
                                            />
                                        </div>

                                        {/* Project Selection */}
                                        <div>
                                            <label htmlFor="projectId" className="label">
                                                Project *
                                            </label>
                                            <select
                                                id="projectId"
                                                required
                                                value={formData.projectId}
                                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value, parentTaskId: "" })}
                                                className="select"
                                                aria-label="Select project"
                                            >
                                                <option value="">Select a project</option>
                                                {!projectsLoading && projectsList.map((project) => (
                                                    <option key={project.id} value={project.id}>
                                                        {project.title}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Parent Task Selection */}
                                        {formData.projectId && (
                                            <div>
                                                <label htmlFor="parentTaskId" className="label">
                                                    Parent Task (Optional)
                                                </label>
                                                <select
                                                    id="parentTaskId"
                                                    value={formData.parentTaskId}
                                                    onChange={(e) => setFormData({ ...formData, parentTaskId: e.target.value })}
                                                    className="select"
                                                    aria-label="Select parent task"
                                                    disabled={parentTasksLoading}
                                                >
                                                    <option value="">No parent task (create as main task)</option>
                                                    {!parentTasksLoading && parentTasksList
                                                        .filter(task => task.status !== "COMPLETED") // Filter out completed tasks
                                                        .map((task) => (
                                                            <option key={task.id} value={task.id}>
                                                                {task.title}
                                                            </option>
                                                        ))}
                                                </select>
                                                {parentTasksLoading && (
                                                    <p className="mt-1 text-xs text-muted-foreground">Loading available tasks...</p>
                                                )}
                                                {!parentTasksLoading && parentTasksList.length === 0 && (
                                                    <p className="mt-1 text-xs text-muted-foreground">No tasks available in this project yet</p>
                                                )}
                                            </div>
                                        )}

                                        {/* Priority */}
                                        <div>
                                            <label htmlFor="priority" className="label">
                                                Priority
                                            </label>
                                            <select
                                                id="priority"
                                                value={formData.priority}
                                                onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof formData.priority })}
                                                className="select"
                                                aria-label="Select task priority"
                                            >
                                                <option value="LOW">Low</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HIGH">High</option>
                                                <option value="URGENT">Urgent</option>
                                            </select>
                                        </div>

                                        {/* Due Date */}
                                        <div>
                                            <label htmlFor="dueDate" className="label">
                                                Due Date
                                            </label>
                                            <input
                                                type="date"
                                                id="dueDate"
                                                value={formData.dueDate}
                                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                                className="input"
                                            />
                                        </div>

                                        {/* Estimated Hours */}
                                        <div>
                                            <label htmlFor="estimatedHours" className="label">
                                                Estimated Hours
                                            </label>
                                            <input
                                                type="number"
                                                id="estimatedHours"
                                                min="0"
                                                step="0.5"
                                                value={formData.estimatedHours}
                                                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                                                className="input"
                                                placeholder="e.g., 2.5"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tags */}
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                                        Tags
                                    </h3>
                                    <div>
                                        <label className="label">
                                            Tags
                                        </label>
                                        <TagInput
                                            selectedTags={selectedTags}
                                            onTagsChange={setSelectedTags}
                                            placeholder="Search or create tags..."
                                        />
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Add tags to categorize and organize your task
                                        </p>
                                    </div>
                                </div>

                                {/* Assignees & Team */}
                                {!usersLoading && usersList.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground mb-4 pb-2 border-b border-border">
                                            Team Assignment
                                        </h3>
                                        <div>
                                            <label className="label">
                                                Assign To
                                            </label>
                                            <select
                                                multiple
                                                aria-label="Select assignees"
                                                value={formData.assigneeIds}
                                                onChange={(e) => {
                                                    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                                    setFormData({ ...formData, assigneeIds: selectedOptions });
                                                }}
                                                className="select h-32"
                                            >
                                                {usersList.map((user) => (
                                                    <option key={user.id} value={user.id}>
                                                        {user.name} ({user.email}) {user.role === "ADMIN" ? "[Admin]" : ""}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="mt-1 text-xs text-muted-foreground">Hold Ctrl/Cmd to select multiple users</p>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Buttons */}
                                <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                                    <Link
                                        href={formData.projectId ? `/projects/${formData.projectId}` : "/tasks"}
                                        className="btn btn-outline"
                                    >
                                        Cancel
                                    </Link>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !formData.title.trim() || !formData.projectId}
                                        className="btn btn-primary"
                                    >
                                        {isSubmitting ? "Creating..." : "Create Task"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Error Display */}
                    {createTaskMutation.error && (
                        <div className="mt-6 max-w-4xl mx-auto">
                            <div className="card bg-destructive/5 border-destructive/20 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-destructive">
                                            Error creating task
                                        </h3>
                                        <div className="mt-2 text-sm text-destructive/80">
                                            <p>{createTaskMutation.error.message}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default NewTaskPage;
