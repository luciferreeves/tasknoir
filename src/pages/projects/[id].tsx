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

interface ProjectMemberType {
    id: string;
    user: UserType;
    joinedAt: Date;
}

interface TaskAssignmentType {
    id: string;
    user: UserType;
}

interface TaskType {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
    assignments: TaskAssignmentType[];
    updatedAt: Date;
}

interface ProjectType {
    id: string;
    title: string;
    description: string | null;
    timeline: string | null;
    owner: UserType;
    members: ProjectMemberType[];
    createdAt: Date;
    updatedAt: Date;
}

interface ApiError {
    message?: string;
}

const ProjectDetailPage: NextPage = () => {
    const router = useRouter();
    const { status } = useSession();
    const { id } = router.query;

    const projectQuery = api.project.getById.useQuery(
        { id: id as string },
        { enabled: !!id && status === "authenticated" }
    );

    const project = projectQuery.data as ProjectType | undefined;
    const isLoading = projectQuery.isLoading;
    const error = projectQuery.error as ApiError | undefined;

    const tasksQuery = api.task.getAll.useQuery(
        { projectId: id as string },
        { enabled: !!id && status === "authenticated" }
    );

    const projectTasks = tasksQuery.data as TaskType[] | undefined;

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
                        Error loading project: {String(error.message ?? "Unknown error")}
                    </div>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-gray-600">Project not found</div>
                </div>
            </div>
        );
    }

    const completedTasks = projectTasks?.filter(task => task.status === "COMPLETED").length ?? 0;
    const totalTasks = projectTasks?.length ?? 0;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "URGENT": return "badge badge-destructive";
            case "HIGH": return "badge badge-danger";
            case "MEDIUM": return "badge badge-warning";
            case "LOW": return "badge badge-success";
            default: return "badge badge-secondary";
        }
    };

    const getTaskStatusColor = (status: string) => {
        switch (status) {
            case "TODO": return "badge badge-secondary";
            case "IN_PROGRESS": return "badge badge-primary";
            case "REVIEW": return "badge badge-warning";
            case "COMPLETED": return "badge badge-success";
            default: return "badge badge-secondary";
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/projects"
                                className="btn btn-ghost"
                            >
                                ← Back to Projects
                            </Link>
                        </div>
                        <div className="flex space-x-2">
                            <Link
                                href={`/tasks/new?projectId=${project.id}`}
                                className="btn btn-primary"
                            >
                                Add Task
                            </Link>
                            <Link
                                href={`/projects/${project.id}/edit`}
                                className="btn btn-secondary"
                            >
                                Edit Project
                            </Link>
                        </div>
                    </div>

                    <h1 className="text-3xl font-bold text-foreground mb-2">{project.title}</h1>
                    {project.description && (
                        <p className="text-muted-foreground mb-4">{project.description}</p>
                    )}

                    <div className="flex items-center space-x-4 mb-4">
                        {project.timeline && (
                            <span className="text-sm text-muted-foreground">
                                Timeline: {project.timeline}
                            </span>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-foreground">Progress</span>
                            <span className="text-sm text-muted-foreground">
                                {completedTasks}/{totalTasks} tasks completed
                            </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-3">
                            <div
                                className={`bg-primary h-3 rounded-full transition-all duration-300 ${progressPercentage === 0 ? 'w-0' :
                                    progressPercentage <= 25 ? 'w-1/4' :
                                        progressPercentage <= 50 ? 'w-1/2' :
                                            progressPercentage <= 75 ? 'w-3/4' :
                                                'w-full'
                                    }`}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Project Details Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {/* Tasks Section */}
                        <div className="card mb-8">
                            <div className="p-6 border-b border-border">
                                <h2 className="text-xl font-semibold text-foreground">Tasks</h2>
                            </div>
                            <div className="p-6">
                                {projectTasks && projectTasks.length > 0 ? (
                                    <div className="space-y-4">
                                        {projectTasks.map((task) => (
                                            <div key={task.id} className="card border hover-lift transition-all p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <Link
                                                        href={`/tasks/${task.id}`}
                                                        className="text-lg font-medium text-foreground hover:text-primary"
                                                    >
                                                        {task.title}
                                                    </Link>
                                                    <div className="flex space-x-2">
                                                        <span className={getTaskStatusColor(task.status)}>
                                                            {task.status.replace('_', ' ')}
                                                        </span>
                                                        <span className={getPriorityColor(task.priority)}>
                                                            {task.priority}
                                                        </span>
                                                    </div>
                                                </div>
                                                {task.description && (
                                                    <p className="text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                                                )}
                                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                                    <div className="flex items-center space-x-4">
                                                        {task.assignments && task.assignments.length > 0 && (
                                                            <span>Assigned to: {task.assignments[0]?.user.name ?? task.assignments[0]?.user.email}</span>
                                                        )}
                                                        {task.dueDate && (
                                                            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                                        )}
                                                    </div>
                                                    <span>Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-muted-foreground mb-4">No tasks yet</p>
                                        <Link
                                            href={`/tasks/new?projectId=${project.id}`}
                                            className="btn btn-primary"
                                        >
                                            Create First Task
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Milestones Section - Remove this section since milestones don't exist in schema */}

                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Project Info */}
                        <div className="card">
                            <div className="p-6 border-b border-border">
                                <h3 className="text-lg font-semibold text-foreground">Project Info</h3>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">Owner</span>
                                    <p className="text-foreground">{project.owner.name ?? project.owner.email}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">Created</span>
                                    <p className="text-foreground">{new Date(project.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">Last Updated</span>
                                    <p className="text-foreground">{new Date(project.updatedAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Team Members */}
                        {project.members && project.members.length > 0 && (
                            <div className="card">
                                <div className="p-6 border-b border-border">
                                    <h3 className="text-lg font-semibold text-foreground">Team Members</h3>
                                </div>
                                <div className="p-6">
                                    <div className="space-y-3">
                                        {project.members.map((member) => (
                                            <div key={member.id} className="flex items-center space-x-3">
                                                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                                                    {(member.user.name ?? member.user.email).charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-foreground">{member.user.name ?? member.user.email}</span>
                                            </div>
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

export default ProjectDetailPage;
