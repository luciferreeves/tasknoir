import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Loading from "~/components/Loading";

export default function SignUp() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const { data: session, status } = useSession();

    // Redirect if already authenticated
    useEffect(() => {
        if (status === "loading") return; // Still loading
        if (session) {
            void router.push("/dashboard");
            return;
        }
    }, [session, status, router]);

    if (status === "loading") {
        return <Loading />;
    }

    if (session) {
        return <Loading />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            // Signup
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json() as { message?: string };

            if (!response.ok) {
                setError(data.message ?? "Something went wrong");
            } else {
                // Auto-login after signup
                const loginResult = await signIn("credentials", {
                    email: formData.email,
                    password: formData.password,
                    redirect: false,
                });

                if (loginResult?.error) {
                    setError("Account created but login failed. Please try signing in.");
                } else {
                    void router.push("/dashboard");
                }
            }
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <>
            <Head>
                <title>Sign Up - Task Noir</title>
                <meta name="description" content="Create your Task Noir account" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
                <div className="w-full max-w-md space-y-8 rounded-xl bg-white/10 p-8 shadow-2xl backdrop-blur-sm">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                            Create your account
                        </h2>
                        <p className="mt-2 text-center text-sm text-white/70">
                            Join Task Noir and start organizing your tasks
                        </p>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="name" className="sr-only">
                                    Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    className="relative block w-full rounded-lg border-0 bg-white/10 px-3 py-2.5 text-white placeholder-gray-300 ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-[hsl(280,100%,70%)] sm:text-sm sm:leading-6"
                                    placeholder="Full name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="email" className="sr-only">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    className="relative block w-full rounded-lg border-0 bg-white/10 px-3 py-2.5 text-white placeholder-gray-300 ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-[hsl(280,100%,70%)] sm:text-sm sm:leading-6"
                                    placeholder="Email address"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="sr-only">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="relative block w-full rounded-lg border-0 bg-white/10 px-3 py-2.5 text-white placeholder-gray-300 ring-1 ring-inset ring-white/20 focus:ring-2 focus:ring-inset focus:ring-[hsl(280,100%,70%)] sm:text-sm sm:leading-6"
                                    placeholder="Password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-500/20 p-3">
                                <div className="text-sm text-red-200">{error}</div>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary w-full"
                            >
                                {loading ? "Creating account..." : "Sign up"}
                            </button>
                        </div>

                        <div className="text-center">
                            <Link
                                href="/auth/signin"
                                className="text-sm text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,60%)]"
                            >
                                Already have an account? Sign in
                            </Link>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
