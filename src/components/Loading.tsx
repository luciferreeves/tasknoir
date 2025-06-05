export default function Loading() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 loading-spinner"></div>
                <h1 className="text-2xl font-bold text-foreground">Loading...</h1>
                <p className="text-muted-foreground">Please wait while we load your experience</p>
            </div>
        </div>
    );
}
