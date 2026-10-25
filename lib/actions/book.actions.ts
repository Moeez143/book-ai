"use server";

import { CreateBook, TextSegment } from "@/types";
import { connectToDatabase } from "@/database/mongoose";
import { escapeRegex, generateSlug, serializeData } from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { getServerSubscription } from "@/lib/subscription";

export const getAllBooks = async (searchQuery = "") => {
  try {
    await connectToDatabase();

    const query = searchQuery.trim();
    const searchPattern = query ? new RegExp(escapeRegex(query), "i") : null;
    const filter = searchPattern
      ? { $or: [{ title: searchPattern }, { author: searchPattern }] }
      : {};
    const books = await Book.find(filter).sort({ createdAt: -1 }).lean();

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

export const checkBookUploadLimit = async () => {
  try {
    const { userId, plan, limits } = await getServerSubscription();
    if (!userId) {
      return { allowed: false, message: "Please sign in to add a book." };
    }

    await connectToDatabase();
    const currentCount = await Book.countDocuments({ clerkId: userId });
    const allowed = currentCount < limits.maxBooks;

    return {
      allowed,
      limitReached: !allowed,
      currentCount,
      limit: limits.maxBooks,
      plan,
      message: allowed
        ? ""
        : "Your " + plan + " plan allows up to " + limits.maxBooks +
          " books. View plans to add more.",
    };
  } catch (error) {
    console.error("Error checking book limit:", error);
    return { allowed: false, message: "Unable to check your book limit. Please try again." };
  }
};

export const createBook = async (data: CreateBook) => {
  try {
    const { userId, plan, limits } = await getServerSubscription();
    if (!userId) {
      return { success: false, message: "Please sign in to add a book." };
    }

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

    const currentCount = await Book.countDocuments({ clerkId: userId });
    if (currentCount >= limits.maxBooks) {
      return {
        success: false,
        message: "Your " + plan + " plan allows up to " + limits.maxBooks +
          " books. View plans to add more.",
        limitReached: true,
      };
    }

    const book = await Book.create({ ...data, clerkId: userId, slug, totalSegments: 0 });

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
  segments: TextSegment[],
) => {
  let verifiedUserId: string | null = null;
  try {
    const { userId } = await getServerSubscription();
    if (!userId) {
      return { success: false, message: "Please sign in to save book segments." };
    }

    await connectToDatabase();
    const book = await Book.exists({ _id: bookId, clerkId: userId });
    if (!book) {
      return { success: false, message: "Book not found." };
    }
    verifiedUserId = userId;
    console.log("Saving Book Segments");

    const segmentsToInsert = segments.map(
      ({ text, segmentIndex, pageNumber, wordCount }) => ({
        clerkId: userId,
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
    if (verifiedUserId) {
      await BookSegment.deleteMany({ bookId, clerkId: verifiedUserId });
      await Book.deleteOne({ _id: bookId, clerkId: verifiedUserId, totalSegments: 0 });
    }

    return {
      success: false,
      message: "Failed to save book segments. Please try again later.",
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
