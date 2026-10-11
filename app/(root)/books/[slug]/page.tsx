import { auth } from "@clerk/nextjs/server";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import VapiControls from "@/components/VapiControls";
import { getBookBySlug } from "@/lib/actions/book.actions";

interface BookPageProps {
    params: Promise<{ slug: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
    const { userId } = await auth();

    if (!userId) {
        redirect("/");
    }

    const { slug } = await params;
    const bookResult = await getBookBySlug(slug);

    if (!bookResult.success || !bookResult.data) {
        redirect("/");
    }

    const book = bookResult.data;

    return (
        <main className="book-page-container">
            <Link href="/" className="back-btn-floating" aria-label="Back to library">
                <ArrowLeft className="h-6 w-6" />
            </Link>

            <VapiControls book={book} />
        </main>
    );
}