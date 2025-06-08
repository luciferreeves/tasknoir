import { useState } from "react";
import Link from "next/link";
import { api } from "~/utils/api";
import { useSession } from "next-auth/react";

type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface SubTask {
    id: string;
    title: string;
    status: TaskStatus;
    priority?: TaskPriority;
    dueDate?: Date | null;
    assigneeCount?: number;
}

interface SubtaskManagementProps {
    taskId: string;
    projectId: string;
    subTasks: SubTask[];
    onRefresh: () => void;
}

const SubtaskManagement: React.FC<SubtaskManagementProps> = ({
    taskId,
    projectId,
    subTasks,
    onRefresh,
}) => {
    const { data: session } = useSession();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const createSubtaskMutation = api.task.create.useMutation({
        onSuccess: () => {
            setNewSubtaskTitle("");
            setShowCreateForm(false);
            setIsCreating(false);
            onRefresh();
        },
        onError: (error) => {
            console.error("Error creating subtask:", error);
            setIsCreating(false);
        },
    });

    const handleCreateSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim() || isCreating) return;

        setIsCreating(true);
        await createSubtaskMutation.mutateAsync({
            title: newSubtaskTitle.trim(),
            description: "",
            projectId,
            parentTaskId: taskId,
            priority: "MEDIUM",
            status: "TODO",
        });
    };

    const getStatusColor = (status: TaskStatus) => {
        switch (status) {
            case "TODO": return "bg-gray-100 text-gray-800";
            case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
            case "REVIEW": return "bg-yellow-100 text-yellow-800";
            case "COMPLETED": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getPriorityColor = (priority: TaskPriority) => {
        switch (priority) {
            case "LOW": return "bg-green-100 text-green-800";
            case "MEDIUM": return "bg-yellow-100 text-yellow-800";
            case "HIGH": return "bg-orange-100 text-orange-800";
            case "URGENT": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const completedSubtasks = subTasks.filter(task => task.status === "COMPLETED").length;
    const totalSubtasks = subTasks.length;
    const progressPercentage = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

    return (
        <div className="card">
            <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">
                            Subtasks ({totalSubtasks})
                        </h3>
                        {totalSubtasks > 0 && (
                            <div className="mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progressPercentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-muted-foreground">
                                        {completedSubtasks}/{totalSubtasks} completed
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                    {session && (
                        <button
                            onClick={() => setShowCreateForm(!showCreateForm)}
                            className="btn btn-primary"
                        >
                            {showCreateForm ? "Cancel" : "Add Subtask"}
                        </button>
                    )}
                </div>
            </div>

            <div className="p-6">
                {/* Create Subtask Form */}
                {showCreateForm && (
                    <form onSubmit={handleCreateSubtask} className="mb-6 p-4 border border-border rounded-lg bg-muted/30">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                placeholder="Enter subtask title..."
                                className="flex-1 input"
                                autoFocus
                                disabled={isCreating}
                            />
                            <button
                                type="submit"
                                disabled={!newSubtaskTitle.trim() || isCreating}
                                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreating ? "Creating..." : "Create"}
                            </button>
                        </div>
                    </form>
                )}

                {/* Subtasks List */}
                {subTasks.length > 0 ? (
                    <div className="space-y-3">
                        {subTasks.map((subtask) => (
                            <div
                                key={subtask.id}
                                className="p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <Link
                                            href={`/tasks/${subtask.id}`}
                                            className="text-foreground hover:text-primary transition-colors"
                                        >
                                            <h4 className="font-medium mb-2">{subtask.title}</h4>
                                        </Link>

                                        <div className="flex items-center gap-3 text-sm">
                                            <span className={`px-2 py-1 rounded-full ${getStatusColor(subtask.status)}`}>
                                                {subtask.status.replace('_', ' ')}
                                            </span>

                                            {subtask.priority && (
                                                <span className={`px-2 py-1 rounded-full ${getPriorityColor(subtask.priority)}`}>
                                                    {subtask.priority}
                                                </span>
                                            )}

                                            {subtask.dueDate && (
                                                <span className="text-muted-foreground">
                                                    Due: {new Date(subtask.dueDate).toLocaleDateString()}
                                                </span>
                                            )}

                                            {subtask.assigneeCount && subtask.assigneeCount > 0 && (
                                                <span className="text-muted-foreground">
                                                    {subtask.assigneeCount} assignee{subtask.assigneeCount > 1 ? 's' : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <Link
                                            href={`/tasks/${subtask.id}`}
                                            className="text-sm text-primary hover:text-primary/80"
                                        >
                                            View
                                        </Link>
                                        <Link
                                            href={`/tasks/${subtask.id}/edit`}
                                            className="text-sm text-muted-foreground hover:text-foreground"
                                        >
                                            Edit
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        {showCreateForm ? (
                            <p>Enter a title above to create your first subtask</p>
                        ) : (
                            <div>
                                <p>No subtasks yet</p>
                                {session && (
                                    <p className="text-sm mt-1">Click &quot;Add Subtask&quot; to break this task into smaller parts</p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubtaskManagement;
