Based on my research, I've compiled comprehensive Next.js 16.1.7 documentation for you. Here's the complete documentation in markdown format:

---

# Next.js 16.1.7 Documentation

**Version:** 16.1.7 (Latest)  
**Last Updated:** March 16, 2026

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Installation](#installation)
3. [Project Structure](#project-structure)
4. [Layouts and Pages](#layouts-and-pages)
5. [Linking and Navigating](#linking-and-navigating)
6. [Server and Client Components](#server-and-client-components)
7. [Cache Components](#cache-components)
8. [Fetching Data](#fetching-data)
9. [Updating Data](#updating-data)
10. [Caching and Revalidating](#caching-and-revalidating)
11. [Error Handling](#error-handling)
12. [CSS](#css)
13. [Image Optimization](#image-optimization)
14. [Font Optimization](#font-optimization)
15. [Metadata](#metadata)
16. [Deploying](#deploying)
17. [API Reference](#api-reference)
18. [Configuration](#configuration)

---

## Getting Started {#getting-started}

### What is Next.js?

Next.js is a React framework for building full-stack web applications. You use React Components to build user interfaces, and Next.js for additional features and optimizations.

It also automatically configures lower-level tools like bundlers and compilers. You can instead focus on building your product and shipping quickly.

### App Router and Pages Router

Next.js has two different routers:

- **App Router**: The newer router that supports new React features like Server Components
- **Pages Router**: The original router, still supported and being improved

### React Version Handling

- **App Router**: Uses React canary releases built-in, which include all the stable React 19 changes
- **Pages Router**: Uses the React version installed in your project's `package.json`

---

## Installation {#installation}

### Quick Start

```bash
pnpm create next-app@latest my-app --yes
cd my-app
pnpm dev
```

- `--yes` skips prompts using saved preferences or defaults
- Default setup enables TypeScript, Tailwind, ESLint, App Router, and Turbopack

### System Requirements

- Minimum Node.js version: 20.9
- Operating systems: macOS, Windows (including WSL), and Linux

### Supported Browsers

- Chrome 111+
- Edge 111+
- Firefox 111+
- Safari 16.4+

### Create with the CLI

```bash
pnpm create next-app
```

Installation prompts:
```
What is your project named? my-app
Would you like to use the recommended Next.js defaults?
    Yes, use recommended defaults - TypeScript, ESLint, Tailwind CSS, App Router, Turbopack
    No, reuse previous settings
    No, customize settings - Choose your own preferences
```

### Manual Installation

```bash
pnpm i next@latest react@latest react-dom@latest
```

Add scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "lint:fix": "eslint --fix"
  }
}
```

### Set up TypeScript

Minimum TypeScript version: `v5.1.0`

Next.js comes with built-in TypeScript support. Rename a file to `.ts`/`.tsx` and run `next dev`.

### Set up Linting

**ESLint** (comprehensive rules):
```json
{
  "scripts": {
    "lint": "eslint",
    "lint:fix": "eslint --fix"
  }
}
```

**Biome** (fast linter + formatter):
```json
{
  "scripts": {
    "lint": "biome check",
    "format": "biome format --write"
  }
}
```

---

## Project Structure {#project-structure}

### Top-level Folders

| Folder | Description |
|--------|-------------|
| `app` | App Router |
| `pages` | Pages Router |
| `public` | Static assets to be served |
| `src` | Optional application source folder |

### Top-level Files

| File | Description |
|------|-------------|
| `next.config.js` | Configuration file for Next.js |
| `package.json` | Project dependencies and scripts |
| `instrumentation.ts` | OpenTelemetry and Instrumentation file |
| `proxy.ts` | Next.js request proxy |
| `.env` | Environment variables |
| `eslint.config.mjs` | Configuration file for ESLint |
| `tsconfig.json` | Configuration file for TypeScript |

### Routing Files

| File | Extensions | Description |
|------|------------|-------------|
| `layout` | `.js`, `.jsx`, `.tsx` | Layout |
| `page` | `.js`, `.jsx`, `.tsx` | Page |
| `loading` | `.js`, `.jsx`, `.tsx` | Loading UI |
| `not-found` | `.js`, `.jsx`, `.tsx` | Not found UI |
| `error` | `.js`, `.jsx`, `.tsx` | Error UI |
| `global-error` | `.js`, `.jsx`, `.tsx` | Global error UI |
| `route` | `.js`, `.ts` | API endpoint |
| `template` | `.js`, `.jsx`, `.tsx` | Re-rendered layout |

### Dynamic Routes

| Path | URL Pattern |
|------|-------------|
| `app/blog/[slug]/page.tsx` | `/blog/my-first-post` |
| `app/shop/[...slug]/page.tsx` | `/shop/clothing`, `/shop/clothing/shirts` |
| `app/docs/[[...slug]]/page.tsx` | `/docs`, `/docs/layouts-and-pages` |

### Route Groups and Private Folders

| Path | URL Pattern | Notes |
|------|-------------|-------|
| `app/(marketing)/page.tsx` | `/` | Group omitted from URL |
| `app/(shop)/cart/page.tsx` | `/cart` | Share layouts within `(shop)` |
| `app/blog/_components/Post.tsx` | — | Not routable |

---

## Layouts and Pages {#layouts-and-pages}

### Creating a Page

A **page** is UI that is rendered on a specific route:

```tsx
export default function Page() {
  return <h1>Hello Next.js!</h1>
}
```

### Creating a Layout

A layout is UI that is **shared** between multiple pages:

```tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
```

### Creating a Dynamic Segment

```tsx
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)

  return (
    <div>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </div>
  )
}
```

### Rendering with Search Params

```tsx
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const filters = (await searchParams).filters
}
```

### Linking Between Pages

```tsx
import Link from 'next/link'

export default async function Post({ post }) {
  const posts = await getPosts()

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.slug}>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </li>
      ))}
    </ul>
  )
}
```

---

## Linking and Navigating {#linking-and-navigating}

### How Navigation Works

Next.js uses:
- **Server Rendering** - Layouts and Pages are React Server Components by default
- **Prefetching** - Routes are prefetched when links enter viewport
- **Streaming** - Parts of dynamic routes sent as soon as ready
- **Client-side transitions** - Updates content dynamically without full page reload

### Prefetching

```tsx
import Link from 'next/link'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <nav>
          <Link href="/blog">Blog</Link> {/* Prefetched */}
          <a href="/contact">Contact</a> {/* No prefetching */}
        </nav>
        {children}
      </body>
    </html>
  )
}
```

### Streaming with loading.tsx

```tsx
export default function Loading() {
  return <LoadingSkeleton />
}
```

### Disabling Prefetching

```tsx
<Link prefetch={false} href="/blog">
  Blog
</Link>
```

### Using Native History API

```tsx
'use client'

import { useSearchParams } from 'next/navigation'

export default function SortProducts() {
  const searchParams = useSearchParams()

  function updateSorting(sortOrder: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('sort', sortOrder)
    window.history.pushState(null, '', `?${params.toString()}`)
  }

  return (
    <>
      <button onClick={() => updateSorting('asc')}>Sort Ascending</button>
      <button onClick={() => updateSorting('desc')}>Sort Descending</button>
    </>
  )
}
```

---

## Server and Client Components {#server-and-client-components}

### When to Use Each

**Use Client Components when you need:**
- State and event handlers (`onClick`, `onChange`)
- Lifecycle logic (`useEffect`)
- Browser-only APIs (`localStorage`, `window`)
- Custom hooks

**Use Server Components when you need:**
- Fetch data from databases or APIs
- Use API keys and secrets
- Reduce JavaScript bundle size
- Improve First Contentful Paint (FCP)

### Creating a Client Component

```tsx
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>{count} likes</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  )
}
```

### Passing Data from Server to Client

```tsx
// Server Component
import LikeButton from '@/app/ui/like-button'

export default async function Page({ params }) {
  const { id } = await params
  const post = await getPost(id)

  return <LikeButton likes={post.likes} />
}

// Client Component
'use client'

export default function LikeButton({ likes }) {
  // ...
}
```

### Preventing Environment Poisoning

```tsx
// lib/data.ts
import 'server-only'

export async function getData() {
  const res = await fetch('https://external-service.com/data', {
    headers: {
      authorization: process.env.API_KEY,
    },
  })
  return res.json()
}
```

---

## Cache Components {#cache-components}

### Enabling Cache Components

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
}

export default nextConfig
```

### Using `use cache`

```tsx
import { cacheLife } from 'next/cache'

export default async function Page() {
  'use cache'
  cacheLife('hours')

  const users = await db.query('SELECT * FROM users')

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}
```

### Cache Life Configuration

```tsx
import { cacheLife } from 'next/cache'

export default async function Page() {
  'use cache'
  cacheLife({
    stale: 3600,    // 1 hour until considered stale
    revalidate: 7200, // 2 hours until revalidated
    expire: 86400,  // 1 day until expired
  })
}
```

### Tagging and Revalidating

```tsx
// With updateTag (immediate)
import { cacheTag, updateTag } from 'next/cache'

export async function getCart() {
  'use cache'
  cacheTag('cart')
}

export async function updateCart(itemId: string) {
  'use server'
  updateTag('cart')
}

// With revalidateTag (stale-while-revalidate)
import { cacheTag, revalidateTag } from 'next/cache'

export async function createPost(post: FormData) {
  'use server'
  revalidateTag('posts', 'max')
}
```

---

## Fetching Data {#fetching-data}

### Server Components

```tsx
// With fetch API
export default async function Page() {
  const data = await fetch('https://api.vercel.app/blog')
  const posts = await data.json()
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

// With ORM/Database
import { db, posts } from '@/lib/db'

export default async function Page() {
  const allPosts = await db.select().from(posts)
  return (
    <ul>
      {allPosts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Client Components

```tsx
// With React's use API
'use client'
import { use } from 'react'

export default function Posts({ posts }: { posts: Promise<any[]> }) {
  const allPosts = use(posts)
  return (
    <ul>
      {allPosts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

// With SWR
'use client'
import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((r) => r.json())

export default function BlogPage() {
  const { data, error, isLoading } = useSWR(
    'https://api.vercel.app/blog',
    fetcher
  )

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

### Parallel Data Fetching

```tsx
export default async function Page({ params }) {
  const { username } = await params

  // Initiate requests in parallel
  const artistData = getArtist(username)
  const albumsData = getAlbums(username)

  const [artist, albums] = await Promise.all([artistData, albumsData])

  return (
    <>
      <h1>{artist.name}</h1>
      <Albums list={albums} />
    </>
  )
}
```

---

## Updating Data {#updating-data}

### Creating Server Functions

```tsx
// app/lib/actions.ts
export async function createPost(formData: FormData) {
  'use server'
  const title = formData.get('title')
  const content = formData.get('content')

  // Update data
  // Revalidate cache
}
```

### Invoking Server Functions

```tsx
// In Forms
import { createPost } from '@/app/actions'

export function Form() {
  return (
    <form action={createPost}>
      <input type="text" name="title" />
      <input type="text" name="content" />
      <button type="submit">Create</button>
    </form>
  )
}

// In Event Handlers
'use client'

import { incrementLike } from './actions'
import { useState } from 'react'

export default function LikeButton({ initialLikes }) {
  const [likes, setLikes] = useState(initialLikes)

  return (
    <>
      <p>Total Likes: {likes}</p>
      <button
        onClick={async () => {
          const updatedLikes = await incrementLike()
          setLikes(updatedLikes)
        }}
      >
        Like
      </button>
    </>
  )
}
```

### Revalidating After Mutation

```tsx
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  'use server'
  // Update data

  revalidatePath('/posts')
}
```

### Redirecting After Mutation

```tsx
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  // Update data

  revalidatePath('/posts')
  redirect('/posts')
}
```

---

## Caching and Revalidating {#caching-and-revalidating}

### fetch with Caching

```tsx
// Cache individual requests
export default async function Page() {
  const data = await fetch('https://...', { cache: 'force-cache' })
}

// Revalidate after specified seconds
export default async function Page() {
  const data = await fetch('https://...', { next: { revalidate: 3600 } })
}

// Tag fetch requests
export async function getUserById(id: string) {
  const data = await fetch(`https://...`, {
    next: {
      tags: ['user'],
    },
  })
}
```

### cacheTag

```tsx
import { cacheTag } from 'next/cache'

export async function getProducts() {
  'use cache'
  cacheTag('products')

  const products = await db.query('SELECT * FROM products')
  return products
}
```

### revalidateTag

```tsx
import { revalidateTag } from 'next/cache'

export async function updateUser(id: string) {
  // Mutate data
  revalidateTag('user', 'max') // Recommended: Uses stale-while-revalidate
}
```

### updateTag

```tsx
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  // Create post in database
  const post = await db.post.create({
    data: {
      title: formData.get('title'),
      content: formData.get('content'),
    },
  })

  // Immediately expire cache
  updateTag('posts')
  updateTag(`post-${post.id}`)

  redirect(`/posts/${post.id}`)
}
```

### revalidatePath

```tsx
import { revalidatePath } from 'next/cache'

export async function updateUser(id: string) {
  // Mutate data
  revalidatePath('/profile')
}
```

---

## Error Handling {#error-handling}

### Handling Expected Errors

```tsx
// Server Functions
'use server'

export async function createPost(prevState: any, formData: FormData) {
  const title = formData.get('title')
  const content = formData.get('content')

  const res = await fetch('https://api.vercel.app/posts', {
    method: 'POST',
    body: { title, content },
  })
  const json = await res.json()

  if (!res.ok) {
    return { message: 'Failed to create post' }
  }
}

// With useActionState
'use client'

import { useActionState } from 'react'
import { createPost } from '@/app/actions'

const initialState = { message: '' }

export function Form() {
  const [state, formAction, pending] = useActionState(createPost, initialState)

  return (
    <form action={formAction}>
      <input type="text" id="title" name="title" required />
      <textarea id="content" name="content" required />
      {state?.message && <p aria-live="polite">{state.message}</p>}
      <button disabled={pending}>Create Post</button>
    </form>
  )
}
```

### Not Found

```tsx
// app/blog/[slug]/page.tsx
import { notFound } from 'next/navigation'

export default async function Page({ params }) {
  const { slug } = await params
  const post = getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  return <div>{post.title}</div>
}

// app/blog/[slug]/not-found.tsx
export default function NotFound() {
  return <div>404 - Page Not Found</div>
}
```

### Error Boundaries

```tsx
// app/dashboard/error.tsx
'use client'

import { useEffect } from 'react'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

### Global Errors

```tsx
// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  )
}
```

---

## CSS {#css}

### Tailwind CSS

```bash
pnpm add -D tailwindcss @tailwindcss/postcss
```

```mjs
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

```css
/* globals.css */
@import 'tailwindcss';
```

```tsx
// app/layout.tsx
import './globals.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

### CSS Modules

```css
/* blog.module.css */
.blog {
  padding: 24px;
}
```

```tsx
import styles from './blog.module.css'

export default function Page() {
  return <main className={styles.blog}></main>
}
```

### Global CSS

```css
/* app/global.css */
body {
  padding: 20px 20px 60px;
  max-width: 680px;
  margin: 0 auto;
}
```

```tsx
import './global.css'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

---

## Image Optimization {#image-optimization}

### Basic Usage

```tsx
import Image from 'next/image'
import profilePic from '../public/profile.png'

export default function Page() {
  return (
    <Image
      src={profilePic}
      alt="Picture of the author"
      width={500}
      height={500}
    />
  )
}
```

### Remote Images

```tsx
import Image from 'next/image'

export default function Page() {
  return (
    <Image
      src="https://s3.amazonaws.com/my-bucket/profile.png"
      alt="Picture of the author"
      width={500}
      height={500}
    />
  )
}
```

### Configuration

```js
// next.config.js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 's3.amazonaws.com',
        port: '',
        pathname: '/my-bucket/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 14400,
    qualities: [25, 50, 75, 100],
  },
}
```

### Responsive Images

```tsx
import Image from 'next/image'
import mountains from '../public/mountains.jpg'

export default function Responsive() {
  return (
    <Image
      alt="Mountains"
      src={mountains}
      sizes="100vw"
      style={{
        width: '100%',
        height: 'auto',
      }}
    />
  )
}
```

### Fill Layout

```tsx
<div style={{ position: 'relative', width: '400px' }}>
  <Image
    alt="Mountains"
    src={mountains}
    fill
    sizes="(min-width: 808px) 50vw, 100vw"
    style={{ objectFit: 'cover' }}
  />
</div>
```

---

## Font Optimization {#font-optimization}

### Google Fonts

```tsx
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

### Local Fonts

```tsx
import localFont from 'next/font/local'

const myFont = localFont({
  src: './my-font.woff2',
  display: 'swap',
})

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={myFont.className}>
      <body>{children}</body>
    </html>
  )
}
```

### With Tailwind CSS

```tsx
import { Inter, Roboto_Mono } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const roboto_mono = Roboto_Mono({
  subsets: ['latin'],
  variable: '--font-roboto-mono',
})

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${roboto_mono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
```

```css
/* global.css */
@import 'tailwindcss';

@theme inline {
  --font-sans: var(--font-inter);
  --font-mono: var(--font-roboto-mono);
}
```

---

## Deploying {#deploying}

### Deployment Options

| Option | Feature Support |
|--------|----------------|
| Node.js server | All |
| Docker container | All |
| Static export | Limited |
| Adapters | Platform-specific |

### Node.js Server

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

```bash
npm run build
npm run start
```

### Docker

Next.js can be deployed to any provider that supports Docker containers.

### Static Export

```js
// next.config.js
module.exports = {
  output: 'export',
}
```

### Platform Adapters

- Appwrite Sites
- AWS Amplify Hosting
- Cloudflare
- Deno Deploy
- Firebase App Hosting
- Netlify
- Vercel

---

## API Reference {#api-reference}

### Components

| Component | Description |
|-----------|-------------|
| `Font` | Optimizing loading web fonts with `next/font` |
| `Form` | Handle form submissions with client-side navigation |
| `Image` | Optimize images with `next/image` |
| `Link` | Fast client-side navigation with `next/link` |
| `Script` | Optimize third-party scripts with `next/script` |

### File Conventions

| File | Description |
|------|-------------|
| `default.js` | Default file |
| `error.js` | Error boundary |
| `layout.js` | Layout component |
| `loading.js` | Loading UI |
| `not-found.js` | 404 UI |
| `page.js` | Page component |
| `route.js` | API endpoint |
| `template.js` | Re-rendered layout |

### Functions

| Function | Description |
|----------|-------------|
| `after` | Run code after response |
| `cacheLife` | Set cache expiration time |
| `cacheTag` | Tag cached data |
| `connection` | Defer to request time |
| `cookies` | Access cookies |
| `draftMode` | Enable draft mode |
| `fetch` | Extended fetch function |
| `forbidden` | Return 403 response |
| `generateMetadata` | Add metadata |
| `generateStaticParams` | Generate static params |
| `headers` | Access headers |
| `ImageResponse` | Generate OG images |
| `notFound` | Trigger 404 |
| `redirect` | Redirect user |
| `revalidatePath` | Revalidate route |
| `revalidateTag` | Revalidate tagged data |
| `unauthorized` | Return 401 response |
| `updateTag` | Update tagged data |
| `useParams` | Get route params |
| `usePathname` | Get current pathname |
| `useRouter` | Router hook |
| `useSearchParams` | Get search params |

---

## Configuration {#configuration}

### next.config.js

```js
// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
}

module.exports = nextConfig
```

### Key Configuration Options

| Option | Description |
|--------|-------------|
| `basePath` | Deploy under sub-path |
| `cacheComponents` | Enable Cache Components |
| `compress` | Enable gzip compression |
| `devIndicators` | Development indicators |
| `distDir` | Custom build directory |
| `env` | Environment variables |
| `headers` | Custom HTTP headers |
| `images` | Image optimization config |
| `output` | Output mode (standalone, export) |
| `redirects` | Custom redirects |
| `rewrites` | Custom rewrites |
| `reactCompiler` | Enable React Compiler |
| `trailingSlash` | Trailing slash config |
| `turbopack` | Turbopack options |
| `typescript` | TypeScript config |
| `webpack` | Webpack customization |

### Cache Components Config

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    default: {
      stale: 300,
      revalidate: 600,
      expire: 86400,
    },
  },
}

export default nextConfig
```

### Image Config

```js
module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 14400,
    qualities: [25, 50, 75, 100],
    maximumDiskCacheSize: 500_000_000,
  },
}
```

---

## Version History

### Next.js 16.1.7 Changes

- `maximumDiskCacheSize` configuration added for Image Optimization
- Bug fixes and stability improvements
- Turbopack File System Caching (stable)
- New bundle analyzer
- Easier debugging in Node.js

### Next.js 16 Major Features

- Cache Components (Partial Prerendering)
- Stable Turbopack
- File system caching
- React Compiler support
- Smarter routing
- New caching APIs
- React 19.2 integration
- View Transitions support

---

## Additional Resources

- [GitHub Discussions](https://github.com/vercel/next.js/discussions)
- [Discord Community](https://nextjs.org/discord)
- [X (Twitter)](https://twitter.com/nextjs)
- [Reddit](https://reddit.com/r/nextjs)

---

**Documentation Version:** 16.1.7  
**Last Updated:** March 16, 2026  
**Source:** https://nextjs.org/docs

---

This comprehensive documentation covers all major aspects of Next.js 16.1.7. For the most up-to-date information, always refer to the official documentation at https://nextjs.org/docs [[1]][[2]][[11]].