import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "~/utils/api";
import Loading from "~/components/Loading";
import Navbar from "~/components/Navbar";

const EditProjectPage: NextPage = () => {
    const router = useRouter();
    const { status } = useSession();
    const projectId = router.query.id as string;

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        timeline: "",
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        data: project,
        isLoading: projectLoading,
        isError
    } = api.project.getById.useQuery(
        { id: projectId },
        {
            enabled: !!projectId && status === "authenticated",
        }
    );

    const updateProjectMutation = api.project.update.useMutation({
        onSuccess: (data: { id: string }) => {
            void router.push(`/projects/${data.id}`);
        },
        onError: (error: { message: string }) => {
            console.error("Error updating project:", error);
            setIsSubmitting(false);
        },
    });

    // Populate form when project data loads
    useEffect(() => {
        if (project) {
            setFormData({
                name: project.title ?? "",
                description: project.description ?? "",
                timeline: project.timeline ?? "",
            });
        }
    }, [project]);

    if (status === "loading" || projectLoading) return <Loading />;

    if (status === "unauthenticated") {
        void router.push("/auth/signin");
        return <Loading />;
    }

    if (isError || !project) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
                        <p className="text-gray-600 mb-6">The project you&apos;re looking for doesn&apos;t exist or you don&apos;t have permission to edit it.</p>
                        <Link
                            href="/projects"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                            Back to Projects
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);

        const submitData = {
            id: projectId,
            title: formData.name,
            description: formData.description ?? undefined,
            timeline: formData.timeline ?? undefined,
        };

        updateProjectMutation.mutate(submitData);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center space-x-4 mb-4">
                        <Link
                            href={`/projects/${projectId}`}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                            ← Back to Project
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Project</h1>
                    <p className="text-gray-600 mt-2">Update your project information and settings.</p>
                </div>

                {/* Form */}
                <div className="max-w-2xl">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Project Name */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Project Name *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Enter project name"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Describe your project goals and objectives"
                                />
                            </div>

                            {/* Timeline */}
                            <div>
                                <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-2">
                                    Timeline
                                </label>
                                <input
                                    type="text"
                                    id="timeline"
                                    value={formData.timeline}
                                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g., Q1 2024, 3 months, Jan-Mar"
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                                <Link
                                    href={`/projects/${projectId}`}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </Link>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !formData.name.trim()}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {isSubmitting ? "Updating..." : "Update Project"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Error Display */}
                {updateProjectMutation.error && (
                    <div className="mt-4 max-w-2xl">
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">
                                        Error updating project
                                    </h3>
                                    <div className="mt-2 text-sm text-red-700">
                                        <p>{updateProjectMutation.error.message}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditProjectPage;
