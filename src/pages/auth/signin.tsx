import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Loading from "~/components/Loading";

export default function SignIn() {
    const [formData, setFormData] = useState({
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
            // Login
            const result = await signIn("credentials", {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid credentials");
            } else {
                void router.push("/dashboard");
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
                <title>Sign In - Task Noir</title>
                <meta name="description" content="Sign in to Task Noir" />
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
                <div className="w-full max-w-md space-y-8 rounded-xl bg-white/10 p-8 shadow-2xl backdrop-blur-sm">
                    <div>
                        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
                            Sign in to your account
                        </h2>
                    </div>
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-4">
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
                                    autoComplete="current-password"
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
                                {loading ? "Signing in..." : "Sign in"}
                            </button>
                        </div>

                        <div className="text-center">
                            <Link
                                href="/auth/signup"
                                className="text-sm text-[hsl(280,100%,70%)] hover:text-[hsl(280,100%,60%)]"
                            >
                                Don&apos;t have an account? Sign up
                            </Link>
                        </div>
                    </form>
                </div>
            </main>
        </>
    );
}
