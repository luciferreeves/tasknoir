import React from "react";
import Link from "next/link";
import Image from "next/image";

interface UserAvatarProps {
    user: {
        id: string;
        name: string | null;
        email: string;
        image?: string | null;
    };
    size?: "sm" | "md" | "lg" | "xl" | "xxl";
    clickable?: boolean;
    showName?: boolean;
    className?: string;
    href?: string; // Custom href override
    title?: string; // Tooltip text
}

const sizeClasses = {
    sm: "w-6 h-6 text-xs",
    md: "w-8 h-8 text-sm",
    lg: "w-12 h-12 text-lg",
    xl: "w-20 h-20 text-xl",
    xxl: "w-32 h-32 text-2xl"
};

const imageSizes = {
    sm: 48,
    md: 64,
    lg: 96,
    xl: 160,
    xxl: 256
};

export default function UserAvatar({
    user,
    size = "md",
    clickable = true,
    showName = false,
    className = "",
    href,
    title
}: UserAvatarProps) {
    const avatarClasses = `${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden ${className}`;

    const renderAvatar = () => (
        <div className={`${avatarClasses} ${user.image ? 'bg-muted' : 'bg-primary text-primary-foreground font-medium'}`}>
            {user.image ? (
                <Image
                    src={user.image}
                    alt={user.name ?? user.email}
                    width={imageSizes[size]}
                    height={imageSizes[size]}
                    className="w-full h-full object-cover"
                    quality={100}
                    priority={size === "lg"}
                    unoptimized={false}
                />
            ) : (
                <span>
                    {(user.name ?? user.email).charAt(0).toUpperCase()}
                </span>
            )}
        </div>
    );

    const renderName = () => showName && (
        <span className="text-foreground">
            {user.name ?? user.email}
        </span>
    );

    if (!clickable) {
        return (
            <div
                className={showName ? "flex items-center space-x-2" : ""}
                title={title ?? `${user.name ?? user.email}`}
            >
                {renderAvatar()}
                {renderName()}
            </div>
        );
    }

    return (
        <Link
            href={href ?? `/profile/${user.id}`}
            className={`hover:opacity-80 transition-opacity ${showName ? "flex items-center space-x-2" : ""}`}
            title={title ?? `View ${user.name ?? user.email}'s profile`}
        >
            {renderAvatar()}
            {renderName()}
        </Link>
    );
}
