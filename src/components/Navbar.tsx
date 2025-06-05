import { signOut } from "next-auth/react";
import { useRouter } from "next/router";

export default function Navbar() {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut({ redirect: false });
        void router.push("/auth/signin");
    };

    return (
        <nav className="bg-white/10 backdrop-blur-sm border-b border-white/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center">
                        <h1 className="text-xl font-bold text-white">
                            Task <span className="text-[hsl(280,100%,70%)]">Noir</span>
                        </h1>
                    </div>

                    <div className="flex items-center">
                        <button
                            onClick={handleSignOut}
                            className="rounded-full bg-white/10 px-6 py-2 font-semibold text-white no-underline transition hover:bg-white/20"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}
