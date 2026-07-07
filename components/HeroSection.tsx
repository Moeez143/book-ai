'use client'

import Link from "next/link";
import Image from 'next/image'

export default function HeroSection() {
  return (
    <section className="mb-10 md:mb-16">
      <div className="library-hero-card">
        <div className="library-hero-content">
          {/* Left Section */}
          <div className="library-hero-text">
            <h1 className="library-hero-title">Your Library</h1>
            <p className="library-hero-description">
              Convert your books into interactive AI conversations. Listen, learn, and discuss your favorite reads.
            </p>
            <Link href="/books/new" className="library-cta-primary">
              <span>+</span> Add new book
            </Link>
          </div>

          {/* Center Section - Illustration */}
          <div className="library-hero-illustration-desktop">
            <Image
              src="/assets/hero-illustration.png"
              alt="Books, globe, and lamp illustration"
              width={500}
              height={300}
              priority
              className="object-contain max-w-md"
            />
          </div>

          {/* Right Section - Steps Card */}
          <div className="library-steps-card">
            <div className="library-step-item">
              <span className="library-step-number">1</span>
              <div className="flex-1">
                <h3 className="library-step-title">Upload PDF</h3>
                <p className="library-step-description">Add your book file</p>
              </div>
            </div>

            <div className="library-step-item" style={{ marginTop: '1.5rem' }}>
              <span className="library-step-number">2</span>
              <div className="flex-1">
                <h3 className="library-step-title">AI Processing</h3>
                <p className="library-step-description">We analyze the content</p>
              </div>
            </div>

            <div className="library-step-item" style={{ marginTop: '1.5rem' }}>
              <span className="library-step-number">3</span>
              <div className="flex-1">
                <h3 className="library-step-title">Voice Chat</h3>
                <p className="library-step-description">Discuss with AI</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
