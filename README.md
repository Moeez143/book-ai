# Bookified

Bookified is a web app for exploring books through voice conversations. Upload a PDF, open its book page, and ask questions. A Vapi assistant can search the uploaded book's text for relevant passages while you talk.

## Features

- Upload PDF books up to 50 MB, with an optional custom cover. PDFs and covers are stored in Vercel Blob; extracted text segments are stored in MongoDB.
- Search the library by title or author. Searches are case-insensitive, use a 500 ms debounce, and are reflected in the URL so results can be shared.
- Start and stop voice conversations with a book, view the live transcript and session timer, and return to a book through its direct link.
- Retrieve the top three matching book segments through the Vapi `searchBook` tool.
- Sign in with Clerk and choose a Free, Standard, or Pro subscription. Book and voice-session limits are checked on the server.
- View voice-session history on paid plans.

## Tech stack

Next.js 16, React 19, TypeScript, Tailwind CSS, MongoDB/Mongoose, Clerk Authentication and Billing, Vapi, and Vercel Blob.

## Run locally

You need Node.js, a MongoDB database, a Clerk application, a Vapi assistant, and a Vercel Blob store.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create `.env.local` in the project root:

   ```dotenv
   MONGODB_URI=your_mongodb_connection_string
   CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
   CLERK_SECRET_KEY=sk_test_your_clerk_secret_key
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
   NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
   VAPI_KEY=your_vapi_web_public_key
   VAPI_ASSISTANT_ID=your_vapi_assistant_id
   ```

   `CLERK_PUBLISHABLE_KEY` is deliberately provided to Clerk's browser components by the app; it is a publishable key. Keep `CLERK_SECRET_KEY`, `MONGODB_URI`, and `BLOB_READ_WRITE_TOKEN` private. `.env.local` is ignored by Git.

3. In the Clerk Dashboard, enable Billing for users and configure plans with the slugs `standard` and `pro`. Users without a paid subscription use the Free limits. The plan limits enforced by the app are:

   | Plan | Books | Voice sessions per calendar month | Maximum session length | Session history |
   | --- | ---: | ---: | ---: | --- |
   | Free | 1 | 2 | 5 minutes | No |
   | Standard | 5 | 20 | 15 minutes | Yes |
   | Pro | 50 | Unlimited | 60 minutes | Yes |

4. Configure your Vapi assistant's `searchBook` tool to send `bookId` and `query` to `POST https://YOUR_DOMAIN/api/vapi/search-book`. Use a public URL that Vapi can reach; `localhost` will not work for Vapi webhooks.

5. Start the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Deploy

Deploy the project to Vercel and add the same environment variables to the Vercel project. Connect a Vercel Blob store and allow the deployment to reach MongoDB. Set the Vapi tool URL to the deployed app's `/api/vapi/search-book` route.

Clerk development keys support test-card checkout. To accept real payments, create a Clerk Production instance, connect its billing to a live Stripe account, configure the same plan slugs, and use its live Clerk keys in Vercel's Production environment. Clerk Production requires a domain you own; a `*.vercel.app` address is suitable for testing, but not for Clerk Production.