import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "~/components/Navbar";
import Loading from "~/components/Loading";
import { api } from "~/utils/api";

export default function Projects() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { data: projects, isLoading } = api.project.getAll.useQuery();

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

    // Progress color is determined by completion percentage instead of status

    interface TaskType {
        status: string;
    }

    const calculateProgress = (tasks: TaskType[]) => {
        if (tasks.length === 0) return 0;
        const completed = tasks.filter(task => task.status === "COMPLETED").length;
        return Math.round((completed / tasks.length) * 100);
    };

    return (
        <>
            <Head>
                <title>Projects - Task Noir</title>
                <meta name="description" content="Your projects dashboard" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    <div className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-foreground mb-2">
                                Projects 📁
                            </h1>
                            <p className="text-muted-foreground text-lg">
                                Manage your projects and collaborate with your team
                            </p>
                        </div>
                        <Link
                            href="/projects/new"
                            className="btn btn-primary"
                        >
                            ➕ New Project
                        </Link>
                    </div>

                    {projects && projects.length === 0 ? (
                        <div className="card text-center p-8">
                            <div className="text-6xl mb-4">📂</div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">No projects yet</h2>
                            <p className="text-muted-foreground mb-6">
                                Create your first project to start organizing your tasks
                            </p>
                            <Link
                                href="/projects/new"
                                className="btn btn-primary"
                            >
                                Create Project
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {projects?.map((project) => {
                                const progress = calculateProgress(project.tasks);
                                const totalTasks = project._count.tasks;
                                const completedTasks = project.tasks.filter(t => t.status === "COMPLETED").length;

                                return (
                                    <Link key={project.id} href={`/projects/${project.id}`}>
                                        <div className="card hover-lift cursor-pointer p-4 h-full flex flex-col">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-xl font-semibold text-foreground truncate pr-4">
                                                    {project.title}
                                                </h3>
                                                <div className="flex flex-wrap gap-2">
                                                    {project.members.slice(0, 3).map((member) => (
                                                        <div
                                                            key={member.id}
                                                            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-medium"
                                                            title={member.user.name}
                                                        >
                                                            {member.user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    ))}
                                                    {project.members.length > 3 && (
                                                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                                            +{project.members.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex-1 mb-4">
                                                {project.description && (
                                                    <p className="text-muted-foreground text-sm line-clamp-3">
                                                        {project.description}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="space-y-3">                                <div>
                                                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                                                    <span>Progress</span>
                                                    <span className={
                                                        progress >= 80 ? 'text-green-600 font-semibold' :
                                                            progress >= 60 ? 'text-blue-600 font-semibold' :
                                                                progress >= 40 ? 'text-yellow-600 font-semibold' :
                                                                    progress >= 20 ? 'text-orange-600 font-semibold' :
                                                                        'text-red-600 font-semibold'
                                                    }>{progress}%</span>
                                                </div>
                                                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                                    <div
                                                        className={`h-3 rounded-full transition-all duration-500 ease-out ${progress === 0 ? 'w-0 bg-muted' :
                                                                progress >= 80 ? 'bg-gradient-to-r from-green-500 to-green-400' :
                                                                    progress >= 60 ? 'bg-gradient-to-r from-blue-500 to-blue-400' :
                                                                        progress >= 40 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                                                                            progress >= 20 ? 'bg-gradient-to-r from-orange-500 to-orange-400' :
                                                                                'bg-gradient-to-r from-red-500 to-red-400'
                                                            }`}
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                                <div className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        {totalTasks} tasks
                                                    </span>
                                                    <span className="text-success">
                                                        {completedTasks} completed
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
