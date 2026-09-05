"use server";

import { CreateBook, TextSegment } from "@/types";
import { connectToDatabase } from "@/database/mongoose";
import { generateSlug, serializeData } from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";

export const getAllBooks = async () => {
    try {
        await connectToDatabase();

        const books = await Book.find().sort({ createdAt: -1 }).lean();

        return {
            success: true,
            message: "Books fetched successfully",
            data: serializeData(books),
        };

    } catch (error) {
        console.error("Error connecting to database:", error);
        return {
            success: false,
            message: "Failed to connect to database",
            error,
        };
    }
};

export const checkBookExists = async (title: string) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(title);

        const existingBook = await Book.findOne({ slug }).lean();
        if (existingBook) {
            return {
                exists: true,
                message: "Book already exists",
                book: serializeData(existingBook),
            };
        }

        return {
            exists: false,
            book: null,
        };
    } catch (error) {
        console.log("Error checking if book exists:", error);

        return {
            exists: false,
            error,
        };
    }
};

export const createBook = async (data: CreateBook) => {
    try {
        await connectToDatabase();

        const slug = generateSlug(data.title);

        //Checking if a book with the same slug already exists
        const existingBook = await Book.findOne({ slug }).lean();

        if (existingBook) {
            return {
                success: true,
                message: "A book with the same title already exists",
                data: serializeData(existingBook),
                alreadyExists: true,
            };
        }

        // Todo: Check the Subscription limits before creating a new book

        const book = await Book.create({ ...data, slug, totalSegments: 0 });

        return {
            success: true,
            message: "Book created successfully",
            data: serializeData(book),
        };
    } catch (error) {
        console.error("Error creating book:", error);

        return {
            success: false,
            message: "Failed to create book",
            error,
        };
    }
};

export const saveBookSegments = async (
    bookId: string,
    clerkId: string,
    segments: TextSegment[],
) => {
    try {
        await connectToDatabase();
        console.log("Saving Book Segments");

        const segmentsToInsert = segments.map(
            ({ text, segmentIndex, pageNumber, wordCount }) => ({
                clerkId,
                bookId,
                content: text,
                segmentIndex,
                pageNumber,
                wordCount,
            }),
        );

        await BookSegment.insertMany(segmentsToInsert);
        await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

        console.log("Book Segments saved successfully");

        return {
            success: true,
            message: "Book segments saved successfully",
            data: { segmentCreated: segments.length },
        };
    } catch (error) {
        console.error("Error saving book segments:", error);
        await BookSegment.deleteMany({ bookId });
        await Book.findByIdAndDelete(bookId);
        console.log(
            "Deleted book segments and book due to failure to save segments.",
        );

        return {
            success: false,
            message:
                "Failed to save book segments; rolled back and deleted book and segments",
            error,
        };
    }
};
