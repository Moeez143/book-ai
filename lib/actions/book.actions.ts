"use server";

import { CreateBook, TextSegment } from "@/types";
import { connectToDatabase } from "@/database/mongoose";
import { escapeRegex, generateSlug, serializeData } from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";

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

export const getBookBySlug = async (slug: string) => {
  try {
    await connectToDatabase();

    const book = await Book.findOne({ slug }).lean();

    if (!book) {
      return {
        success: false,
        message: "Book not found",
        data: null,
      };
    }

    return {
      success: true,
      message: "Book fetched successfully",
      data: serializeData(book),
    };
  } catch (error) {
    console.error("Error fetching book:", error);
    return {
      success: false,
      message: "Failed to fetch book",
      error,
      data: null,
    };
  }
};

export const getBookById = async (id: string) => {
  if (!mongoose.isValidObjectId(id)) {
    return { success: false, message: "Book not found", data: null };
  }
  try {
    await connectToDatabase();
    const book = await Book.findById(id).lean();
    if (!book) {
      return { success: false, message: "Book not found", data: null };
    }
    return { success: true, message: "Book fetched successfully", data: serializeData(book) };
  } catch (error) {
    console.error("Error fetching book:", error);
    return { success: false, message: "Failed to fetch book", data: null };
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
    revalidatePath("/");

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

export const searchBookSegments = async (
  bookId: string,
  query: string,
  limit: number = 5,
) => {
  try {
    await connectToDatabase();

    console.log(`Searching for: "${query}" in book ${bookId}`);

    const bookObjectId = new mongoose.Types.ObjectId(bookId);

    // Try MongoDB text search first (requires text index)
    let segments: Record<string, unknown>[] = [];
    try {
      segments = await BookSegment.find({
        bookId: bookObjectId,
        $text: { $search: query },
      })
        .select("_id bookId content segmentIndex pageNumber wordCount")
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .lean();
    } catch {
      // Text index may not exist — fall through to regex fallback
      segments = [];
    }

    // Fallback: regex search matching ANY keyword
    if (segments.length === 0) {
      const keywords = query.split(/\s+/).filter((k) => k.length > 2);
      if (keywords.length === 0) {
        return {
          success: true,
          data: [],
        };
      }

      const pattern = keywords.map(escapeRegex).join("|");

      segments = await BookSegment.find({
        bookId: bookObjectId,
        content: { $regex: pattern, $options: "i" },
      })
        .select("_id bookId content segmentIndex pageNumber wordCount")
        .sort({ segmentIndex: 1 })
        .limit(limit)
        .lean();
    }

    console.log(`Search complete. Found ${segments.length} results`);

    return {
      success: true,
      data: serializeData(segments),
    };
  } catch (error) {
    console.error("Error searching segments:", error);
    return {
      success: false,
      error: (error as Error).message,
      data: [],
    };
  }
};
