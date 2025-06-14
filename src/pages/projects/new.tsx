import { type NextPage } from "next";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { api } from "~/utils/api";
import Loading from "~/components/Loading";
import Navbar from "~/components/Navbar";

const NewProjectPage: NextPage = () => {
  const router = useRouter();
  const { status } = useSession();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    timeline: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const createProjectMutation = api.project.create.useMutation({
    onSuccess: (data: { id: string }) => {
      void router.push(`/projects/${data.id}`);
    },
    onError: (error: { message: string }) => {
      console.error("Error creating project:", error);
      setIsSubmitting(false);
    },
  });

  if (status === "loading") return <Loading />;

  if (status === "unauthenticated") {
    void router.push("/auth/signin");
    return <Loading />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);

    const submitData = {
      name: formData.name,
      description: formData.description || undefined,
      timeline: formData.timeline || undefined,
    };

    createProjectMutation.mutate(submitData);
  };

  return (
    <>
      <Head>
        <title>Create New Project | Task Management</title>
        <meta name="description" content="Create a new project to organize your tasks and collaborate with your team" />
      </Head>
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link
                href="/projects"
                className="btn btn-ghost"
              >
                ← Back to Projects
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-foreground">Create New Project</h1>
            <p className="text-muted-foreground mt-2">Set up a new project to organize your tasks and team collaboration.</p>
          </div>

          {/* Form */}
          <div className="max-w-2xl mx-auto">
            <div className="card p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Name */}
                <div>
                  <label htmlFor="name" className="label">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="Enter project name"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="textarea"
                    placeholder="Describe your project goals and objectives"
                  />
                </div>

                {/* Timeline */}
                <div>
                  <label htmlFor="timeline" className="label">
                    Timeline
                  </label>
                  <input
                    type="text"
                    id="timeline"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    className="input"
                    placeholder="e.g., Q1 2024, 3 months, Jan-Mar"
                  />
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-border">
                  <Link
                    href="/projects"
                    className="btn btn-outline"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.name.trim()}
                    className="btn btn-primary"
                  >
                    {isSubmitting ? "Creating..." : "Create Project"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Error Display */}
          {createProjectMutation.error && (
            <div className="mt-6 max-w-2xl mx-auto">
              <div className="card bg-destructive/5 border-destructive/20 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-destructive">
                      Error creating project
                    </h3>
                    <div className="mt-2 text-sm text-destructive/80">
                      <p>{createProjectMutation.error.message}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NewProjectPage;
