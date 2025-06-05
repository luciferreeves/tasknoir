import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "~/components/Navbar";
import Loading from "~/components/Loading";
import { api } from "~/utils/api";

// Type definitions based on actual Prisma schema
type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface TaskUser {
    id: string;
    name: string;
    email: string;
}

interface TaskProject {
    id: string;
    title: string;
}

interface TaskAssignment {
    id: string;
    user: TaskUser;
}

interface TaskWithRelations {
    id: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
    project?: TaskProject | null;
    assignments?: TaskAssignment[];
    _count?: {
        comments: number;
        attachments: number;
        subTasks: number;
    };
}

export default function Tasks() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [filters, setFilters] = useState<{
        status: TaskStatus | undefined;
        priority: TaskPriority | undefined;
        assignedToMe: boolean;
    }>({
        status: undefined,
        priority: undefined,
        assignedToMe: false,
    });

    const { data: tasksData, isLoading } = api.task.getAll.useQuery(filters);
    const tasks = tasksData as TaskWithRelations[] | undefined;

    useEffect(() => {
        if (status === "loading") return;
        if (!session) {
            void router.push("/auth/signin");
            return;
        }
    }, [session, status, router]);

    if (status === "loading" || isLoading) {
        return <Loading />;
    }

    if (!session) {
        return <Loading />;
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "TODO": return "badge badge-secondary";
            case "IN_PROGRESS": return "badge badge-primary";
            case "REVIEW": return "badge badge-warning";
            case "COMPLETED": return "badge badge-success";
            default: return "badge badge-secondary";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "LOW": return "badge badge-success";
            case "MEDIUM": return "badge badge-warning";
            case "HIGH": return "badge badge-danger";
            case "URGENT": return "badge badge-destructive";
            default: return "badge badge-secondary";
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case "LOW": return "⬇️";
            case "MEDIUM": return "➡️";
            case "HIGH": return "⬆️";
            case "URGENT": return "🔥";
            default: return "➡️";
        }
    };

    return (
        <>
            <Head>
                <title>Tasks - Task Noir</title>
                <meta name="description" content="Your tasks dashboard" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    <div className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-foreground mb-2">
                                Tasks ✅
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Manage and track all your tasks
                            </p>
                        </div>
                        <Link
                            href="/tasks/new"
                            className="btn btn-primary"
                        >
                            ➕ New Task
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="card mb-6">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div>
                                <label className="label">Status</label>
                                <select
                                    value={filters.status ?? ""}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        status: (e.target.value as TaskStatus) || undefined
                                    }))}
                                    className="select"
                                    aria-label="Filter by status"
                                >
                                    <option value="">All Status</option>
                                    <option value="TODO">To Do</option>
                                    <option value="IN_PROGRESS">In Progress</option>
                                    <option value="REVIEW">Review</option>
                                    <option value="COMPLETED">Completed</option>
                                </select>
                            </div>

                            <div>
                                <label className="label">Priority</label>
                                <select
                                    value={filters.priority ?? ""}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        priority: (e.target.value as TaskPriority) || undefined
                                    }))}
                                    className="select"
                                    aria-label="Filter by priority"
                                >
                                    <option value="">All Priorities</option>
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="assignedToMe"
                                    checked={filters.assignedToMe}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        assignedToMe: e.target.checked
                                    }))}
                                    className="rounded"
                                />
                                <label htmlFor="assignedToMe" className="label">
                                    Assigned to me
                                </label>
                            </div>

                            <button
                                onClick={() => setFilters({ status: undefined, priority: undefined, assignedToMe: false })}
                                className="btn btn-ghost text-sm"
                            >
                                Clear filters
                            </button>
                        </div>
                    </div>

                    {tasks && tasks.length === 0 ? (
                        <div className="card text-center p-8">
                            <div className="text-6xl mb-4">📋</div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">No tasks found</h2>
                            <p className="text-muted-foreground mb-6">
                                {Object.values(filters).some(Boolean)
                                    ? "Try adjusting your filters or create a new task"
                                    : "Create your first task to get started"
                                }
                            </p>
                            <Link
                                href="/tasks/new"
                                className="btn btn-primary"
                            >
                                Create Task
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tasks?.map((task) => (
                                <Link key={task.id} href={`/tasks/${task.id}`}>
                                    <div className="card hover-lift cursor-pointer">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-foreground">
                                                        {task.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className={getStatusColor(task.status)}>
                                                            {task.status.replace('_', ' ')}
                                                        </span>
                                                        <span className={getPriorityColor(task.priority)}>
                                                            {getPriorityIcon(task.priority)} {task.priority}
                                                        </span>
                                                    </div>
                                                </div>

                                                {task.description && (
                                                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-4 text-muted-foreground">
                                                {task.project && (
                                                    <span>📁 {task.project.title}</span>
                                                )}
                                                {task.dueDate && (
                                                    <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                                                )}
                                                {task._count?.comments && task._count.comments > 0 && (
                                                    <span>💬 {task._count.comments}</span>
                                                )}
                                                {task._count?.attachments && task._count.attachments > 0 && (
                                                    <span>📎 {task._count.attachments}</span>
                                                )}
                                                {task._count?.subTasks && task._count.subTasks > 0 && (
                                                    <span>🔗 {task._count.subTasks} subtasks</span>
                                                )}
                                            </div>

                                            <div className="flex gap-1">
                                                {task.assignments?.slice(0, 3).map((assignment) => (
                                                    <div
                                                        key={assignment.id}
                                                        className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs"
                                                        title={assignment.user.name}
                                                    >
                                                        {assignment.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                ))}
                                                {task.assignments && task.assignments.length > 3 && (
                                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                                        +{task.assignments.length - 3}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
