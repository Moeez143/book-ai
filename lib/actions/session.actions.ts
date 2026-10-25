"use server";

import mongoose from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import Book from "@/database/models/book.model";
import VoiceSession from "@/database/models/voice-session.model";
import { getServerSubscription } from "@/lib/subscription";
import {
  getCurrentBillingPeriodStart,
  getNextBillingPeriodStart,
} from "@/lib/subscription-constants";
import type { StartSessionResult } from "@/types";

export const startVoiceSession = async (
  bookId: string,
): Promise<StartSessionResult> => {
  try {
    const { userId, plan, limits } = await getServerSubscription();
    if (!userId) {
      return { success: false, error: "Please sign in to start a voice session." };
    }
    if (!mongoose.isValidObjectId(bookId)) {
      return { success: false, error: "Book not found." };
    }

    await connectToDatabase();
    const bookExists = await Book.exists({ _id: bookId });
    if (!bookExists) {
      return { success: false, error: "Book not found." };
    }

    const startedAt = new Date();
    const billingPeriodStart = getCurrentBillingPeriodStart(startedAt);
    const nextBillingPeriodStart = getNextBillingPeriodStart(startedAt);

    if (limits.maxSessionsPerMonth !== null) {
      const activeSessionCutoff = new Date(startedAt.getTime() - limits.maxSessionMinutes * 60_000);
      const sessionCount = await VoiceSession.countDocuments({
        clerkId: userId,
        startedAt: { $gte: billingPeriodStart, $lt: nextBillingPeriodStart },
        $or: [
          { endedAt: null, startedAt: { $gte: activeSessionCutoff } },
          { durationSeconds: { $gt: 0 } },
        ],
      });
      if (sessionCount >= limits.maxSessionsPerMonth) {
        return {
          success: false,
          error: "Your " + plan + " plan includes " + limits.maxSessionsPerMonth +
            " voice sessions per month. View plans to continue.",
        };
      }
    }

    const session = await VoiceSession.create({
      clerkId: userId,
      bookId,
      startedAt,
      billingPeriodStart,
      durationSeconds: 0,
    });

    return {
      success: true,
      sessionId: session._id.toString(),
      maxDurationMinutes: limits.maxSessionMinutes,
    };
  } catch (error) {
    console.error("Error starting voice session:", error);
    return {
      success: false,
      error: "Failed to start voice session. Please try again later.",
    };
  }
};

export const endVoiceSession = async (
  sessionId: string,
  durationSeconds: number,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { userId } = await getServerSubscription();
    if (!userId) {
      return { success: false, error: "Please sign in to end the voice session." };
    }
    if (!mongoose.isValidObjectId(sessionId)) {
      return { success: false, error: "Voice session not found." };
    }

    await connectToDatabase();
    const safeDuration = Number.isFinite(durationSeconds)
      ? Math.max(0, Math.floor(durationSeconds))
      : 0;
    const session = await VoiceSession.findOneAndUpdate(
      { _id: sessionId, clerkId: userId },
      { endedAt: new Date(), durationSeconds: safeDuration },
      { new: true },
    );

    if (!session) {
      return { success: false, error: "Voice session not found." };
    }

    return { success: true };
  } catch (error) {
    console.error("Error ending voice session:", error);
    return {
      success: false,
      error: "Failed to end voice session. Please try again later.",
    };
  }
};

export const getVoiceSessionHistory = async (bookId: string) => {
  try {
    const { userId, limits } = await getServerSubscription();
    if (!userId) {
      return { allowed: false, sessions: [], error: "Please sign in to view session history." };
    }
    if (!limits.hasSessionHistory) {
      return { allowed: false, sessions: [] };
    }
    if (!mongoose.isValidObjectId(bookId)) {
      return { allowed: true, sessions: [], error: "Book not found." };
    }

    await connectToDatabase();
    const sessions = await VoiceSession.find({ clerkId: userId, bookId })
      .select("startedAt durationSeconds")
      .sort({ startedAt: -1 })
      .limit(20)
      .lean();

    return {
      allowed: true,
      sessions: sessions.map((session) => ({
        id: session._id.toString(),
        startedAt: session.startedAt.toISOString(),
        durationSeconds: session.durationSeconds,
      })),
    };
  } catch (error) {
    console.error("Error fetching voice session history:", error);
    return { allowed: true, sessions: [], error: "Unable to load session history." };
  }
};
