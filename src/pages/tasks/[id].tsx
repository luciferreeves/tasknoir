import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Head from "next/head";
import { api } from "~/utils/api";
import Loading from "~/components/Loading";
import Navbar from "~/components/Navbar";
import UserAvatar from "~/components/UserAvatar";
import WysiwygEditor from "~/components/WysiwygEditor";
import TaskComments from "~/components/TaskComments";
import TaskAttachments from "~/components/TaskAttachments";

// Type definitions based on actual Prisma schema
interface UserType {
    id: string;
    name: string;
    email: string;
    image?: string | null;
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
    user: UserType;
    createdAt: Date;
}

interface TaskAttachmentType {
    id: string;
    filename: string;
    fileUrl: string;
    fileSize?: number | null;
    mimeType?: string | null;
    uploadedAt: Date;
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
            case "TODO": return "status-todo";
            case "IN_PROGRESS": return "status-in-progress";
            case "REVIEW": return "status-review";
            case "COMPLETED": return "status-completed";
            default: return "status-todo";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "URGENT": return "priority-urgent";
            case "HIGH": return "priority-high";
            case "MEDIUM": return "priority-medium";
            case "LOW": return "priority-low";
            default: return "priority-medium";
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

                    <div className="flex items-center gap-2 mb-4">
                        <span className={getStatusColor(task.status)}>
                            {task.status.replace('_', ' ')}
                        </span>
                        <span className={getPriorityColor(task.priority)}>
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
                                    <WysiwygEditor
                                        content={task.description ?? ''}
                                        onChange={() => undefined} // Read-only
                                        editable={false}
                                    />
                                </div>
                            </div>

                            {/* Attachments */}
                            <div className="card">
                                <div className="p-6 border-b border-border">
                                    <h2 className="text-xl font-semibold text-foreground">
                                        Attachments ({task.attachments?.length ?? 0})
                                    </h2>
                                </div>
                                <div className="p-6">
                                    <TaskAttachments
                                        taskId={task.id}
                                        attachments={task.attachments ?? []}
                                    />
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
                                    <TaskComments
                                        taskId={task.id}
                                        comments={task.comments ?? []}
                                    />
                                </div>
                            </div>

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
                                                        <UserAvatar
                                                            user={{
                                                                id: entry.user.id,
                                                                name: entry.user.name,
                                                                email: entry.user.email,
                                                                image: entry.user.image
                                                            }}
                                                            size="sm"
                                                            clickable={true}
                                                            showName={true}
                                                        />
                                                        <p className="text-sm text-muted-foreground mt-2">
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
                                        <span className="text-sm font-medium text-muted-foreground">
                                            {task.assignments && task.assignments.length > 1 ? 'Assignees' : 'Assignee'}
                                        </span>
                                        {task.assignments && task.assignments.length > 0 ? (
                                            <div className="space-y-2">
                                                {task.assignments.map((assignment) => (
                                                    <UserAvatar
                                                        key={assignment.id}
                                                        user={assignment.user}
                                                        size="sm"
                                                        clickable={true}
                                                        showName={true}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-muted-foreground">Unassigned</p>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Creator</span>
                                        {task.user ? (
                                            <UserAvatar
                                                user={{
                                                    id: task.user.id,
                                                    name: task.user.name,
                                                    email: task.user.email,
                                                    image: task.user.image
                                                }}
                                                size="sm"
                                                clickable={true}
                                                showName={true}
                                            />
                                        ) : (
                                            <p className="text-foreground">Unknown</p>
                                        )}
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
