"use client";

import { Mic } from "lucide-react";
import { useEffect, useRef } from "react";
import { Messages } from "@/types";

interface TranscriptProps {
    messages: Messages[];
    currentMessage: string;
    currentUserMessage: string;
}

function Transcript({ messages, currentMessage, currentUserMessage }: TranscriptProps) {
    const bottomRef = useRef<HTMLDivElement>(null);
    const hasConversation = messages.length > 0 || Boolean(currentMessage || currentUserMessage);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
            <div className="transcript-messages" aria-live="polite">
                {messages.map((item, index) => {
                    const isUser = item.role === "user";

                    return (
                        <div
                            className={`transcript-message ${isUser ? "transcript-message-user" : "transcript-message-assistant"}`}
                            key={`${item.role}-${index}`}
                        >
                            <p
                                className={`transcript-bubble ${isUser ? "transcript-bubble-user" : "transcript-bubble-assistant"}`}
                            >
                                {item.content}
                            </p>
                        </div>
                    );
                })}

                {currentMessage && (
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

                <div ref={bottomRef} aria-hidden="true" />
            </div>
        </div>
    );
}

export default Transcript;