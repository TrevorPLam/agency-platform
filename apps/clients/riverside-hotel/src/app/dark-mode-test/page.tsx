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
    <div className="min-h-screen bg-background-primary text-text-primary p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-brand-primary">
            Dark Mode Test
          </h1>
          <p className="text-lg text-text-secondary">
            Test dark mode functionality for Riverside Hotel
          </p>
          <button
            onClick={toggleDarkMode}
            className="px-6 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-lg transition-colors"
          >
            {isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          </button>
        </header>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-background-secondary p-6 rounded-lg border border-border-primary">
            <h2 className="text-2xl font-semibold text-brand-primary mb-4">
              Background Colors
            </h2>
            <div className="space-y-2">
              <div className="bg-background-primary p-4 rounded">Background Primary</div>
              <div className="bg-background-secondary p-4 rounded">Background Secondary</div>
              <div className="bg-background-accent p-4 rounded">Background Accent</div>
            </div>
          </div>

          <div className="bg-background-secondary p-6 rounded-lg border border-border-primary">
            <h2 className="text-2xl font-semibold text-brand-accent mb-4">
              Text Colors
            </h2>
            <div className="space-y-2">
              <div className="text-text-primary">Text Primary</div>
              <div className="text-text-secondary">Text Secondary</div>
              <div className="text-text-inverse">Text Inverse</div>
              <div className="text-text-accent">Text Accent</div>
            </div>
          </div>
        </section>

        <section className="bg-background-secondary p-6 rounded-lg border border-border-primary">
          <h2 className="text-2xl font-semibold text-brand-secondary mb-4">
            Interactive Elements
          </h2>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-interactive-primary-default hover:bg-interactive-primary-hover text-white rounded">
              Primary Button
            </button>
            <button className="px-4 py-2 bg-interactive-secondary-default hover:bg-interactive-secondary-hover text-text-primary rounded border border-border-primary">
              Secondary Button
            </button>
          </div>
        </section>

        <section className="bg-background-secondary p-6 rounded-lg border border-border-primary">
          <h2 className="text-2xl font-semibold text-brand-primary mb-4">
            Brand Colors
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-brand-primary p-4 rounded text-white text-center">Brand Primary</div>
            <div className="bg-brand-secondary p-4 rounded text-white text-center">Brand Secondary</div>
            <div className="bg-brand-accent p-4 rounded text-white text-center">Brand Accent</div>
          </div>
        </section>
      </div>
    </div>
  )
}
