import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "~/utils/api";
import Loading from "~/components/Loading";
import Navbar from "~/components/Navbar";

type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";

const EditTaskPage: NextPage = () => {
    const router = useRouter();
    const { status } = useSession();
    const { id } = router.query;
    const taskId = id as string;

    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        priority: TaskPriority;
        status: TaskStatus;
        dueDate: string;
    }>({
        title: "",
        description: "",
        priority: "MEDIUM",
        status: "TODO",
        dueDate: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: task, isLoading } = api.task.getById.useQuery(
        { id: taskId },
        { enabled: !!taskId && status === "authenticated" }
    );

    const updateTaskMutation = api.task.update.useMutation({
        onSuccess: () => {
            void router.push(`/tasks/${taskId}`);
        },
        onError: (error: unknown) => {
            console.error("Error updating task:", error);
            setIsSubmitting(false);
        },
    });

    // Populate form when task data loads
    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description ?? "",
                priority: task.priority,
                status: task.status,
                dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0]! : "",
            });
        }
    }, [task]);

    if (status === "loading" || isLoading) return <Loading />;

    if (status === "unauthenticated") {
        void router.push("/auth/signin");
        return <Loading />;
    }

    if (!task) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-muted-foreground">Task not found</div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);

        const submitData = {
            id: taskId,
            title: formData.title,
            description: formData.description || undefined,
            priority: formData.priority,
            status: formData.status,
            dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
        };

        updateTaskMutation.mutate(submitData);
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-4 mb-4">
                        <Link
                            href={`/tasks/${taskId}`}
                            className="btn btn-ghost"
                        >
                            ← Back to Task
                        </Link>
                        <Link
                            href="/tasks"
                            className="btn btn-ghost"
                        >
                            All Tasks
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground">Edit Task</h1>
                    <p className="text-muted-foreground mt-2">Update task details and track progress.</p>
                </div>

                {/* Form */}
                <div className="max-w-2xl mx-auto">
                    <div className="card p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Task Title */}
                            <div>
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

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="label">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="textarea"
                                    placeholder="Describe the task requirements and details"
                                />
                            </div>

                            {/* Priority and Status */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="priority" className="label">
                                        Priority
                                    </label>
                                    <select
                                        id="priority"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof formData.priority })}
                                        className="select"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="URGENT">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="status" className="label">
                                        Status
                                    </label>
                                    <select
                                        id="status"
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                                        className="select"
                                    >
                                        <option value="TODO">Todo</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="REVIEW">Review</option>
                                        <option value="COMPLETED">Completed</option>
                                    </select>
                                </div>
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

                            {/* Submit Buttons */}
                            <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                                <Link
                                    href={`/tasks/${taskId}`}
                                    className="btn btn-outline"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formData.title.trim()}
                                    className="btn btn-primary"
                                >
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Error Display */}
                {updateTaskMutation.error && (
                    <div className="mt-6 max-w-2xl mx-auto">
                        <div className="card bg-destructive/5 border-destructive/20 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-destructive">
                                        Error updating task
                                    </h3>
                                    <div className="mt-2 text-sm text-destructive/80">
                                        <p>{updateTaskMutation.error.message}</p>
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

export default EditTaskPage;
