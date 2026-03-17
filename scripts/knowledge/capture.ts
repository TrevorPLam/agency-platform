#!/usr/bin/env tsx

/**
 * Knowledge Capture Script
 * 
 * Command-line script for capturing knowledge from various sources.
 * This script can be run manually or integrated into CI/CD workflows.
 */

import { program } from 'commander'
import { KnowledgeCaptureEngine } from '@agency/knowledge'

async function main() {
  program
    .name('capture-knowledge')
    .description('Capture knowledge from git commits, code, and other sources')
    .version('1.0.0')

  program
    .command('commits')
    .description('Capture knowledge from git commits')
    .option('-s, --since <date>', 'Capture commits since this date')
    .option('-l, --limit <number>', 'Limit number of commits to capture', '50')
    .option('-r, --repository <path>', 'Repository path', process.cwd())
    .option('-o, --output <file>', 'Output file for captured knowledge')
    .action(async (options) => {
      const engine = new KnowledgeCaptureEngine(options.repository)
      const captures = await engine.captureFromCommits(options.since, parseInt(options.limit))
      
      console.log(`Captured ${captures.length} knowledge items from commits`)
      
      if (options.output) {
        await writeToFile(captures, options.output)
        console.log(`Results saved to ${options.output}`)
      } else {
        displayCaptures(captures)
      }
    })

  program
    .command('code')
    .description('Capture knowledge from code files')
    .option('-d, --directory <path>', 'Directory to scan', process.cwd())
    .option('-r, --repository <path>', 'Repository path', process.cwd())
    .option('-o, --output <file>', 'Output file for captured knowledge')
    .action(async (options) => {
      const engine = new KnowledgeCaptureEngine(options.repository)
      const captures = await engine.captureFromCode(options.directory)
      
      console.log(`Captured ${captures.length} knowledge items from code`)
      
      if (options.output) {
        await writeToFile(captures, options.output)
        console.log(`Results saved to ${options.output}`)
      } else {
        displayCaptures(captures)
      }
    })

  program
    .command('all')
    .description('Capture knowledge from all sources')
    .option('-s, --since <date>', 'Capture commits since this date')
    .option('-l, --limit <number>', 'Limit number of commits to capture', '50')
    .option('-r, --repository <path>', 'Repository path', process.cwd())
    .option('-o, --output <file>', 'Output file for captured knowledge')
    .action(async (options) => {
      const engine = new KnowledgeCaptureEngine(options.repository)
      
      console.log('Capturing knowledge from commits...')
      const commitCaptures = await engine.captureFromCommits(options.since, parseInt(options.limit))
      
      console.log('Capturing knowledge from code...')
      const codeCaptures = await engine.captureFromCode()
      
      const allCaptures = [...commitCaptures, ...codeCaptures]
      
      console.log(`Captured ${allCaptures.length} total knowledge items`)
      
      if (options.output) {
        await writeToFile(allCaptures, options.output)
        console.log(`Results saved to ${options.output}`)
      } else {
        displayCaptures(allCaptures)
      }
    })

  await program.parseAsync()
}

async function writeToFile(captures: any[], filePath: string): Promise<void> {
  const { writeFile } = await import('fs/promises')
  await writeFile(filePath, JSON.stringify(captures, null, 2), 'utf-8')
}

function displayCaptures(captures: any[]): void {
  console.log('\n=== Captured Knowledge ===\n')
  
  captures.forEach((capture, index) => {
    console.log(`${index + 1}. ${capture.title}`)
    console.log(`   Category: ${capture.category}`)
    console.log(`   Expertise: ${capture.expertise}`)
    console.log(`   Source: ${capture.source}`)
    console.log(`   Author: ${capture.author}`)
    console.log(`   Quality: ${capture.quality.overall}/100`)
    console.log(`   Tags: ${capture.tags.join(', ')}`)
    console.log(`   Summary: ${capture.summary}`)
    console.log('')
  })
  
  // Display statistics
  const stats = calculateStats(captures)
  console.log('=== Statistics ===')
  console.log(`Total captures: ${stats.total}`)
  console.log(`Average quality: ${stats.avgQuality.toFixed(1)}`)
  console.log(`Categories: ${Object.entries(stats.byCategory).map(([cat, count]) => `${cat} (${count})`).join(', ')}`)
  console.log(`Expertise levels: ${Object.entries(stats.byExpertise).map(([level, count]) => `${level} (${count})`).join(', ')}`)
  console.log(`Sources: ${Object.entries(stats.bySource).map(([source, count]) => `${source} (${count})`).join(', ')}`)
}

function calculateStats(captures: any[]) {
  const stats = {
    total: captures.length,
    avgQuality: 0,
    byCategory: {} as Record<string, number>,
    byExpertise: {} as Record<string, number>,
    bySource: {} as Record<string, number>
  }

  if (captures.length === 0) return stats

  let totalQuality = 0

  captures.forEach(capture => {
    totalQuality += capture.quality.overall
    
    stats.byCategory[capture.category] = (stats.byCategory[capture.category] || 0) + 1
    stats.byExpertise[capture.expertise] = (stats.byExpertise[capture.expertise] || 0) + 1
    stats.bySource[capture.source] = (stats.bySource[capture.source] || 0) + 1
  })

  stats.avgQuality = totalQuality / captures.length

  return stats
}

if (require.main === module) {
  main().catch(console.error)
}
