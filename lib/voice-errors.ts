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
  return ["name", "message", "msg", "errorMsg", "type", "error", "cause", "endedReason"]
    .map((key) => errorDetails(record[key], depth + 1))
    .join(" ");
}

export function getVoiceErrorMessage(error: unknown): VoiceErrorMessage {
  const details = errorDetails(error);
  if (/notallowederror|permissiondeniederror|securityerror|permissions|permission denied|not-allowed|customer-did-not-give-microphone-permission/.test(details)) {
    return {
      title: "Microphone access blocked",
      description: "Allow microphone access in your browser's site settings and your system privacy settings, then try again. If you use a headset, check that its microphone is selected.",
      priority: 3,
    };
  }
  if (/notfounderror|devicesnotfounderror|not-found|overconstrainederror/.test(details)) {
    return {
      title: "No microphone detected",
      description: "Connect a microphone or select your built-in microphone in system sound settings. If your headset is not detected, reconnect it or unplug it and try again.",
      priority: 3,
    };
  }
  if (/notreadableerror|trackstarterror|aborterror|mic-in-use/.test(details)) {
    return {
      title: "Microphone unavailable",
      description: "Close other apps using your microphone and check your system microphone permissions. Reconnect your headset, or unplug it to use the built-in microphone, then try again.",
      priority: 3,
    };
  }
  if (/microphone-unsupported|undefined-mediadevices/.test(details)) {
    return {
      title: "Microphone access unavailable",
      description: "Open this site over HTTPS in a browser that supports microphone access, then try again.",
      priority: 3,
    };
  }
  if (/assistant-did-not-receive-customer-audio|daily-call-join-error|meeting has ended/.test(details)) {
    return {
      title: "Voice connection ended",
      description: "Check your microphone permissions, selected input, and internet connection. If you use a headset, reconnect it or try the built-in microphone, then start again.",
      priority: 2,
    };
  }
  if (/network|connection/.test(details)) {
    return {
      title: "Voice connection lost",
      description: "Check your internet connection and try starting the conversation again.",
      priority: 1,
    };
  }
  return {
    title: "Unable to continue the conversation",
    description: "Please try starting the conversation again. If the problem continues, check your microphone and headset settings.",
    priority: 0,
  };
}

export async function checkMicrophoneAccess(
  mediaDevices: Pick<MediaDevices, "getUserMedia"> | undefined,
): Promise<void> {
  if (!mediaDevices?.getUserMedia) throw new Error("microphone-unsupported");
  const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
  // Release the test stream before Vapi opens its own audio connection.
  stream.getTracks().forEach((track) => track.stop());
}
