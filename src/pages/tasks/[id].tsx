import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "~/utils/api";
import Loading from "~/components/Loading";
import Navbar from "~/components/Navbar";

// Type definitions based on actual Prisma schema
interface UserType {
    id: string;
    name: string;
    email: string;
}

interface ProjectType {
    id: string;
    title: string;
}

interface TaskAssignmentType {
    id: string;
    user: UserType;
}

interface TaskCommentType {
    id: string;
    content: string;
    author: UserType;
    createdAt: Date;
}

interface TaskAttachmentType {
    id: string;
    filename: string;
    url: string;
    fileSize?: number;
}

interface TaskTimeEntryType {
    id: string;
    description?: string;
    startTime: Date;
    endTime?: Date;
    duration?: number;
    user: UserType;
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
    description: string | null;
    dueDate: Date | null;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
    userId: string | null;
    user: UserType | null;
    projectId: string | null;
    project: ProjectType | null;
    parentTaskId: string | null;
    assignments: TaskAssignmentType[];
    comments?: TaskCommentType[];
    attachments?: TaskAttachmentType[];
    timeEntries?: TaskTimeEntryType[];
    categories?: CategoryType[];
    tags?: TagType[];
    subTasks?: TaskType[];
    createdAt: Date;
    updatedAt: Date;
}

interface ApiError {
    message?: string;
}

const TaskDetailPage: NextPage = () => {
    const router = useRouter();
    const { status } = useSession();
    const { id } = router.query;

    const taskQuery = api.task.getById.useQuery(
        { id: id as string },
        { enabled: !!id && status === "authenticated" }
    );

    const task = taskQuery.data as TaskType | undefined;
    const isLoading = taskQuery.isLoading;
    const error = taskQuery.error as ApiError | undefined;

    if (status === "loading" || isLoading) return <Loading />;

    if (status === "unauthenticated") {
        void router.push("/auth/signin");
        return <Loading />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-red-600">
                        Error loading task: {error.message}
                    </div>
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-gray-600">Task not found</div>
                </div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "TODO": return "bg-gray-100 text-gray-800";
            case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
            case "REVIEW": return "bg-yellow-100 text-yellow-800";
            case "COMPLETED": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "URGENT": return "bg-red-100 text-red-800";
            case "HIGH": return "bg-orange-100 text-orange-800";
            case "MEDIUM": return "bg-yellow-100 text-yellow-800";
            case "LOW": return "bg-green-100 text-green-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/tasks"
                                className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                                ← Back to Tasks
                            </Link>
                            {task.project && (
                                <Link
                                    href={`/projects/${task.project.id}`}
                                    className="text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    View Project
                                </Link>
                            )}
                        </div>
                        <div className="flex space-x-2">
                            <Link
                                href={`/tasks/${task.id}/edit`}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                Edit Task
                            </Link>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>

                    <div className="flex items-center space-x-4 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </span>
                        {task.dueDate && (
                            <span className="text-sm text-gray-600">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Description */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">Description</h2>
                            </div>
                            <div className="p-6">
                                {task.description ? (
                                    <div className="prose max-w-none">
                                        <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">No description provided</p>
                                )}
                            </div>
                        </div>

                        {/* Comments */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Comments ({task.comments?.length ?? 0})
                                </h2>
                            </div>
                            <div className="p-6">
                                {task.comments && task.comments.length > 0 ? (
                                    <div className="space-y-4">
                                        {task.comments.map((comment) => (
                                            <div key={comment.id} className="border-l-4 border-blue-200 pl-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-gray-900">
                                                        {comment.author.name ?? comment.author.email}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {formatDate(comment.createdAt)}
                                                    </span>
                                                </div>
                                                <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No comments yet</p>
                                )}
                            </div>
                        </div>

                        {/* Attachments */}
                        {task.attachments && task.attachments.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Attachments ({task.attachments.length})
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3">
                                        {task.attachments.map((attachment) => (
                                            <div key={attachment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{attachment.filename}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {attachment.fileSize && `${Math.round(attachment.fileSize / 1024)} KB`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <a
                                                    href={attachment.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    Download
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Time Tracking */}
                        {task.timeEntries && task.timeEntries.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="p-6 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Time Tracking</h2>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3">
                                        {task.timeEntries.map((entry) => (
                                            <div key={entry.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {entry.user.name ?? entry.user.email}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatDate(entry.startTime)} - {entry.endTime ? formatDate(entry.endTime) : 'In Progress'}
                                                    </p>
                                                    {entry.description && (
                                                        <p className="text-sm text-gray-600 mt-1">{entry.description}</p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900">
                                                        {entry.duration ? `${Math.round(entry.duration / 60)} min` : 'Active'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Task Info */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-6 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">Task Info</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Assignee</span>
                                    <p className="text-gray-900">
                                        {task.assignments && task.assignments.length > 0
                                            ? (task.assignments[0]?.user.name ?? task.assignments[0]?.user.email)
                                            : 'Unassigned'
                                        }
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Creator</span>
                                    <p className="text-gray-900">{task.user?.name ?? task.user?.email ?? 'Unknown'}</p>
                                </div>
                                {task.project && (
                                    <div>
                                        <span className="text-sm font-medium text-gray-700">Project</span>
                                        <Link
                                            href={`/projects/${task.project.id}`}
                                            className="block text-blue-600 hover:text-blue-800"
                                        >
                                            {task.project.title}
                                        </Link>
                                    </div>
                                )}
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Created</span>
                                    <p className="text-gray-900">{formatDate(task.createdAt)}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-700">Last Updated</span>
                                    <p className="text-gray-900">{formatDate(task.updatedAt)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Categories */}
                        {task.categories && task.categories.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Categories</h3>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-wrap gap-2">
                                        {task.categories.map((category) => (
                                            <span
                                                key={category.id}
                                                className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                                            >
                                                {category.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {task.tags && task.tags.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-wrap gap-2">
                                        {task.tags.map((tag) => (
                                            <span
                                                key={tag.id}
                                                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                                            >
                                                {tag.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Note: Dependencies not implemented in current schema */}

                        {/* Subtasks */}
                        {task.subTasks && task.subTasks.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-semibold text-gray-900">Subtasks</h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-2">
                                        {task.subTasks.map((subtask) => (
                                            <Link
                                                key={subtask.id}
                                                href={`/tasks/${subtask.id}`}
                                                className="block p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                                            >
                                                <p className="font-medium text-gray-900">{subtask.title}</p>
                                                <p className="text-sm text-gray-500">
                                                    Status: {subtask.status.replace('_', ' ')}
                                                </p>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailPage;
