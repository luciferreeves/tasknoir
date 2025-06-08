import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import UserAvatar from "./UserAvatar";

export default function Navbar() {
    const { data: session } = useSession();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut({ redirect: false });
        void router.push("/auth/signin");
    };

    if (!session) {
        return null;
    }

    const navigation = [
        { name: "Dashboard", href: "/dashboard", current: router.pathname === "/dashboard" },
        { name: "Projects", href: "/projects", current: router.pathname.startsWith("/projects") },
        { name: "Tasks", href: "/tasks", current: router.pathname.startsWith("/tasks") },
    ];

    return (
        <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo and main navigation */}
                    <div className="flex items-center space-x-8">
                        <Link href="/dashboard" className="flex items-center space-x-2">
                            <div className="h-8 w-8 bg-primary rounded-md flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-sm">TN</span>
                            </div>
                            <span className="font-semibold text-lg text-foreground">Task Noir</span>
                        </Link>

                        <div className="hidden md:flex items-center space-x-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={
                                        item.current
                                            ? "nav-link-active"
                                            : "nav-link"
                                    }
                                >
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* User menu and theme toggle */}
                    <div className="flex items-center space-x-4">
                        <ThemeToggle />

                        <div className="flex items-center">
                            <div className="hover:bg-accent/50 px-3 py-2 rounded-md transition-colors flex items-center">
                                <UserAvatar
                                    user={{
                                        id: session.user.id,
                                        name: session.user.name ?? '',
                                        email: session.user.email ?? '',
                                        image: session.user.image ?? null
                                    }}
                                    size="sm"
                                    clickable={true}
                                    showName={true}
                                    href="/profile"
                                />
                            </div>

                            <button
                                onClick={handleSignOut}
                                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium cursor-pointer hover:bg-accent/50 px-3 py-2 rounded-md"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile navigation */}
                <div className="md:hidden pb-3">
                    <div className="flex space-x-1">
                        {navigation.map((item) => (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={
                                    item.current
                                        ? "nav-link-active"
                                        : "nav-link"
                                }
                            >
                                {item.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </nav>
    );
}
