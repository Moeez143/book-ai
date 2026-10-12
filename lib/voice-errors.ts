export interface VoiceErrorMessage {
  title: string;
  description: string;
  priority: number;
}

// Vapi wraps browser and Daily errors in several nested objects.
function errorDetails(error: unknown, depth = 0): string {
  if (depth > 5 || error == null) return "";
  if (typeof error === "string") return error.toLowerCase();
  if (typeof error !== "object") return "";
  const record = error as Record<string, unknown>;
  return ["name", "message", "msg", "errorMsg", "type", "code", "stage", "error", "cause", "endedReason"]
    .map((key) => errorDetails(record[key], depth + 1))
    .join(" ");
}

export function getVoiceErrorMessage(error: unknown): VoiceErrorMessage {
  const details = errorDetails(error);

  if (/notallowederror|permissiondeniederror|permission denied|microphone permission|customer-did-not-give-microphone-permission/.test(details)) {
    return {
      title: "Microphone permission needed",
      description: "Allow microphone access for this site in your browser settings, then try again.",
      priority: 3,
    };
  }

  if (/notfounderror|devicesnotfounderror|no microphone|microphone not found|overconstrainederror/.test(details)) {
    return {
      title: "No microphone detected",
      description: "Connect a microphone or choose an available input device, then try again.",
      priority: 3,
    };
  }

  if (/notreadableerror|trackstarterror|mic-in-use|microphone unavailable/.test(details)) {
    return {
      title: "Microphone unavailable",
      description: "Another app may be using the microphone. Close it or reconnect your headset, then try again.",
      priority: 3,
    };
  }

  if (/microphone-unsupported|undefined-mediadevices/.test(details)) {
    return {
      title: "Microphone access unavailable",
      description: "Open this page in a browser that supports microphone access over HTTPS, then try again.",
      priority: 3,
    };
  }

  if (/meeting has ended|ejected|daily-call-join-error|assistant-did-not-receive-customer-audio/.test(details)) {
    return {
      title: "Voice service ended the call",
      description: "The call ended before it connected. Please try again in a moment. If this keeps happening, contact support.",
      priority: 2,
    };
  }

  if (/timeout|timed out|network|connection|websocket/.test(details)) {
    return {
      title: "Could not connect to the voice service",
      description: "Check your internet connection and try again. If the problem continues, contact support.",
      priority: 2,
    };
  }

  if (/daily-error|vapi|server|api error|call.start.error|assistant-request/.test(details)) {
    return {
      title: "Voice service error",
      description: "The voice service could not start the call. Please try again in a moment. If this keeps happening, contact support.",
      priority: 1,
    };
  }

  return {
    title: "Unable to start the voice session",
    description: "Please try again in a moment. If this keeps happening, contact support.",
    priority: 0,
  };
}
