import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "~/components/Navbar";
import Loading from "~/components/Loading";
import UserAvatar from "~/components/UserAvatar";
import HtmlPreview from "~/components/HtmlPreview";
import { api } from "~/utils/api";

// Type definitions based on actual Prisma schema
type TaskStatus = "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface TaskUser {
    id: string;
    name: string;
    email: string;
    image?: string | null;
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
    parentTask?: {
        id: string;
        title: string;
    } | null;
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

    const [collapsedParents, setCollapsedParents] = useState<Set<string>>(new Set());

    const { data: tasksData, isLoading } = api.task.getAll.useQuery(filters);
    const tasks = tasksData as TaskWithRelations[] | undefined;

    // Organize tasks into parent-child relationships
    const organizedTasks = () => {
        if (!tasks) return [];

        const parentTasks: TaskWithRelations[] = [];
        const subtasksByParent: Record<string, TaskWithRelations[]> = {};

        // Separate parent tasks and subtasks
        tasks.forEach(task => {
            if (task.parentTask) {
                subtasksByParent[task.parentTask.id] ??= [];
                subtasksByParent[task.parentTask.id]!.push(task);
            } else {
                parentTasks.push(task);
            }
        });

        // Create organized list with parent tasks followed by their subtasks
        const organized: (TaskWithRelations & { isSubtask?: boolean; parentId?: string })[] = [];

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
            case "TODO": return "status-todo";
            case "IN_PROGRESS": return "status-in-progress";
            case "REVIEW": return "status-review";
            case "COMPLETED": return "status-completed";
            default: return "status-todo";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "LOW": return "priority-low";
            case "MEDIUM": return "priority-medium";
            case "HIGH": return "priority-high";
            case "URGENT": return "priority-urgent";
            default: return "priority-medium";
        }
    };

    const TaskCard = ({ task, isSubtask = false, _parentId }: {
        task: TaskWithRelations;
        isSubtask?: boolean;
        _parentId?: string;
    }) => {
        const hasSubtasks = !isSubtask && Boolean(task._count?.subTasks && task._count.subTasks > 0);
        const isCollapsed = collapsedParents.has(task.id);

        return (
            <div className={`relative ${isSubtask ? 'ml-8' : ''}`}>
                {/* Collapse/Expand button for parent tasks - positioned outside the card */}
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



                <div className={`card p-6 hover-lift ${isSubtask ? '-mt-2' : 'mb-4'} last:mb-0`}>
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Link href={`/tasks/${task.id}`} className="flex-1">
                                    <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors">
                                        {task.title}
                                    </h3>
                                </Link>

                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={getStatusColor(task.status)}>
                                        {task.status.replace('_', ' ')}
                                    </span>
                                    <span className={getPriorityColor(task.priority)}>
                                        {task.priority}
                                    </span>
                                </div>
                            </div>

                            {task.description && (
                                <Link href={`/tasks/${task.id}`}>
                                    <HtmlPreview
                                        content={task.description}
                                        className="text-muted-foreground text-sm mb-3 line-clamp-2 hover:text-foreground/80 transition-colors"
                                        maxLength={150}
                                        stripHtml={true}
                                    />
                                </Link>
                            )}
                        </div>
                    </div>

                    <Link href={`/tasks/${task.id}`}>
                        <div className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-4 text-muted-foreground">
                                {task.project && (
                                    <span>📁 {task.project.title}</span>
                                )}
                                {task.dueDate && (
                                    <span>📅 {new Date(task.dueDate).toLocaleDateString()}</span>
                                )}
                                {task._count && (
                                    <span>💬 {task._count.comments}</span>
                                )}
                                {task._count && (
                                    <span>📎 {task._count.attachments}</span>
                                )}
                                {task._count && (
                                    <span>📝 {task._count.subTasks} subtask{task._count.subTasks !== 1 ? 's' : ''}</span>
                                )}
                                {isSubtask && task.parentTask && (
                                    <span className="text-xs text-muted-foreground">↳ subtask of {task.parentTask.title}</span>
                                )}
                            </div>

                            <div className="flex gap-1">
                                {task.assignments?.slice(0, 3).map((assignment) => (
                                    <UserAvatar
                                        key={assignment.id}
                                        user={assignment.user}
                                        size="sm"
                                        clickable={true}
                                        showName={false}
                                    />
                                ))}
                                {task.assignments && task.assignments.length > 3 && (
                                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                        +{task.assignments.length - 3}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        );
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
                    <div className="card p-4 mb-6">
                        <div className="flex gap-6 items-center overflow-x-auto">
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <label className="label text-sm font-medium whitespace-nowrap">Status:</label>
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

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <label className="label text-sm font-medium whitespace-nowrap">Priority:</label>
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

                            <div className="flex items-center gap-2 flex-shrink-0">
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
                                <label htmlFor="assignedToMe" className="label text-sm font-medium whitespace-nowrap">
                                    Assigned to me
                                </label>
                            </div>

                            <button
                                onClick={() => setFilters({ status: undefined, priority: undefined, assignedToMe: false })}
                                className="btn btn-ghost text-sm flex-shrink-0"
                            >
                                Clear filters
                            </button>
                        </div>
                    </div>

                    {tasks && tasks.length === 0 ? (
                        <div className="card text-center p-6">
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
                            {organizedTasks().map((task) => (
                                <TaskCard
                                    key={task.id}
                                    task={task}
                                    isSubtask={task.isSubtask}
                                    _parentId={task.parentId}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
