import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "~/components/Navbar";
import Loading from "~/components/Loading";
import UserAvatar from "~/components/UserAvatar";
import HtmlPreview from "~/components/HtmlPreview";
import { api } from "~/utils/api";

export default function Dashboard() {
    const { data: session, status } = useSession();
    const router = useRouter();

    // Fetch dashboard data
    const { data: dashboardData, isLoading } = api.dashboard.getStats.useQuery(undefined, {
        enabled: !!session,
    });

    useEffect(() => {
        if (status === "loading") return; // Still loading
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

    if (!dashboardData) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <p className="text-muted-foreground">Failed to load dashboard data</p>
                    </div>
                </main>
            </div>
        );
    }

    const { taskStats, projectStats, priorityStats, recentTasks, upcomingDeadlines, recentActivities, projects } = dashboardData;

    const getTaskStatusColor = (status: string) => {
        const colors = {
            'TODO': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
            'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            'REVIEW': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
            'COMPLETED': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        };
        return colors[status as keyof typeof colors] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
            'URGENT': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
            'HIGH': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
            'MEDIUM': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
            'LOW': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        };
        return colors[priority as keyof typeof colors] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
    };

    return (
        <>
            <Head>
                <title>Dashboard - Task Noir</title>
                <meta name="description" content="Your comprehensive task management dashboard" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    {/* Welcome Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-foreground mb-2">
                            Welcome back, {session.user.name}! 👋
                        </h1>
                        <p className="text-muted-foreground text-lg">
                            Here&apos;s your productivity overview for today
                        </p>
                    </div>

                    {/* Stats Overview Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Tasks */}
                        <div className="card p-6 hover-lift">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                                    <p className="text-3xl font-bold text-foreground">{taskStats.total}</p>
                                </div>
                                <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                                    <span className="text-2xl">📋</span>
                                </div>
                            </div>
                        </div>

                        {/* Completed Tasks */}
                        <div className="card p-6 hover-lift">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{taskStats.completed}</p>
                                </div>
                                <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                                    <span className="text-2xl">✅</span>
                                </div>
                            </div>
                        </div>

                        {/* In Progress */}
                        <div className="card p-6 hover-lift">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{taskStats.inProgress}</p>
                                </div>
                                <div className="h-12 w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center">
                                    <span className="text-2xl">🚀</span>
                                </div>
                            </div>
                        </div>

                        {/* Overdue Tasks */}
                        <div className="card p-6 hover-lift">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{taskStats.overdue}</p>
                                </div>
                                <div className="h-12 w-12 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                                    <span className="text-2xl">⚠️</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column - Main Content */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Recent Tasks */}
                            <div className="card p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-foreground">Recent Tasks</h2>
                                    <Link href="/tasks" className="text-primary hover:text-primary/80 text-sm font-medium">
                                        View All →
                                    </Link>
                                </div>
                                {recentTasks.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentTasks.map((task) => (
                                            <div key={task.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                                <div className="flex-1">
                                                    <Link href={`/tasks/${task.id}`} className="font-medium text-foreground hover:text-primary">
                                                        {task.title}
                                                    </Link>
                                                    {task.description && (
                                                        <HtmlPreview
                                                            content={task.description}
                                                            className="text-sm text-muted-foreground mt-1 line-clamp-1"
                                                            maxLength={80}
                                                            stripHtml={true}
                                                        />
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                                                            {task.status.replace('_', ' ')}
                                                        </span>
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                            {task.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                                {task.dueDate && (
                                                    <div className="text-sm text-muted-foreground">
                                                        Due: {new Date(task.dueDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-4xl mb-2">📝</div>
                                        <p className="text-muted-foreground">No tasks yet</p>
                                        <Link href="/tasks/new" className="btn btn-primary btn-sm mt-4">
                                            Create Your First Task
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Task Status Distribution */}
                            <div className="card p-6">
                                <h2 className="text-xl font-semibold text-foreground mb-6">Task Status Overview</h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-900/10">
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{taskStats.todo}</div>
                                        <div className="text-sm text-muted-foreground">To Do</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/10">
                                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{taskStats.inProgress}</div>
                                        <div className="text-sm text-muted-foreground">In Progress</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-purple-50 dark:bg-purple-900/10">
                                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{taskStats.review}</div>
                                        <div className="text-sm text-muted-foreground">Review</div>
                                    </div>
                                    <div className="text-center p-4 rounded-lg bg-green-50 dark:bg-green-900/10">
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">{taskStats.completed}</div>
                                        <div className="text-sm text-muted-foreground">Completed</div>
                                    </div>
                                </div>
                            </div>

                            {/* Projects Overview */}
                            <div className="card p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-foreground">Your Projects</h2>
                                    <Link href="/projects" className="text-primary hover:text-primary/80 text-sm font-medium">
                                        View All →
                                    </Link>
                                </div>
                                {projects && projects.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {projects.slice(0, 4).map((project) => (
                                            <Link key={project.id} href={`/projects/${project.id}`} className="block">
                                                <div className="p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                                                    <div className="font-medium text-foreground mb-2">{project.title}</div>
                                                    {project.description && (
                                                        <HtmlPreview
                                                            content={project.description}
                                                            className="text-sm text-muted-foreground line-clamp-2"
                                                            maxLength={100}
                                                            stripHtml={true}
                                                        />
                                                    )}
                                                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                                                        <span>📊 {project._count?.tasks ?? 0} tasks</span>
                                                        <span>👥 {(project._count?.members ?? 0) + 1} members</span>
                                                    </div>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-4xl mb-2">📁</div>
                                        <p className="text-muted-foreground">No projects yet</p>
                                        <Link href="/projects/new" className="btn btn-primary btn-sm mt-4">
                                            Create Your First Project
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Recent Activities */}
                            <div className="card p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-semibold text-foreground">Recent Activities</h2>
                                </div>
                                {recentActivities && recentActivities.length > 0 ? (
                                    <div className="space-y-4">
                                        {recentActivities.slice(0, 8).map((activity) => (
                                            <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg bg-muted/30">
                                                <UserAvatar
                                                    user={{
                                                        id: activity.user?.id ?? '',
                                                        name: activity.user?.name ?? 'Unknown User',
                                                        email: '',
                                                        image: activity.user?.image ?? null
                                                    }}
                                                    size="sm"
                                                    clickable={false}
                                                    showName={false}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm">
                                                        <span className="font-medium text-foreground">
                                                            {activity.user?.name ?? 'Unknown User'}
                                                        </span>
                                                        <span className="text-muted-foreground ml-1">
                                                            {(() => {
                                                                const action = activity.action.toLowerCase();
                                                                switch (action) {
                                                                    case 'created':
                                                                        return 'created task';
                                                                    case 'status_changed':
                                                                        return 'changed status of task';
                                                                    case 'commented':
                                                                        return 'commented on task';
                                                                    case 'comment_updated':
                                                                        return 'updated comment on task';
                                                                    case 'comment_deleted':
                                                                        return 'deleted comment on task';
                                                                    case 'assigned':
                                                                        return 'was assigned to task';
                                                                    case 'completed':
                                                                        return 'completed task';
                                                                    default:
                                                                        return `${action.replace('_', ' ')} task`;
                                                                }
                                                            })()}
                                                        </span>
                                                        <Link
                                                            href={`/tasks/${activity.task.id}`}
                                                            className="font-medium text-primary hover:text-primary/80 ml-1"
                                                        >
                                                            &ldquo;{activity.task.title}&rdquo;
                                                        </Link>
                                                        {activity.task.project && (
                                                            <span className="text-muted-foreground ml-1">
                                                                in{' '}
                                                                <Link
                                                                    href={`/projects/${activity.task.project.id}`}
                                                                    className="text-primary hover:text-primary/80"
                                                                >
                                                                    {activity.task.project.title}
                                                                </Link>
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground mt-1">
                                                        {new Date(activity.createdAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-4xl mb-2">📱</div>
                                        <p className="text-muted-foreground">No recent activities</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="space-y-8">
                            {/* Quick Actions */}
                            <div className="card p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
                                <div className="space-y-3">
                                    <Link href="/tasks/new" className="block">
                                        <button className="w-full btn btn-primary justify-start gap-3">
                                            <span className="text-lg">➕</span>
                                            New Task
                                        </button>
                                    </Link>
                                    <Link href="/projects/new" className="block">
                                        <button className="w-full btn btn-outline justify-start gap-3">
                                            <span className="text-lg">📁</span>
                                            New Project
                                        </button>
                                    </Link>
                                    <Link href="/tasks" className="block">
                                        <button className="w-full btn btn-outline justify-start gap-3">
                                            <span className="text-lg">📊</span>
                                            View Tasks
                                        </button>
                                    </Link>
                                    {taskStats.overdue > 0 && (
                                        <Link href="/tasks?filter=overdue" className="block">
                                            <button className="w-full btn btn-outline justify-start gap-3 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20">
                                                <span className="text-lg">⚠️</span>
                                                View Overdue ({taskStats.overdue})
                                            </button>
                                        </Link>
                                    )}
                                    {taskStats.dueThisWeek > 0 && (
                                        <Link href="/tasks?filter=due-soon" className="block">
                                            <button className="w-full btn btn-outline justify-start gap-3 text-yellow-600 border-yellow-200 hover:bg-yellow-50 dark:text-yellow-400 dark:border-yellow-800 dark:hover:bg-yellow-900/20">
                                                <span className="text-lg">⏰</span>
                                                Due This Week ({taskStats.dueThisWeek})
                                            </button>
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Upcoming Deadlines */}
                            <div className="card p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Deadlines</h3>
                                {upcomingDeadlines.length > 0 ? (
                                    <div className="space-y-3">
                                        {upcomingDeadlines.slice(0, 5).map((task) => (
                                            <div key={task.id} className="p-3 rounded-lg bg-muted/30">
                                                <Link href={`/tasks/${task.id}`} className="font-medium text-foreground hover:text-primary text-sm">
                                                    {task.title}
                                                </Link>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(task.dueDate!).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <div className="text-2xl mb-2">🎯</div>
                                        <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
                                    </div>
                                )}
                            </div>

                            {/* Priority Breakdown */}
                            <div className="card p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Active Tasks by Priority</h3>
                                <div className="space-y-3">
                                    {priorityStats.urgent > 0 && (
                                        <div className="flex items-center justify-between p-2 rounded bg-red-50 dark:bg-red-900/10">
                                            <span className="text-sm font-medium text-red-700 dark:text-red-400">Urgent</span>
                                            <span className="text-sm font-semibold text-red-700 dark:text-red-400">{priorityStats.urgent}</span>
                                        </div>
                                    )}
                                    {priorityStats.high > 0 && (
                                        <div className="flex items-center justify-between p-2 rounded bg-orange-50 dark:bg-orange-900/10">
                                            <span className="text-sm font-medium text-orange-700 dark:text-orange-400">High</span>
                                            <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">{priorityStats.high}</span>
                                        </div>
                                    )}
                                    {priorityStats.medium > 0 && (
                                        <div className="flex items-center justify-between p-2 rounded bg-yellow-50 dark:bg-yellow-900/10">
                                            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Medium</span>
                                            <span className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">{priorityStats.medium}</span>
                                        </div>
                                    )}
                                    {priorityStats.low > 0 && (
                                        <div className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-900/10">
                                            <span className="text-sm font-medium text-green-700 dark:text-green-400">Low</span>
                                            <span className="text-sm font-semibold text-green-700 dark:text-green-400">{priorityStats.low}</span>
                                        </div>
                                    )}
                                    {priorityStats.urgent === 0 && priorityStats.high === 0 && priorityStats.medium === 0 && priorityStats.low === 0 && (
                                        <div className="text-center py-4">
                                            <div className="text-2xl mb-2">🎉</div>
                                            <p className="text-sm text-muted-foreground">All caught up!</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Profile Summary */}
                            <div className="card p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">Profile Summary</h3>
                                <div className="flex items-center space-x-3 mb-4">
                                    <UserAvatar
                                        user={{
                                            id: session.user.id,
                                            name: session.user.name ?? '',
                                            email: session.user.email ?? '',
                                            image: session.user.image ?? null
                                        }}
                                        size="lg"
                                        clickable={true}
                                        showName={false}
                                    />
                                    <div>
                                        <div className="font-medium text-foreground">{session.user.name}</div>
                                        <div className="text-sm text-muted-foreground">{session.user.email}</div>
                                    </div>
                                </div>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Projects Owned:</span>
                                        <span className="font-medium">{projectStats.owned}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Member of:</span>
                                        <span className="font-medium">{projectStats.member}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Total Tasks:</span>
                                        <span className="font-medium">{taskStats.total}</span>
                                    </div>
                                </div>
                                <Link href="/profile" className="btn btn-outline btn-sm w-full mt-4">
                                    Edit Profile
                                </Link>
                            </div>

                            {/* Productivity Tip */}
                            <div className="card p-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">💡 Productivity Tip</h3>
                                <div className="space-y-3">
                                    {taskStats.overdue > 0 ? (
                                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
                                            <p className="text-sm text-red-700 dark:text-red-400">
                                                You have {taskStats.overdue} overdue task{taskStats.overdue > 1 ? 's' : ''}.
                                                Consider breaking them into smaller, manageable chunks to get back on track! 🎯
                                            </p>
                                        </div>
                                    ) : taskStats.inProgress > 5 ? (
                                        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800">
                                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                                                You have many tasks in progress. Try to focus on completing 2-3 tasks before starting new ones.
                                                Quality over quantity! ✨
                                            </p>
                                        </div>
                                    ) : taskStats.completed > taskStats.todo ? (
                                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                                            <p className="text-sm text-green-700 dark:text-green-400">
                                                Great job! You&apos;ve completed more tasks than you have pending.
                                                Keep up the excellent work! 🌟
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                                            <p className="text-sm text-blue-700 dark:text-blue-400">
                                                Start each day by reviewing your priorities.
                                                Focus on urgent and important tasks first! 🚀
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
