function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={"rounded-lg bg-[#dfd2bd] motion-safe:animate-pulse " + className}
    />
  );
}

export function LibrarySkeleton() {
  return (
    <main className="wrapper container" role="status" aria-label="Loading library">
      <span className="sr-only">Loading library...</span>
      <section className="library-hero-card mb-10 md:mb-16">
        <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:justify-between">
          <div className="w-full max-w-sm space-y-4">
            <SkeletonBlock className="h-10 w-48" />
            <SkeletonBlock className="h-5 w-full" />
            <SkeletonBlock className="h-5 w-4/5" />
            <SkeletonBlock className="h-12 w-44 bg-white/80" />
          </div>
          <SkeletonBlock className="hidden h-44 w-64 lg:block" />
          <div className="w-full max-w-xs space-y-4 rounded-xl bg-white p-5">
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-10 w-full" />
            <SkeletonBlock className="h-10 w-full" />
          </div>
        </div>
      </section>
      <div className="library-filter-bar">
        <SkeletonBlock className="h-8 w-44" />
        <SkeletonBlock className="h-11 w-full sm:w-80" />
      </div>
      <p className="library-empty-card text-center text-(--text-secondary)">Searching...</p>
    </main>
  );
}

export function BookConversationSkeleton() {
  return (
    <main className="book-page-container" role="status" aria-label="Loading book conversation">
      <span className="sr-only">Loading book conversation...</span>
      <SkeletonBlock className="mb-6 h-10 w-10 rounded-full" />
      <div className="vapi-main-container">
        <section className="vapi-header-card w-full">
          <SkeletonBlock className="h-45 w-30 shrink-0" />
          <div className="w-full flex-1 space-y-4">
            <SkeletonBlock className="h-8 w-2/3" />
            <SkeletonBlock className="h-5 w-1/3" />
            <div className="flex flex-wrap gap-2">
              <SkeletonBlock className="h-8 w-24" />
              <SkeletonBlock className="h-8 w-28" />
              <SkeletonBlock className="h-8 w-20" />
            </div>
          </div>
        </section>
        <section className="vapi-transcript-wrapper mt-6 w-full rounded-[14px] bg-white p-6">
          <SkeletonBlock className="h-16 w-3/4 rounded-2xl" />
          <SkeletonBlock className="ml-auto h-12 w-1/2 rounded-2xl" />
          <SkeletonBlock className="h-20 w-2/3 rounded-2xl" />
        </section>
      </div>
      <section className="mx-auto mt-8 w-full max-w-4xl space-y-4 rounded-[14px] bg-white p-6">
        <SkeletonBlock className="h-7 w-44" />
        <SkeletonBlock className="h-5 w-3/4" />
      </section>
    </main>
  );
}

export function UploadFormSkeleton() {
  return (
    <div className="new-book-wrapper space-y-6 rounded-xl bg-white p-6 shadow-soft" role="status" aria-label="Loading upload form">
      <span className="sr-only">Loading upload form...</span>
      <SkeletonBlock className="h-5 w-2/3" />
      <SkeletonBlock className="h-36 w-full rounded-xl" />
      <SkeletonBlock className="h-12 w-full" />
      <SkeletonBlock className="h-12 w-full" />
      <SkeletonBlock className="h-12 w-full" />
      <SkeletonBlock className="h-14 w-full" />
    </div>
  );
}

export function NewBookSkeleton() {
  return (
    <main className="wrapper container" role="status" aria-label="Loading new book page">
      <span className="sr-only">Loading new book page...</span>
      <div className="mx-auto max-w-180 space-y-10">
        <div className="space-y-4">
          <SkeletonBlock className="h-10 w-64" />
          <SkeletonBlock className="h-6 w-4/5" />
        </div>
        <UploadFormSkeleton />
      </div>
    </main>
  );
}

export function PricingSkeleton() {
  return (
    <main className="clerk-subscriptions" role="status" aria-label="Loading pricing plans">
      <span className="sr-only">Loading pricing plans...</span>
      <div className="mb-14 flex w-full max-w-2xl flex-col items-center gap-4">
        <SkeletonBlock className="h-12 w-72 max-w-full" />
        <SkeletonBlock className="h-6 w-96 max-w-full" />
      </div>
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex min-h-[480px] flex-col space-y-5 rounded-[24px] border border-[#e5ddd1] bg-white p-6">
            <SkeletonBlock className="h-8 w-1/2" />
            <SkeletonBlock className="h-5 w-full" />
            <SkeletonBlock className="h-5 w-4/5" />
            <SkeletonBlock className="h-12 w-2/5" />
            <div className="flex-1 space-y-4 pt-6">
              {Array.from({ length: 4 }, (_, point) => (
                <SkeletonBlock key={point} className="h-5 w-4/5" />
              ))}
            </div>
            <SkeletonBlock className="h-14 w-full" />
          </div>
        ))}
      </div>
    </main>
  );
}

export function AuthSkeleton() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 pt-24" role="status" aria-label="Loading account">
      <span className="sr-only">Loading account...</span>
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-soft">
        <SkeletonBlock className="mx-auto h-9 w-44" />
        <SkeletonBlock className="h-5 w-3/4" />
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-12 w-full" />
        <SkeletonBlock className="h-12 w-full" />
      </div>
    </main>
  );
}