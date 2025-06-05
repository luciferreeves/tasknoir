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
            <div className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c]">
                <Navbar />
                <main className="container mx-auto px-4 py-8">
                    <div className="mb-8 flex justify-between items-center">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">
                                Projects 📁
                            </h1>
                            <p className="text-white/70 text-lg">
                                Manage your projects and collaborate with your team
                            </p>
                        </div>
                        <Link
                            href="/projects/new"
                            className="rounded-lg bg-[hsl(280,100%,70%)] px-6 py-3 text-white font-medium hover:bg-[hsl(280,100%,60%)] transition-colors"
                        >
                            ➕ New Project
                        </Link>
                    </div>

                    {projects && projects.length === 0 ? (
                        <div className="rounded-xl bg-white/10 p-8 backdrop-blur-sm text-center">
                            <div className="text-6xl mb-4">📂</div>
                            <h2 className="text-2xl font-bold text-white mb-2">No projects yet</h2>
                            <p className="text-white/70 mb-6">
                                Create your first project to start organizing your tasks
                            </p>
                            <Link
                                href="/projects/new"
                                className="inline-block rounded-lg bg-[hsl(280,100%,70%)] px-6 py-3 text-white font-medium hover:bg-[hsl(280,100%,60%)] transition-colors"
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
                                        <div className="rounded-lg bg-white/10 p-6 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-colors cursor-pointer">
                                            <div className="flex justify-between items-start mb-4">
                                                <h3 className="text-xl font-semibold text-white truncate">
                                                    {project.title}
                                                </h3>
                                                <div className="flex flex-wrap gap-1">
                                                    {project.members.slice(0, 3).map((member) => (
                                                        <div
                                                            key={member.id}
                                                            className="w-8 h-8 rounded-full bg-[hsl(280,100%,70%)] flex items-center justify-center text-white text-xs font-medium"
                                                            title={member.user.name}
                                                        >
                                                            {member.user.name.charAt(0).toUpperCase()}
                                                        </div>
                                                    ))}
                                                    {project.members.length > 3 && (
                                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs">
                                                            +{project.members.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {project.description && (
                                                <p className="text-white/70 text-sm mb-4 line-clamp-2">
                                                    {project.description}
                                                </p>
                                            )}

                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex justify-between text-sm text-white/70 mb-1">
                                                        <span>Progress</span>
                                                        <span>{progress}%</span>
                                                    </div>
                                                    <div className="w-full bg-white/20 rounded-full h-2">
                                                        <div
                                                            className={`bg-gradient-to-r from-[hsl(280,100%,70%)] to-[hsl(300,100%,80%)] h-2 rounded-full transition-all ${progress === 0 ? 'w-0' :
                                                                    progress <= 25 ? 'w-1/4' :
                                                                        progress <= 50 ? 'w-1/2' :
                                                                            progress <= 75 ? 'w-3/4' :
                                                                                'w-full'
                                                                }`}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white/70">
                                                        {totalTasks} tasks
                                                    </span>
                                                    <span className="text-green-400">
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
