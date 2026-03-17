#!/usr/bin/env tsx

/**
 * Knowledge Search Script
 * 
 * Command-line script for searching the knowledge base.
 * Provides AI-powered search with citations and recommendations.
 */

import { program } from 'commander'
import { KnowledgeSearchEngine, SearchQuery } from '@agency/knowledge'
import { readFile } from 'fs/promises'

async function main() {
  program
    .name('search-knowledge')
    .description('Search the knowledge base with AI-powered search')
    .version('1.0.0')

  program
    .command('query')
    .description('Search the knowledge base')
    .argument('<query>', 'Search query')
    .option('-c, --category <category>', 'Filter by category')
    .option('-e, --expertise <level>', 'Filter by expertise level')
    .option('-s, --source <source>', 'Filter by source')
    .option('-a, --author <author>', 'Filter by author')
    .option('-t, --tags <tags>', 'Filter by tags (comma-separated)')
    .option('-l, --limit <number>', 'Limit results', '20')
    .option('-o, --offset <number>', 'Offset results', '0')
    .option('--sort <sort>', 'Sort by (relevance|date|quality|author)', 'relevance')
    .option('-k, --knowledge-base <file>', 'Knowledge base file')
    .option('-f, --format <format>', 'Output format (json|table)', 'table')
    .action(async (query, options) => {
      const searchEngine = await createSearchEngine(options.knowledgeBase)
      
      const searchQuery: SearchQuery = {
        query,
        category: options.category,
        expertise: options.expertise,
        source: options.source,
        author: options.author,
        tags: options.tags ? options.tags.split(',').map(t => t.trim()) : undefined,
        limit: parseInt(options.limit),
        offset: parseInt(options.offset),
        sortBy: options.sort
      }
      
      const results = await searchEngine.search(searchQuery)
      
      console.log(`Found ${results.total} results in ${results.took}ms`)
      
      if (options.format === 'json') {
        console.log(JSON.stringify(results, null, 2))
      } else {
        displaySearchResults(results)
      }
    })

  program
    .command('recommend')
    .description('Get personalized recommendations')
    .argument('<user-id>', 'User email address')
    .option('-c, --categories <categories>', 'Preferred categories (comma-separated)')
    .option('-e, --expertise <level>', 'Preferred expertise level')
    .option('-l, --limit <number>', 'Limit recommendations', '10')
    .option('-k, --knowledge-base <file>', 'Knowledge base file')
    .option('-f, --format <format>', 'Output format (json|table)', 'table')
    .action(async (userId, options) => {
      const searchEngine = await createSearchEngine(options.knowledgeBase)
      
      const categories = options.categories ? 
        options.categories.split(',').map(c => c.trim()) : undefined
      
      const recommendations = await searchEngine.getRecommendations(
        userId,
        categories,
        options.expertise,
        parseInt(options.limit)
      )
      
      console.log(`Found ${recommendations.length} recommendations for ${userId}`)
      
      if (options.format === 'json') {
        console.log(JSON.stringify(recommendations, null, 2))
      } else {
        displayRecommendations(recommendations, userId)
      }
    })

  program
    .command('similar')
    .description('Find similar knowledge items')
    .argument('<item-id>', 'Knowledge item ID')
    .option('-l, --limit <number>', 'Limit results', '5')
    .option('-k, --knowledge-base <file>', 'Knowledge base file')
    .option('-f, --format <format>', 'Output format (json|table)', 'table')
    .action(async (itemId, options) => {
      const searchEngine = await createSearchEngine(options.knowledgeBase)
      
      const similar = await searchEngine.findSimilar(itemId, parseInt(options.limit))
      
      console.log(`Found ${similar.length} similar items to ${itemId}`)
      
      if (options.format === 'json') {
        console.log(JSON.stringify(similar, null, 2))
      } else {
        displaySimilarItems(similar, itemId)
      }
    })

  program
    .command('stats')
    .description('Show knowledge base statistics')
    .option('-k, --knowledge-base <file>', 'Knowledge base file')
    .action(async (options) => {
      const searchEngine = await createSearchEngine(options.knowledgeBase)
      const knowledgeBase = searchEngine['knowledgeBase'] || []
      
      displayKnowledgeStats(knowledgeBase)
    })

  await program.parseAsync()
}

async function createSearchEngine(knowledgeBaseFile?: string): Promise<KnowledgeSearchEngine> {
  let knowledgeBase = []
  
  if (knowledgeBaseFile) {
    try {
      const content = await readFile(knowledgeBaseFile, 'utf-8')
      knowledgeBase = JSON.parse(content)
    } catch (error) {
      console.error(`Error loading knowledge base from ${knowledgeBaseFile}:`, error)
      process.exit(1)
    }
  }
  
  return new KnowledgeSearchEngine(knowledgeBase)
}

function displaySearchResults(results: any): void {
  console.log('\n=== Search Results ===\n')
  
  if (results.results.length === 0) {
    console.log('No results found.')
    return
  }
  
  results.results.forEach((result: any, index: number) => {
    console.log(`${index + 1}. ${result.item.title}`)
    console.log(`   Category: ${result.item.category}`)
    console.log(`   Expertise: ${result.item.expertise}`)
    console.log(`   Source: ${result.item.source}`)
    console.log(`   Author: ${result.item.author}`)
    console.log(`   Quality: ${result.item.quality.overall}/100`)
    console.log(`   Relevance: ${result.relevance.toFixed(1)}`)
    console.log(`   Date: ${new Date(result.item.timestamp).toLocaleDateString()}`)
    
    if (result.item.tags.length > 0) {
      console.log(`   Tags: ${result.item.tags.join(', ')}`)
    }
    
    console.log(`   Summary: ${result.item.summary}`)
    
    if (result.highlights.length > 0) {
      console.log(`   Highlights: ${result.highlights.join(' | ')}`)
    }
    
    if (result.matchedTerms.length > 0) {
      console.log(`   Matched Terms: ${result.matchedTerms.join(', ')}`)
    }
    
    console.log('')
  })
  
  // Display suggestions
  if (results.suggestions.length > 0) {
    console.log('=== Suggestions ===')
    console.log(`Try searching for: ${results.suggestions.join(', ')}`)
    console.log('')
  }
  
  // Display category stats
  if (results.categories.length > 0) {
    console.log('=== Category Breakdown ===')
    results.categories.forEach(cat => {
      console.log(`${cat.category}: ${cat.count} items (avg quality: ${cat.avgQuality.toFixed(1)})`)
    })
  }
}

function displayRecommendations(recommendations: any[], userId: string): void {
  console.log(`\n=== Recommendations for ${userId} ===\n`)
  
  if (recommendations.length === 0) {
    console.log('No recommendations available.')
    return
  }
  
  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.item.title}`)
    console.log(`   Category: ${rec.item.category}`)
    console.log(`   Expertise: ${rec.item.expertise}`)
    console.log(`   Author: ${rec.item.author}`)
    console.log(`   Quality: ${rec.item.quality.overall}/100`)
    console.log(`   Relevance Score: ${rec.relevance.toFixed(1)}`)
    console.log(`   Summary: ${rec.item.summary}`)
    console.log('')
  })
}

function displaySimilarItems(similar: any[], itemId: string): void {
  console.log(`\n=== Items Similar to ${itemId} ===\n`)
  
  if (similar.length === 0) {
    console.log('No similar items found.')
    return
  }
  
  similar.forEach((item, index) => {
    console.log(`${index + 1}. ${item.item.title}`)
    console.log(`   Category: ${item.item.category}`)
    console.log(`   Expertise: ${item.item.expertise}`)
    console.log(`   Author: ${item.item.author}`)
    console.log(`   Quality: ${item.item.quality.overall}/100`)
    console.log(`   Relevance: ${item.relevance.toFixed(1)}`)
    console.log(`   Summary: ${item.item.summary}`)
    console.log('')
  })
}

function displayKnowledgeStats(knowledgeBase: any[]): void {
  console.log('\n=== Knowledge Base Statistics ===\n')
  
  if (knowledgeBase.length === 0) {
    console.log('Knowledge base is empty.')
    return
  }
  
  const stats = calculateKnowledgeStats(knowledgeBase)
  
  console.log(`Total Items: ${stats.total}`)
  console.log(`Average Quality: ${stats.avgQuality.toFixed(1)}`)
  console.log(`Date Range: ${stats.dateRange.start} to ${stats.dateRange.end}`)
  
  console.log('\nBy Category:')
  Object.entries(stats.byCategory).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`)
  })
  
  console.log('\nBy Expertise Level:')
  Object.entries(stats.byExpertise).forEach(([level, count]) => {
    console.log(`  ${level}: ${count}`)
  })
  
  console.log('\nBy Source:')
  Object.entries(stats.bySource).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`)
  })
  
  console.log('\nTop Contributors:')
  stats.topContributors.forEach((contributor, index) => {
    console.log(`  ${index + 1}. ${contributor.name}: ${contributor.count} contributions`)
  })
  
  console.log('\nMost Common Tags:')
  stats.topTags.forEach((tag, index) => {
    console.log(`  ${index + 1}. ${tag.tag}: ${tag.count}`)
  })
}

function calculateKnowledgeStats(knowledgeBase: any[]) {
  const stats = {
    total: knowledgeBase.length,
    avgQuality: 0,
    dateRange: { start: '', end: '' },
    byCategory: {} as Record<string, number>,
    byExpertise: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
    topContributors: [] as any[],
    topTags: [] as any[]
  }
  
  if (knowledgeBase.length === 0) return stats
  
  let totalQuality = 0
  const timestamps: string[] = []
  const contributorCounts: Record<string, { name: string; count: number }> = {}
  const tagCounts: Record<string, number> = {}
  
  knowledgeBase.forEach(item => {
    totalQuality += item.quality.overall
    timestamps.push(item.timestamp)
    
    // Count by category
    stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1
    
    // Count by expertise
    stats.byExpertise[item.expertise] = (stats.byExpertise[item.expertise] || 0) + 1
    
    // Count by source
    stats.bySource[item.source] = (stats.bySource[item.source] || 0) + 1
    
    // Count contributors
    const contributorKey = item.authorEmail
    if (!contributorCounts[contributorKey]) {
      contributorCounts[contributorKey] = { name: item.author, count: 0 }
    }
    contributorCounts[contributorKey].count++
    
    // Count tags
    item.tags.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })
  
  stats.avgQuality = totalQuality / knowledgeBase.length
  
  // Date range
  timestamps.sort()
  stats.dateRange.start = new Date(timestamps[0]).toLocaleDateString()
  stats.dateRange.end = new Date(timestamps[timestamps.length - 1]).toLocaleDateString()
  
  // Top contributors
  stats.topContributors = Object.values(contributorCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  // Top tags
  stats.topTags = Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
  
  return stats
}

if (require.main === module) {
  main().catch(console.error)
}
