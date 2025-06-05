import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { api } from "~/utils/api";
import Loading from "~/components/Loading";
import Navbar from "~/components/Navbar";

interface ProjectType {
    id: string;
    title: string;
}

interface UserType {
    id: string;
    name: string;
    email: string;
}

interface CategoryType {
    id: string;
    name: string;
}

interface TagType {
    id: string;
    name: string;
}

interface TaskType {
    id: string;
    title: string;
}

const NewTaskPage: NextPage = () => {
    const router = useRouter();
    const { status } = useSession();
    const projectId = router.query.projectId as string | undefined;

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        projectId: projectId ?? "",
        priority: "MEDIUM" as const,
        status: "TODO" as const,
        dueDate: "",
        estimatedHours: "",
        categoryIds: [] as string[],
        tagIds: [] as string[],
        dependencyIds: [] as string[],
        assigneeIds: [] as string[],
    });

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

    // Type-safe mock data for categories and tags since the API might not be implemented yet
    const categories: CategoryType[] = [];
    const categoriesLoading = false;

    const tags: TagType[] = [];
    const tagsLoading = false;

    const {
        data: tasks,
        isLoading: tasksLoading
    } = api.task.getAll.useQuery({
        projectId: formData.projectId ?? undefined
    }, {
        enabled: status === "authenticated" && !!formData.projectId,
    });

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

    const toggleCategory = (categoryId: string) => {
        setFormData(prev => ({
            ...prev,
            categoryIds: prev.categoryIds.includes(categoryId)
                ? prev.categoryIds.filter(id => id !== categoryId)
                : [...prev.categoryIds, categoryId]
        }));
    };

    const toggleTag = (tagId: string) => {
        setFormData(prev => ({
            ...prev,
            tagIds: prev.tagIds.includes(tagId)
                ? prev.tagIds.filter(id => id !== tagId)
                : [...prev.tagIds, tagId]
        }));
    };

    const toggleDependency = (taskId: string) => {
        setFormData(prev => ({
            ...prev,
            dependencyIds: prev.dependencyIds.includes(taskId)
                ? prev.dependencyIds.filter(id => id !== taskId)
                : [...prev.dependencyIds, taskId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting || !formData.projectId) return;

        setIsSubmitting(true);

        const submitData = {
            title: formData.title,
            description: formData.description ?? undefined,
            projectId: formData.projectId,
            priority: formData.priority,
            status: formData.status,
            dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
            estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
            assigneeIds: formData.assigneeIds.length > 0 ? formData.assigneeIds : undefined,
            tagIds: formData.tagIds.length > 0 ? formData.tagIds : undefined,
            categoryIds: formData.categoryIds.length > 0 ? formData.categoryIds : undefined,
            dependencyIds: formData.dependencyIds.length > 0 ? formData.dependencyIds : undefined,
        };

        createTaskMutation.mutate(submitData);
    };

    const projectsList = (projects as ProjectType[] | undefined) ?? [];
    const usersList = (users as UserType[] | undefined) ?? [];
    const categoriesList = (categories as CategoryType[] | undefined) ?? [];
    const tagsList = (tags as TagType[] | undefined) ?? [];
    const tasksList = (tasks as TaskType[] | undefined) ?? [];

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-4 mb-4">
                        <Link
                            href={formData.projectId ? `/projects/${formData.projectId}` : "/tasks"}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            ← Back to {formData.projectId ? "Project" : "Tasks"}
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Create New Task</h1>
                    <p className="text-gray-600 mt-2">Add a new task to organize your work and track progress.</p>
                </div>

                {/* Form */}
                <div className="max-w-4xl">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="lg:col-span-2">
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                        Task Title *
                                    </label>
                                    <input
                                        type="text"
                                        id="title"
                                        required
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Enter task title"
                                    />
                                </div>

                                <div className="lg:col-span-2">
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        rows={4}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Describe the task requirements and objectives"
                                    />
                                </div>

                                {/* Project Selection */}
                                <div>
                                    <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
                                        Project *
                                    </label>
                                    <select
                                        id="projectId"
                                        required
                                        value={formData.projectId}
                                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                                {/* Priority */}
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                                        Priority
                                    </label>
                                    <select
                                        id="priority"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof formData.priority })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        id="dueDate"
                                        value={formData.dueDate}
                                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Estimated Hours */}
                                <div>
                                    <label htmlFor="estimatedHours" className="block text-sm font-medium text-gray-700 mb-2">
                                        Estimated Hours
                                    </label>
                                    <input
                                        type="number"
                                        id="estimatedHours"
                                        min="0"
                                        step="0.5"
                                        value={formData.estimatedHours}
                                        onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g., 2.5"
                                    />
                                </div>
                            </div>

                            {/* Assignees */}
                            {!usersLoading && usersList.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
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
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                                    >
                                        {usersList.map((user) => (
                                            <option key={user.id} value={user.id}>
                                                {user.name} ({user.email})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">Hold Ctrl/Cmd to select multiple users</p>
                                </div>
                            )}

                            {/* Categories */}
                            {!categoriesLoading && categoriesList.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Categories
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {categoriesList.map((category) => (
                                            <label key={category.id} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.categoryIds.includes(category.id)}
                                                    onChange={() => toggleCategory(category.id)}
                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-900">{category.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tags */}
                            {!tagsLoading && tagsList.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Tags
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {tagsList.map((tag) => (
                                            <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.tagIds.includes(tag.id)}
                                                    onChange={() => toggleTag(tag.id)}
                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-900">{tag.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Dependencies */}
                            {!tasksLoading && tasksList.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Dependencies (tasks that must be completed first)
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                                        {tasksList.map((task) => (
                                            <label key={task.id} className="flex items-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.dependencyIds.includes(task.id)}
                                                    onChange={() => toggleDependency(task.id)}
                                                    className="rounded text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-900">{task.title}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Submit Buttons */}
                            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                                <Link
                                    href={formData.projectId ? `/projects/${formData.projectId}` : "/tasks"}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formData.title.trim() || !formData.projectId}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? "Creating..." : "Create Task"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Error Display */}
                {createTaskMutation.error && (
                    <div className="mt-4 max-w-4xl">
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        Error creating task
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{createTaskMutation.error.message}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewTaskPage;
