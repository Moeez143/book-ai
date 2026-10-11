'use client';

import React from 'react'
import { Mic, MicOff } from "lucide-react";
import Image from "next/image";
import { IBook } from "@/types";
import useVapi from '@/hooks/useVapi';
import Transcript from "@/components/Transcript";

function VapiControls({ book }: { book: IBook }) {
    const { status,
        isActive,
        messages,
        currentMessage,
        currentUserMessage,
        duration,
        limitError,
        start,
        stop } = useVapi(book);

    return (
        <div className="vapi-main-container">
            <section className="vapi-header-card w-full">
                <div className="vapi-cover-wrapper">
                    <Image
                        src={book.coverURL || "/assets/book-cover.svg"}
                        alt={`${book.title} cover`}
                        width={120}
                        height={180}
                        unoptimized
                        className="vapi-cover-image h-45! w-30!"
                    />
                    <div className="vapi-mic-wrapper">
                        {(status === "thinking" || status === "speaking") && (
                            <span className="vapi-pulse-ring" aria-hidden="true" />
                        )}
                        <button
                            type="button"
                            onClick={isActive ? stop : start}
                            disabled={status === "connecting"}
                            className={`vapi-mic-btn shadow-md w-16! h-16! ${isActive ? "vapi-mic-btn-active" : "vapi-mic-btn-inactive"}`}
                            aria-label={isActive ? "Stop conversation" : "Start conversation"}
                            title={isActive ? "Stop conversation" : "Start conversation"}
                        >
                            {isActive ? (
                                <Mic className="h-6 w-6 text-[#212a3b]" />
                            ) : (
                                <MicOff className="h-6 w-6 text-[#212a3b]" />
                            )}
                        </button>
                    </div>
                </div>

                <div className="min-w-0 flex-1">
                    <h1 className="font-serif text-2xl font-bold leading-tight text-[#212a3b] sm:text-3xl">
                        {book.title}
                    </h1>
                    <p className="mt-1 text-base text-[#3d485e]">by {book.author}</p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="vapi-status-indicator">
                            <span className="vapi-status-dot vapi-status-dot-ready" />
                            <span className="vapi-status-text">Ready</span>
                        </span>
                        <span className="vapi-badge-ai">
                            <span className="vapi-badge-ai-text">Voice: {book.persona || "Default"}</span>
                        </span>
                        <span className="vapi-badge-ai">
                            <span className="vapi-badge-ai-text">0:00/15:00</span>
                        </span>
                    </div>
                </div>
            </section>

            {limitError && (
                <p className="mt-3 text-sm text-red-700" role="alert">
                    {limitError}
                </p>
            )}

            <div className="vapi-transcript-wrapper mt-6 w-full">
                <Transcript
                    messages={messages}
                    currentMessage={currentMessage}
                    currentUserMessage={currentUserMessage}
                />
            </div>
        </div>
    )
}

export default VapiControls