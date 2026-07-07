"use client"

import { SignInButton, useAuth } from "@clerk/nextjs"
import { LoaderCircle } from "lucide-react"

import UploadForm from "@/components/UploadForm"

function BookUploadAuthGate() {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className="new-book-wrapper flex min-h-[320px] items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-[#663820]" />
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="new-book-wrapper rounded-[10px] bg-white p-8 text-center shadow-soft">
        <h2 className="section-title">Sign in to add a book</h2>
        <p className="subtitle mt-3 text-base">
          Your library needs an account before a new book can be saved.
        </p>
        <SignInButton mode="modal">
          <button type="button" className="btn-primary mt-6">
            Sign in
          </button>
        </SignInButton>
      </div>
    )
  }

  return <UploadForm />
}

export default BookUploadAuthGate
