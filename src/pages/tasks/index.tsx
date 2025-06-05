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
            case "TODO": return "bg-gray-500 text-white";
            case "IN_PROGRESS": return "bg-blue-500 text-white";
            case "REVIEW": return "bg-yellow-500 text-black";
            case "COMPLETED": return "bg-green-500 text-white";
            default: return "bg-gray-500 text-white";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "LOW": return "bg-green-100 text-green-800";
            case "MEDIUM": return "bg-yellow-100 text-yellow-800";
            case "HIGH": return "bg-orange-100 text-orange-800";
            case "URGENT": return "bg-red-100 text-red-800";
            default: return "bg-gray-100 text-gray-800";
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
            <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    <div className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Tasks ✅
                            </h1>
                            <p className="text-white/70 text-lg">
                                Manage and track all your tasks
                            </p>
                        </div>
                        <Link
                            href="/tasks/new"
                            className="rounded-lg bg-[hsl(280,100%,70%)] px-6 py-3 text-white font-medium hover:bg-[hsl(280,100%,60%)] transition-colors"
                        >
                            ➕ New Task
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm border border-white/20 mb-6">
                        <div className="flex flex-wrap gap-4 items-center">
                            <div>
                                <label className="text-white/70 text-sm block mb-1">Status</label>
                                <select
                                    value={filters.status ?? ""}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        status: (e.target.value as TaskStatus) || undefined
                                    }))}
                                    className="rounded bg-white/10 border border-white/20 text-white px-3 py-1 text-sm"
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
                                <label className="text-white/70 text-sm block mb-1">Priority</label>
                                <select
                                    value={filters.priority ?? ""}
                                    onChange={(e) => setFilters(prev => ({
                                        ...prev,
                                        priority: (e.target.value as TaskPriority) || undefined
                                    }))}
                                    className="rounded bg-white/10 border border-white/20 text-white px-3 py-1 text-sm"
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
                                <label htmlFor="assignedToMe" className="text-white/70 text-sm">
                                    Assigned to me
                                </label>
                            </div>

                            <button
                                onClick={() => setFilters({ status: undefined, priority: undefined, assignedToMe: false })}
                                className="text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,60%)] text-sm underline"
                            >
                                Clear filters
                            </button>
                        </div>
                    </div>

                    {tasks && tasks.length === 0 ? (
                        <div className="rounded-xl bg-white/10 p-8 backdrop-blur-sm text-center">
                            <div className="text-6xl mb-4">📋</div>
                            <h2 className="text-2xl font-bold text-white mb-2">No tasks found</h2>
                            <p className="text-white/70 mb-6">
                                {Object.values(filters).some(Boolean)
                                    ? "Try adjusting your filters or create a new task"
                                    : "Create your first task to get started"
                                }
                            </p>
                            <Link
                                href="/tasks/new"
                                className="inline-block rounded-lg bg-[hsl(280,100%,70%)] px-6 py-3 text-white font-medium hover:bg-[hsl(280,100%,60%)] transition-colors"
                            >
                                Create Task
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tasks?.map((task) => (
                                <Link key={task.id} href={`/tasks/${task.id}`}>
                                    <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="text-lg font-semibold text-white">
                                                        {task.title}
                                                    </h3>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                                                            {task.status.replace('_', ' ')}
                                                        </span>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                            {getPriorityIcon(task.priority)} {task.priority}
                                                        </span>
                                                    </div>
                                                </div>

                                                {task.description && (
                                                    <p className="text-white/70 text-sm mb-3 line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center text-sm">
                                            <div className="flex items-center gap-4 text-white/60">
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
                                                        className="w-6 h-6 rounded-full bg-[hsl(280,100%,70%)] flex items-center justify-center text-white text-xs"
                                                        title={assignment.user.name}
                                                    >
                                                        {assignment.user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                ))}
                                                {task.assignments && task.assignments.length > 3 && (
                                                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">
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
