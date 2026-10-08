import "server-only";

import { connectToDatabase } from "@/database/mongoose";
import BookSegment from "@/database/models/book-segment.model";
import type { IBookSegment } from "@/types";

export async function searchBookSegments(
  bookId: string,
  query: string,
  limit: number = 3,
) {
  await connectToDatabase();

  return BookSegment.find(
    { bookId, $text: { $search: query } },
    { content: 1, segmentIndex: 1, score: { $meta: "textScore" } },
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit)
    .lean<Pick<IBookSegment, "content" | "segmentIndex">[]>();
}
