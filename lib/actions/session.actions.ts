"use server";

import { connectToDatabase } from "@/database/mongoose";
import { StartSessionResult } from "@/types";
import VoiceSession from "@/database/models/voice-session.model";
import { getCurrentBillingPeriodStart } from "../subscription-contants";

export const startVoiceSession = async (
  clerkId: string,
  bookId: string,
): Promise<StartSessionResult> => {
  try {
    await connectToDatabase();

    // Limit/Plan to see whether the user can start a new session or not.

    const session = await VoiceSession.create({
      clerkId,
      bookId,
      startedAt: new Date(),
      billingPeriodStart: getCurrentBillingPeriodStart(),
      durationSeconds: 0, // Initialize duration to 0
    });

    return {
      success: true,
      sessionId: session._id.toString(),
      // maxDurationMinutes: check.maxDurationMinutes
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
    await connectToDatabase();

    const session = await VoiceSession.findByIdAndUpdate(
      sessionId,
      {
        endedAt: new Date(),
        durationSeconds,
      },
      { new: true },
    );

    if (!session) {
      return {
        success: false,
        error: "Voice session not found.",
      };
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
