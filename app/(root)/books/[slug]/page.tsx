import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import VapiControls from "@/components/VapiControls";
import SessionHistory from "@/components/SessionHistory";
import { getBookById, getBookBySlug } from "@/lib/actions/book.actions";
import { getServerSubscription } from "@/lib/subscription";

interface BookPageProps {
    params: Promise<{ slug: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    const { slug: bookKey } = await params;
    const bookResult = await getBookById(bookKey);

    if (!bookResult.success || !bookResult.data) {
        const legacyResult = await getBookBySlug(bookKey);
        if (legacyResult.success && legacyResult.data) {
            redirect(`/books/${legacyResult.data._id}`);
        }
        notFound();
    }

    const book = bookResult.data;
    const { limits } = await getServerSubscription();

    return (
        <main className="book-page-container">
            <Link href="/" className="back-btn-floating" aria-label="Back to library">
                <ArrowLeft className="h-6 w-6" />
            </Link>

            <VapiControls book={book} initialMaxDurationMinutes={limits.maxSessionMinutes} />
            <SessionHistory bookId={book._id} />
        </main>
    );
}