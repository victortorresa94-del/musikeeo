export function ArtistCardSkeleton() {
    return (
        <div className="bg-surface border border-white/5 rounded-2xl overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-white/5" />
            <div className="p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="w-full">
                        <div className="h-5 bg-white/10 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                </div>
                <div className="flex gap-2 mt-1">
                    <div className="h-4 w-12 bg-white/5 rounded-full" />
                    <div className="h-4 w-12 bg-white/5 rounded-full" />
                </div>
            </div>
        </div>
    );
}

export function ProfileHeaderSkeleton() {
    return (
        <div className="relative pt-20 animate-pulse">
            <div className="h-[300px] w-full bg-white/5" />
            <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-24 relative z-10">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                    <div className="size-36 md:size-44 rounded-2xl bg-zinc-800 border-4 border-background flex-shrink-0" />
                    <div className="flex-1 pb-4 w-full">
                        <div className="h-8 bg-white/10 rounded w-1/3 mb-4" />
                        <div className="flex gap-4">
                            <div className="h-4 bg-white/5 rounded w-20" />
                            <div className="h-4 bg-white/5 rounded w-20" />
                            <div className="h-4 bg-white/5 rounded w-20" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
