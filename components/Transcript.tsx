"use client";

import { Mic } from "lucide-react";
import { useEffect, useRef } from "react";
import { joinAssistantTranscript } from "@/lib/voice-transcript";
import { Messages } from "@/types";

interface TranscriptProps {
  messages: Messages[];
  currentMessage: string;
  currentUserMessage: string;
}

function Transcript({ messages, currentMessage, currentUserMessage }: TranscriptProps) {
  const messagesRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const hasConversation = messages.length > 0 || Boolean(currentMessage || currentUserMessage);
  const lastAssistantIndex =
    messages.length > 0 && messages[messages.length - 1].role === "assistant"
      ? messages.length - 1
      : -1;
  const hasInlineAssistantDraft = Boolean(currentMessage) && lastAssistantIndex >= 0;

  useEffect(() => {
    const container = messagesRef.current;
    if (container && shouldAutoScrollRef.current) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages, currentMessage, currentUserMessage]);

  if (!hasConversation) {
    return (
      <div className="transcript-container">
        <div className="transcript-empty">
          <Mic className="mb-4 h-12 w-12 text-[#212a3b]" />
          <p className="transcript-empty-text">No conversation yet</p>
          <p className="transcript-empty-hint">Click the mic button above to start talking</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transcript-container">
      <div
        className="transcript-messages"
        aria-live="polite"
        ref={messagesRef}
        onScroll={(event) => {
          const container = event.currentTarget;
          shouldAutoScrollRef.current =
            container.scrollHeight - container.scrollTop - container.clientHeight < 48;
        }}
      >
        {messages.map((item, index) => {
          const isUser = item.role === "user";
          const showAssistantDraft = hasInlineAssistantDraft && index === lastAssistantIndex;
          const content = showAssistantDraft
            ? joinAssistantTranscript(item.content, currentMessage)
            : item.content;

          return (
            <div
              className={"transcript-message " + (isUser ? "transcript-message-user" : "transcript-message-assistant")}
              key={item.role + "-" + index}
            >
              <p className={"transcript-bubble " + (isUser ? "transcript-bubble-user" : "transcript-bubble-assistant")}>
                {content}
                {showAssistantDraft && <span className="transcript-cursor" aria-hidden="true" />}
              </p>
            </div>
          );
        })}

        {currentMessage && !hasInlineAssistantDraft && (
          <div className="transcript-message transcript-message-assistant">
            <p className="transcript-bubble transcript-bubble-assistant">
              {currentMessage}
              <span className="transcript-cursor" aria-hidden="true" />
            </p>
          </div>
        )}

        {currentUserMessage && (
          <div className="transcript-message transcript-message-user">
            <p className="transcript-bubble transcript-bubble-user">
              {currentUserMessage}
              <span className="transcript-cursor" aria-hidden="true" />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Transcript;