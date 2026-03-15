'use client'

import { useState } from 'react'

export default function DarkModeTest() {
  const [isDark, setIsDark] = useState(false)

  const toggleDarkMode = () => {
    setIsDark(!isDark)
    if (!isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <div className="bg-background-primary text-text-primary min-h-screen p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-4 text-center">
          <h1 className="text-brand-primary text-4xl font-bold">Dark Mode Test</h1>
          <p className="text-text-secondary text-lg">
            Test dark mode functionality for Riverside Hotel
          </p>
          <button
            onClick={toggleDarkMode}
            className="bg-brand-primary hover:bg-brand-primary/90 rounded-lg px-6 py-3 text-white transition-colors"
          >
            {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="bg-background-secondary border-border-primary rounded-lg border p-6">
            <h2 className="text-brand-primary mb-4 text-2xl font-semibold">Background Colors</h2>
            <div className="space-y-2">
              <div className="bg-background-primary rounded p-4">Background Primary</div>
              <div className="bg-background-secondary rounded p-4">Background Secondary</div>
              <div className="bg-background-accent rounded p-4">Background Accent</div>
            </div>
          </div>

          <div className="bg-background-secondary border-border-primary rounded-lg border p-6">
            <h2 className="text-brand-accent mb-4 text-2xl font-semibold">Text Colors</h2>
            <div className="space-y-2">
              <div className="text-text-primary">Text Primary</div>
              <div className="text-text-secondary">Text Secondary</div>
              <div className="text-text-inverse">Text Inverse</div>
              <div className="text-text-accent">Text Accent</div>
            </div>
          </div>
        </section>

        <section className="bg-background-secondary border-border-primary rounded-lg border p-6">
          <h2 className="text-brand-secondary mb-4 text-2xl font-semibold">Interactive Elements</h2>
          <div className="flex gap-4">
            <button className="bg-interactive-primary-default hover:bg-interactive-primary-hover rounded px-4 py-2 text-white">
              Primary Button
            </button>
            <button className="bg-interactive-secondary-default hover:bg-interactive-secondary-hover text-text-primary border-border-primary rounded border px-4 py-2">
              Secondary Button
            </button>
          </div>
        </section>

        <section className="bg-background-secondary border-border-primary rounded-lg border p-6">
          <h2 className="text-brand-primary mb-4 text-2xl font-semibold">Brand Colors</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-brand-primary rounded p-4 text-center text-white">Brand Primary</div>
            <div className="bg-brand-secondary rounded p-4 text-center text-white">
              Brand Secondary
            </div>
            <div className="bg-brand-accent rounded p-4 text-center text-white">Brand Accent</div>
          </div>
        </section>
      </div>
    </div>
  )
}
