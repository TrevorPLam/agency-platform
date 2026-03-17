#!/usr/bin/env node

/**
 * Content Management CLI
 * 
 * Command-line tool for managing content in the agency platform.
 * Provides commands for creating, updating, and managing content.
 */

import { Command } from 'commander'
import { initializeContentRepository, exportContent, importContent, type BlogPost } from '@agency/content'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

const program = new Command()
const contentRepo = initializeContentRepository()

/**
 * Create a new blog post
 */
program
  .command('create-blog')
  .description('Create a new blog post')
  .option('-t, --title <title>', 'Blog post title')
  .option('-c, --content <content>', 'Blog post content (markdown)')
  .option('-f, --file <file>', 'Read content from markdown file')
  .option('--tags <tags>', 'Comma-separated tags')
  .option('--featured', 'Mark as featured')
  .action(async (options) => {
    try {
      if (!options.title) {
        console.error('Error: Title is required')
        process.exit(1)
      }

      let content = options.content || ''
      
      if (options.file) {
        content = await readFile(options.file, 'utf-8')
      }

      const tags = options.tags ? options.tags.split(',').map(tag => tag.trim()) : []

      const newPost = await contentRepo.create({
        type: 'blog',
        title: options.title,
        description: content.slice(0, 160),
        author: 'Agency Team',
        content,
        tags,
        featured: options.featured || false,
      })

      console.log(`✅ Created blog post: ${newPost.title}`)
      console.log(`   Slug: ${newPost.slug}`)
      console.log(`   ID: ${newPost.id}`)
    } catch (error) {
      console.error('❌ Error creating blog post:', error)
      process.exit(1)
    }
  })

/**
 * List all content
 */
program
  .command('list')
  .description('List all content')
  .option('-t, --type <type>', 'Filter by content type (blog, case-study, service)')
  .option('--featured', 'Show only featured content')
  .action(async (options) => {
    try {
      let content = await contentRepo.getAll()

      if (options.type) {
        content = content.filter(item => item.type === options.type)
      }

      if (options.featured) {
        content = content.filter(item => item.featured)
      }

      if (content.length === 0) {
        console.log('No content found')
        return
      }

      console.log(`Found ${content.length} items:\n`)
      
      content.forEach(item => {
        console.log(`📝 ${item.title}`)
        console.log(`   Type: ${item.type}`)
        console.log(`   Slug: ${item.slug}`)
        console.log(`   Published: ${new Date(item.publishedAt).toLocaleDateString()}`)
        if (item.featured) console.log('   ⭐ Featured')
        console.log('')
      })
    } catch (error) {
      console.error('❌ Error listing content:', error)
      process.exit(1)
    }
  })

/**
 * Export content to JSON
 */
program
  .command('export')
  .description('Export all content to JSON file')
  .option('-o, --output <file>', 'Output file path', 'content-export.json')
  .action(async (options) => {
    try {
      const allContent = await contentRepo.getAll()
      const jsonContent = exportContent(allContent)
      
      await writeFile(options.output, jsonContent, 'utf-8')
      console.log(`✅ Exported ${allContent.length} items to ${options.output}`)
    } catch (error) {
      console.error('❌ Error exporting content:', error)
      process.exit(1)
    }
  })

/**
 * Import content from JSON
 */
program
  .command('import')
  .description('Import content from JSON file')
  .option('-i, --input <file>', 'Input file path')
  .action(async (options) => {
    try {
      if (!options.input) {
        console.error('Error: Input file is required')
        process.exit(1)
      }

      const jsonContent = await readFile(options.input, 'utf-8')
      const importedContent = importContent(jsonContent)
      
      console.log(`✅ Imported ${importedContent.length} items from ${options.input}`)
    } catch (error) {
      console.error('❌ Error importing content:', error)
      process.exit(1)
    }
  })

/**
 * Search content
 */
program
  .command('search')
  .description('Search content by title, description, or tags')
  .argument('<query>', 'Search query')
  .action(async (query) => {
    try {
      const results = await contentRepo.search(query)
      
      if (results.length === 0) {
        console.log(`No results found for "${query}"`)
        return
      }

      console.log(`Found ${results.length} results for "${query}":\n`)
      
      results.forEach(item => {
        console.log(`📝 ${item.title}`)
        console.log(`   Type: ${item.type}`)
        console.log(`   Slug: ${item.slug}`)
        console.log(`   Description: ${item.description.slice(0, 100)}...`)
        console.log('')
      })
    } catch (error) {
      console.error('❌ Error searching content:', error)
      process.exit(1)
    }
  })

/**
 * Generate sample content
 */
program
  .command('generate-sample')
  .description('Generate sample blog content for testing')
  .action(async () => {
    try {
      const samplePosts: Omit<BlogPost, 'id' | 'publishedAt' | 'updatedAt'>[] = [
        {
          type: 'blog',
          title: 'The Future of Web Development',
          description: 'Exploring emerging trends and technologies shaping the future of web development.',
          author: 'Agency Team',
          content: `# The Future of Web Development

The web development landscape is constantly evolving. Here are the key trends shaping our industry:

## 1. AI-Powered Development
Artificial intelligence is revolutionizing how we build websites and applications.

## 2. Edge Computing
Processing data closer to users reduces latency and improves performance.

## 3. WebAssembly
High-performance applications running in the browser.

## 4. Progressive Web Apps
Bridging the gap between web and native applications.

Stay tuned for more insights on the future of our industry.`,
          tags: ['web-development', 'trends', 'technology'],
          featured: true,
        },
        {
          type: 'blog',
          title: 'Client Success Story: E-commerce Transformation',
          description: 'How we helped a retail client increase online sales by 300% through strategic digital transformation.',
          author: 'Agency Team',
          content: `# Client Success Story: E-commerce Transformation

We recently worked with a retail client to transform their online presence and achieve remarkable results.

## The Challenge
Our client was struggling with an outdated e-commerce platform that wasn't meeting customer expectations.

## Our Approach
We implemented a comprehensive digital strategy including:
- Platform migration
- UX redesign
- Performance optimization
- Marketing automation

## The Results
- 300% increase in online sales
- 50% improvement in site speed
- 40% reduction in bounce rate
- 25% increase in conversion rate

This project demonstrates the power of strategic digital transformation when paired with the right technology and expertise.`,
          tags: ['case-study', 'e-commerce', 'success'],
          featured: false,
        },
      ]

      for (const postData of samplePosts) {
        const createdPost = await contentRepo.create(postData)
        console.log(`✅ Created sample post: ${createdPost.title}`)
      }

      console.log('\n🎉 Sample content generation complete!')
    } catch (error) {
      console.error('❌ Error generating sample content:', error)
      process.exit(1)
    }
  })

// Parse command line arguments
program.parse()
