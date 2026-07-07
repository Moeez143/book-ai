import BookUploadAuthGate from "@/components/BookUploadAuthGate"

function page() {
  return (
    <main className="wrapper container">
      <div className="mx-auto max-w-180 space-y-10">
        <section className="flex flex-col gap-5">
          <h1 className="page-title-xl">Add a New Book</h1>
          <p className="subtitle">Upload a PDF to generate your interactive AI conversation.</p>
        </section>

        <BookUploadAuthGate />
      </div>  
    </main>
  )
}

export default page