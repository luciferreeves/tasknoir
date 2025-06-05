export default function Loading() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
                <h1 className="text-2xl font-bold text-white">Loading...</h1>
                <p className="text-white/70">Please wait while we load your experience</p>
            </div>
        </div>
    );
}
