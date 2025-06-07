import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Head from "next/head";
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
            <>
                <Head>
                    <title>Task Error - Task Noir</title>
                    <meta name="description" content="Error loading task" />
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <div className="min-h-screen bg-background">
                    <Navbar />
                    <div className="container mx-auto px-4 py-8">
                        <div className="card text-center p-8">
                            <div className="text-6xl mb-4">⚠️</div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Error Loading Task</h2>
                            <p className="text-destructive mb-6">
                                {error.message ?? "Something went wrong while loading the task"}
                            </p>
                            <Link href="/tasks" className="btn btn-primary">
                                Back to Tasks
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    if (!task) {
        return (
            <>
                <Head>
                    <title>Task Not Found - Task Noir</title>
                    <meta name="description" content="Task not found" />
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <div className="min-h-screen bg-background">
                    <Navbar />
                    <div className="container mx-auto px-4 py-8">
                        <div className="card text-center p-8">
                            <div className="text-6xl mb-4">🔍</div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Task Not Found</h2>
                            <p className="text-muted-foreground mb-6">
                                The task you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
                            </p>
                            <Link href="/tasks" className="btn btn-primary">
                                Back to Tasks
                            </Link>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "TODO": return "bg-muted text-muted-foreground";
            case "IN_PROGRESS": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            case "REVIEW": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            case "COMPLETED": return "bg-success/10 text-success";
            default: return "bg-muted text-muted-foreground";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "URGENT": return "bg-destructive/10 text-destructive";
            case "HIGH": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
            case "MEDIUM": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            case "LOW": return "bg-success/10 text-success";
            default: return "bg-muted text-muted-foreground";
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
        <>
            <Head>
                <title>{task.title} - Task Noir</title>
                <meta name="description" content={task.description ?? "Task details"} />
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
                                    href="/tasks"
                                    className="btn btn-ghost"
                                >
                                    ← Back to Tasks
                                </Link>
                                {task.project && (
                                    <Link
                                        href={`/projects/${task.project.id}`}
                                        className="btn btn-ghost"
                                    >
                                        View Project
                                    </Link>
                                )}
                            </div>
                            <div className="flex space-x-2">
                                <Link
                                    href={`/tasks/${task.id}/edit`}
                                    className="btn btn-primary"
                                >
                                    Edit Task
                                </Link>
                            </div>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-foreground mb-2">{task.title}</h1>

                    <div className="flex items-center space-x-4 mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                            {task.status.replace('_', ' ')}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </span>
                        {task.dueDate && (
                            <span className="text-sm text-muted-foreground">
                                Due: {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Description */}
                            <div className="card">
                                <div className="p-6 border-b border-border">
                                    <h2 className="text-xl font-semibold text-foreground">Description</h2>
                                </div>
                                <div className="p-6">
                                    {task.description ? (
                                        <div className="prose max-w-none">
                                            <p className="text-foreground whitespace-pre-wrap">{task.description}</p>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground italic">No description provided</p>
                                    )}
                                </div>
                            </div>

                            {/* Comments */}
                            <div className="card">
                                <div className="p-6 border-b border-border">
                                    <h2 className="text-xl font-semibold text-foreground">
                                        Comments ({task.comments?.length ?? 0})
                                    </h2>
                                </div>
                                <div className="p-6">
                                    {task.comments && task.comments.length > 0 ? (
                                        <div className="space-y-4">
                                            {task.comments.map((comment) => (
                                                <div key={comment.id} className="border-l-4 border-primary/30 pl-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="font-medium text-foreground">
                                                            {comment.author.name ?? comment.author.email}
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {formatDate(comment.createdAt)}
                                                        </span>
                                                    </div>
                                                    <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">No comments yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Attachments */}
                            {task.attachments && task.attachments.length > 0 && (
                                <div className="card">
                                    <div className="p-6 border-b border-border">
                                        <h2 className="text-xl font-semibold text-foreground">
                                            Attachments ({task.attachments.length})
                                        </h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-3">
                                            {task.attachments.map((attachment) => (
                                                <div key={attachment.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                                                            <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">{attachment.filename}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {attachment.fileSize && `${Math.round(attachment.fileSize / 1024)} KB`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={attachment.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:text-primary/80 text-sm font-medium"
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
                                <div className="card">
                                    <div className="p-6 border-b border-border">
                                        <h2 className="text-xl font-semibold text-foreground">Time Tracking</h2>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-3">
                                            {task.timeEntries.map((entry) => (
                                                <div key={entry.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-foreground">
                                                            {entry.user.name ?? entry.user.email}
                                                        </p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDate(entry.startTime)} - {entry.endTime ? formatDate(entry.endTime) : 'In Progress'}
                                                        </p>
                                                        {entry.description && (
                                                            <p className="text-sm text-muted-foreground mt-1">{entry.description}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium text-foreground">
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
                            <div className="card">
                                <div className="p-6 border-b border-border">
                                    <h3 className="text-lg font-semibold text-foreground">Task Info</h3>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Assignee</span>
                                        <p className="text-foreground">
                                            {task.assignments && task.assignments.length > 0
                                                ? (task.assignments[0]?.user.name ?? task.assignments[0]?.user.email)
                                                : 'Unassigned'
                                            }
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Creator</span>
                                        <p className="text-foreground">{task.user?.name ?? task.user?.email ?? 'Unknown'}</p>
                                    </div>
                                    {task.project && (
                                        <div>
                                            <span className="text-sm font-medium text-muted-foreground">Project</span>
                                            <Link
                                                href={`/projects/${task.project.id}`}
                                                className="block text-primary hover:text-primary/80"
                                            >
                                                {task.project.title}
                                            </Link>
                                        </div>
                                    )}
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Created</span>
                                        <p className="text-foreground">{formatDate(task.createdAt)}</p>
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                                        <p className="text-foreground">{formatDate(task.updatedAt)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Categories */}
                            {task.categories && task.categories.length > 0 && (
                                <div className="card">
                                    <div className="p-6 border-b border-border">
                                        <h3 className="text-lg font-semibold text-foreground">Categories</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex flex-wrap gap-2">
                                            {task.categories.map((category) => (
                                                <span
                                                    key={category.id}
                                                    className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm"
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
                                <div className="card">
                                    <div className="p-6 border-b border-border">
                                        <h3 className="text-lg font-semibold text-foreground">Tags</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="flex flex-wrap gap-2">
                                            {task.tags.map((tag) => (
                                                <span
                                                    key={tag.id}
                                                    className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
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
                                <div className="card">
                                    <div className="p-6 border-b border-border">
                                        <h3 className="text-lg font-semibold text-foreground">Subtasks</h3>
                                    </div>
                                    <div className="p-6">
                                        <div className="space-y-2">
                                            {task.subTasks.map((subtask) => (
                                                <Link
                                                    key={subtask.id}
                                                    href={`/tasks/${subtask.id}`}
                                                    className="block p-2 border border-border rounded hover:bg-muted/50 transition-colors"
                                                >
                                                    <p className="font-medium text-foreground">{subtask.title}</p>
                                                    <p className="text-sm text-muted-foreground">
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
        </>
    );
};

export default TaskDetailPage;
