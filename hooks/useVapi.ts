"use client";

// Create hooks/useVapi.ts: the core hook. Initializes Vapi SDK, manages call lifecycle (idle, connecting, starting, listening, thinking, speaking), tracks messages array + currentMessage streaming, handles duration timer with maxDuration enforcement, session tracking via server actions

import { useState, useEffect, useRef, useCallback } from "react";
import Vapi from "@vapi-ai/web";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { getVoiceErrorMessage } from "@/lib/voice-errors";

import { DEFAULT_VOICE, VOICE_SETTINGS } from "@/lib/contants";
import { getVoice } from "@/lib/utils";
import { IBook, Messages } from "@/types";
import {
  startVoiceSession,
  endVoiceSession,
} from "@/lib/actions/session.actions";

export function useLatestRef<T>(value: T) {
  const ref = useRef(value);

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref;
}

type VapiConfig = { apiKey: string; assistantId: string };

const TIMER_INTERVAL_MS = 1000;
const VOICE_ERROR_TOAST_ID = "voice-session-error";

let vapi: InstanceType<typeof Vapi>;
let vapiConfigPromise: Promise<VapiConfig> | null = null;
let vapiPromise: Promise<InstanceType<typeof Vapi>> | null = null;

function getVapiConfig() {
  if (!vapiConfigPromise) {
    vapiConfigPromise = fetch("/api/vapi/config")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load voice assistant configuration");
        }
        return response.json() as Promise<VapiConfig>;
      })
      .catch((error: unknown) => {
        vapiConfigPromise = null;
        throw error;
      });
  }
  return vapiConfigPromise;
}

function getVapi() {
  if (!vapiPromise) {
    vapiPromise = getVapiConfig()
      .then(({ apiKey }) => {
        vapi = new Vapi(apiKey);
        return vapi;
      })
      .catch((error: unknown) => {
        vapiPromise = null;
        throw error;
      });
  }
  return vapiPromise;
}

function isNonFatalAudioProcessingError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;

  const details = error as Record<string, unknown>;
  const type = [details.type, details.stage].filter((value) => typeof value === "string").join(" ").toLowerCase();

  return (
    type.includes("audio-processing-setup") ||
    type.includes("audio-processor-recovery")
  );
}

export type CallStatus =
  | "idle"
  | "connecting"
  | "starting"
  | "listening"
  | "thinking"
  | "speaking";

export function useVapi(book: IBook) {
  const { userId } = useAuth();
  // const { limits } = useSubscription();

  const [status, setStatus] = useState<CallStatus>("idle");
  const [messages, setMessages] = useState<Messages[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [currentUserMessage, setCurrentUserMessage] = useState("");
  const [duration, setDuration] = useState(0);
  const [limitError, setLimitError] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const isStoppingRef = useRef(false);
  const isStartingRef = useRef(false);
  const errorPriorityRef = useRef(-1);

  // Keep refs in sync with latest values for use in callbacks
  // const maxDurationRef = useLatestRef(limits.maxSessionMinutes * 60);
  const durationRef = useLatestRef(duration);
  const voice = book.persona || DEFAULT_VOICE;

  const handleFailure = useCallback((error: unknown) => {
    const feedback = getVoiceErrorMessage(error);
    console.warn(feedback.title + ": " + feedback.description);
    setStatus("idle");
    setCurrentMessage("");
    setCurrentUserMessage("");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (sessionIdRef.current) {
      const sessionId = sessionIdRef.current;
      sessionIdRef.current = null;
      endVoiceSession(sessionId, durationRef.current).catch((err) =>
        console.error("Failed to end voice session:", err),
      );
    }
    startTimeRef.current = null;

    // Keep the most useful error when the SDK reports the same failure repeatedly.
    if (feedback.priority <= errorPriorityRef.current) return;
    errorPriorityRef.current = feedback.priority;
    setLimitError(`${feedback.title}. ${feedback.description}`);
    toast.error(feedback.title, {
      id: VOICE_ERROR_TOAST_ID,
      description: feedback.description,
      duration: 12000,
      closeButton: true,
    });
  }, [durationRef]);

  // Set up Vapi event listeners
  useEffect(() => {
    let client: InstanceType<typeof Vapi> | null = null;
    let mounted = true;
    const handlers = {
      "call-start": () => {
        isStoppingRef.current = false;
        setStatus("starting"); // AI speaks first, wait for it
        setCurrentMessage("");
        setCurrentUserMessage("");

        // Start duration timer
        startTimeRef.current = Date.now();
        setDuration(0);
        timerRef.current = setInterval(() => {
          if (startTimeRef.current) {
            const newDuration = Math.floor(
              (Date.now() - startTimeRef.current) / TIMER_INTERVAL_MS,
            );
            setDuration(newDuration);

            // Check duration limit
            // if (newDuration >= maxDurationRef.current) {
            //     getVapi().stop();
            //     setLimitError(
            //         `Session time limit (${Math.floor(
            //             maxDurationRef.current / SECONDS_PER_MINUTE,
            //         )} minutes) reached. Upgrade your plan for longer sessions.`,
            //     );
            // }
          }
        }, TIMER_INTERVAL_MS);
      },

      "call-end": () => {
        // Don't reset isStoppingRef here - delayed events may still fire
        setStatus("idle");
        setCurrentMessage("");
        setCurrentUserMessage("");

        // Stop timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        // End session tracking
        if (sessionIdRef.current) {
          endVoiceSession(sessionIdRef.current, durationRef.current).catch(
            (err) => console.error("Failed to end voice session:", err),
          );
          sessionIdRef.current = null;
        }

        startTimeRef.current = null;
      },

      "speech-start": () => {
        if (!isStoppingRef.current) {
          setStatus("speaking");
        }
      },
      "speech-end": () => {
        if (!isStoppingRef.current) {
          // After AI finishes speaking, user can talk
          setStatus("listening");
        }
      },

      message: (message: {
        type: string;
        role: string;
        transcriptType: string;
        transcript: string;
        endedReason?: string;
      }) => {
        if (message.type === "status-update" &&
            message.endedReason === "assistant-did-not-receive-customer-audio" &&
            !isStoppingRef.current) {
          handleFailure(message);
          return;
        }
        if (message.type !== "transcript") return;

        // User finished speaking → AI is thinking
        if (message.role === "user" && message.transcriptType === "final") {
          if (!isStoppingRef.current) {
            setStatus("thinking");
          }
          setCurrentUserMessage("");
        }

        // Partial user transcript → show real-time typing
        if (message.role === "user" && message.transcriptType === "partial") {
          setCurrentUserMessage(message.transcript);
          return;
        }

        // Partial AI transcript → show word-by-word
        if (
          message.role === "assistant" &&
          message.transcriptType === "partial"
        ) {
          setCurrentMessage(message.transcript);
          return;
        }

        // Final transcript → add to messages
        if (message.transcriptType === "final") {
          if (message.role === "assistant") setCurrentMessage("");
          if (message.role === "user") setCurrentUserMessage("");

          setMessages((prev) => {
            const isDupe = prev.some(
              (m) =>
                m.role === message.role && m.content === message.transcript,
            );
            return isDupe
              ? prev
              : [...prev, { role: message.role, content: message.transcript }];
          });
        }
      },

      error: (error: unknown) => {
        // Vapi reports optional noise-cancellation failures through this event;
        // audio processing can fail while the voice call itself still connects.
        if (isNonFatalAudioProcessingError(error)) return;
        if (!isStoppingRef.current) handleFailure(error);
      },
      "camera-error": (error: unknown) => {
        // Daily uses this event for microphone errors too.
        if (isStoppingRef.current) return;
        handleFailure(error);
        isStoppingRef.current = true;
        void getVapi()
          .then((vapiClient) => vapiClient.stop())
          .catch((err) => console.error("Failed to stop call:", err));
      },
    };

    void getVapi()
      .then((vapiClient) => {
        if (!mounted) return;
        client = vapiClient;
        Object.entries(handlers).forEach(([event, handler]) => {
          vapiClient.on(event as keyof typeof handlers, handler as () => void);
        });
      })
      .catch(handleFailure);

    return () => {
      mounted = false;
      isStoppingRef.current = true;
      // End active session on unmount
      if (sessionIdRef.current) {
        client?.stop();
        endVoiceSession(sessionIdRef.current, durationRef.current).catch(
          (err) =>
            console.error("Failed to end voice session on unmount:", err),
        );
        sessionIdRef.current = null;
      }
      // Cleanup handlers
      if (client) {
        const activeClient = client;
        Object.entries(handlers).forEach(([event, handler]) => {
          activeClient.off(event as keyof typeof handlers, handler as () => void);
        });
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [durationRef, handleFailure]);

  const start = useCallback(async () => {
    if (isStartingRef.current || status !== "idle") return;
    if (!userId) {
      setLimitError("Please sign in to start a voice session.");
      toast.error("Please sign in to start a voice session.", { id: VOICE_ERROR_TOAST_ID });
      return;
    }

    isStartingRef.current = true;
    isStoppingRef.current = false;
    errorPriorityRef.current = -1;
    durationRef.current = 0;
    setDuration(0);
    setLimitError(null);
    toast.dismiss(VOICE_ERROR_TOAST_ID);
    setStatus("connecting");

    try {
      const [client, { assistantId }] = await Promise.all([
        getVapi(),
        getVapiConfig(),
      ]);
      if (isStoppingRef.current) return;

      // Check session limits and create session record
      const result = await startVoiceSession(userId, book._id);

      if (isStoppingRef.current) {
        if (result.sessionId) await endVoiceSession(result.sessionId, 0);
        return;
      }
      if (!result.success) {
        const message = result.error || "Unable to start a voice session. Please try again.";
        setLimitError(message);
        toast.error(message, { id: VOICE_ERROR_TOAST_ID });
        setStatus("idle");
        return;
      }

      sessionIdRef.current = result.sessionId || null;
      // Note: Server-returned maxDurationMinutes is informational only
      // The actual limit is enforced by useLatestRef(limits.maxSessionMinutes * 60)

      const firstMessage = `Hey, good to meet you. Quick question before we dive in - have you actually read ${book.title} yet, or are we starting fresh?`;

      const call = await client.start(assistantId, {
        firstMessage,
        variableValues: {
          title: book.title,
          author: book.author,
          bookId: book._id,
        },
        voice: {
          provider: "11labs" as const,
          voiceId: getVoice(voice).id,
          model: "eleven_turbo_v2_5" as const,
          stability: VOICE_SETTINGS.stability,
          similarityBoost: VOICE_SETTINGS.similarityBoost,
          style: VOICE_SETTINGS.style,
          useSpeakerBoost: VOICE_SETTINGS.useSpeakerBoost,
        },
      });
      // The SDK can report an error event and resolve with null instead of throwing.
      if (!call && !isStoppingRef.current) handleFailure(new Error("Call failed to start"));
    } catch (err) {
      if (!isStoppingRef.current) handleFailure(err);
    } finally {
      isStartingRef.current = false;
    }
  }, [book._id, book.title, book.author, voice, userId, status, durationRef, handleFailure]);

  const stop = useCallback(() => {
    isStoppingRef.current = true;
    void getVapi()
      .then((client) => client.stop())
      .catch(handleFailure);
  }, [handleFailure]);

  const clearError = useCallback(() => {
    setLimitError(null);
    toast.dismiss(VOICE_ERROR_TOAST_ID);
  }, []);

  const isActive =
    status === "starting" ||
    status === "listening" ||
    status === "thinking" ||
    status === "speaking";

  // Calculate remaining time
  // const maxDurationSeconds = limits.maxSessionMinutes * SECONDS_PER_MINUTE;
  // const remainingSeconds = Math.max(0, maxDurationSeconds - duration);
  // const showTimeWarning =
  //     isActive && remainingSeconds <= TIME_WARNING_THRESHOLD && remainingSeconds > 0;

  return {
    status,
    isActive,
    messages,
    currentMessage,
    currentUserMessage,
    duration,
    start,
    stop,
    limitError,
    clearError,
    // maxDurationSeconds,
    // remainingSeconds,
    // showTimeWarning,
  };
}

export default useVapi;
