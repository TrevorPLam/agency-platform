#!/usr/bin/env tsx

/**
 * Expertise Mapping Script
 * 
 * Command-line script for mapping expertise across contributors.
 * This script analyzes git history and code contributions to identify expertise areas.
 */

import { program } from 'commander'
import { ExpertiseMapper } from '@agency/knowledge'

async function main() {
  program
    .name('map-expertise')
    .description('Map expertise across repository contributors')
    .version('1.0.0')

  program
    .command('repository')
    .description('Map expertise for all repository contributors')
    .option('-r, --repository <path>', 'Repository path', process.cwd())
    .option('-o, --output <file>', 'Output file for expertise profiles')
    .option('-f, --format <format>', 'Output format (json|table)', 'table')
    .action(async (options) => {
      const mapper = new ExpertiseMapper(options.repository)
      const profiles = await mapper.mapRepositoryExpertise()
      
      console.log(`Mapped expertise for ${profiles.length} contributors`)
      
      if (options.output) {
        await writeToFile(profiles, options.output)
        console.log(`Results saved to ${options.output}`)
      } else {
        if (options.format === 'json') {
          console.log(JSON.stringify(profiles, null, 2))
        } else {
          displayProfiles(profiles)
        }
      }
    })

  program
    .command('contributor')
    .description('Map expertise for a specific contributor')
    .argument('<email>', 'Contributor email address')
    .option('-r, --repository <path>', 'Repository path', process.cwd())
    .option('-o, --output <file>', 'Output file for expertise profile')
    .option('-f, --format <format>', 'Output format (json|table)', 'table')
    .action(async (email, options) => {
      const mapper = new ExpertiseMapper(options.repository)
      const contributor = { name: '', email }
      
      try {
        const profile = await mapper.buildExpertiseProfile(contributor)
        
        console.log(`Mapped expertise for ${email}`)
        
        if (options.output) {
          await writeToFile([profile], options.output)
          console.log(`Results saved to ${options.output}`)
        } else {
          if (options.format === 'json') {
            console.log(JSON.stringify(profile, null, 2))
          } else {
            displayProfile(profile)
          }
        }
      } catch (error) {
        console.error(`Error mapping expertise for ${email}:`, error)
      }
    })

  program
    .command('analyze')
    .description('Analyze expertise distribution across the repository')
    .option('-r, --repository <path>', 'Repository path', process.cwd())
    .option('-c, --category <category>', 'Filter by expertise category')
    .action(async (options) => {
      const mapper = new ExpertiseMapper(options.repository)
      const profiles = await mapper.mapRepositoryExpertise()
      
      if (options.category) {
        const filtered = profiles.filter(p => 
          p.areas.some(area => area.category === options.category)
        )
        console.log(`Found ${filtered.length} contributors with expertise in ${options.category}`)
        displayCategoryAnalysis(filtered, options.category)
      } else {
        console.log(`Analyzing expertise distribution for ${profiles.length} contributors`)
        displayExpertiseAnalysis(profiles)
      }
    })

  await program.parseAsync()
}

async function writeToFile(data: any[], filePath: string): Promise<void> {
  const { writeFile } = await import('fs/promises')
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function displayProfiles(profiles: any[]): void {
  console.log('\n=== Expertise Profiles ===\n')
  
  profiles.forEach((profile, index) => {
    console.log(`${index + 1}. ${profile.name} (${profile.email})`)
    console.log(`   Reputation Score: ${profile.reputation.score}`)
    console.log(`   Total Contributions: ${profile.activity.totalContributions}`)
    console.log(`   Average Quality: ${profile.activity.averageQuality.toFixed(1)}`)
    console.log(`   Expertise Areas:`)
    
    profile.areas.forEach(area => {
      console.log(`     - ${area.category}: ${area.level} (${area.confidence}% confidence)`)
    })
    
    if (profile.reputation.badges.length > 0) {
      console.log(`   Badges: ${profile.reputation.badges.map((b: any) => b.name).join(', ')}`)
    }
    
    console.log('')
  })
  
  // Display repository statistics
  const stats = calculateRepositoryStats(profiles)
  console.log('=== Repository Expertise Statistics ===')
  console.log(`Total contributors: ${stats.totalContributors}`)
  console.log(`Average reputation: ${stats.avgReputation.toFixed(1)}`)
  console.log(`Top expertise areas: ${stats.topAreas.join(', ')}`)
  console.log(`Expertise distribution: ${Object.entries(stats.expertiseDistribution).map(([area, count]) => `${area} (${count})`).join(', ')}`)
}

function displayProfile(profile: any): void {
  console.log('\n=== Expertise Profile ===')
  console.log(`Name: ${profile.name}`)
  console.log(`Email: ${profile.email}`)
  console.log(`Reputation Score: ${profile.reputation.score}`)
  console.log(`Rank: ${profile.reputation.rank}`)
  console.log(`Last Active: ${profile.lastActive}`)
  
  console.log('\nActivity Metrics:')
  console.log(`  Total Contributions: ${profile.activity.totalContributions}`)
  console.log(`  Average Quality: ${profile.activity.averageQuality.toFixed(1)}`)
  console.log(`  Response Time: ${profile.activity.responseTime} hours`)
  console.log(`  Collaboration Score: ${profile.activity.collaborationScore}`)
  
  console.log('\nExpertise Areas:')
  profile.areas.forEach(area => {
    console.log(`  ${area.category}:`)
    console.log(`    Level: ${area.level}`)
    console.log(`    Confidence: ${area.confidence}%`)
    console.log(`    Contributions: ${area.contributions}`)
    console.log(`    Endorsements: ${area.endorsements}`)
    console.log(`    Last Contribution: ${area.lastContribution}`)
  })
  
  console.log('\nReputation:')
  console.log(`  Score: ${profile.reputation.score}`)
  console.log(`  Endorsements: ${profile.reputation.endorsements}`)
  console.log(`  Helpful Votes: ${profile.reputation.helpfulVotes}`)
  console.log(`  Mentorship Points: ${profile.reputation.mentorshipPoints}`)
  console.log(`  Knowledge Shared: ${profile.reputation.knowledgeShared}`)
  
  if (profile.reputation.badges.length > 0) {
    console.log('\nBadges:')
    profile.reputation.badges.forEach((badge: any) => {
      console.log(`  ${badge.icon} ${badge.name}: ${badge.description}`)
    })
  }
  
  console.log('\nAvailability:')
  console.log(`  Timezone: ${profile.availability.timezone}`)
  console.log(`  Working Hours: ${profile.availability.workingHours.start} - ${profile.availability.workingHours.end}`)
  console.log(`  Working Days: ${profile.availability.days.join(', ')}`)
  console.log(`  Current Load: ${profile.availability.currentLoad}%`)
  console.log(`  Mentorship Capacity: ${profile.availability.mentorshipCapacity}`)
  
  console.log('\nMentorship:')
  console.log(`  Style: ${profile.mentorship.mentorshipStyle}`)
  console.log(`  Preferred Topics: ${profile.mentorship.preferredTopics.join(', ')}`)
  console.log(`  Mentee Count: ${profile.mentorship.menteeCount}`)
  console.log(`  Success Rate: ${profile.mentorship.successRate}%`)
}

function displayCategoryAnalysis(profiles: any[], category: string): void {
  console.log(`\n=== ${category} Expertise Analysis ===\n`)
  
  const categoryExperts = profiles.filter(p => 
    p.areas.some(area => area.category === category)
  )
  
  categoryExperts.forEach(profile => {
    const area = profile.areas.find(a => a.category === category)
    console.log(`${profile.name}: ${area.level} (${area.confidence}% confidence)`)
  })
  
  console.log(`\nTotal experts in ${category}: ${categoryExperts.length}`)
  
  const avgConfidence = categoryExperts.reduce((sum, p) => {
    const area = p.areas.find(a => a.category === category)
    return sum + area.confidence
  }, 0) / categoryExperts.length
  
  console.log(`Average confidence: ${avgConfidence.toFixed(1)}%`)
}

function displayExpertiseAnalysis(profiles: any[]): void {
  console.log('\n=== Expertise Distribution Analysis ===\n')
  
  const expertiseStats = calculateExpertiseStats(profiles)
  
  console.log('Expertise Areas Coverage:')
  Object.entries(expertiseStats.coverage).forEach(([area, data]) => {
    console.log(`  ${area}:`)
    console.log(`    Contributors: ${data.contributors}`)
    console.log(`    Average Confidence: ${data.avgConfidence.toFixed(1)}%`)
    console.log(`    Expert Level Contributors: ${data.experts}`)
    console.log(`    Advanced Level Contributors: ${data.advanced}`)
  })
  
  console.log('\nExpertise Gaps:')
  expertiseStats.gaps.forEach(gap => {
    console.log(`  ${gap.area}: Only ${gap.contributors} contributors (need at least ${gap.needed})`)
  })
  
  console.log('\nTop Contributors by Reputation:')
  expertiseStats.topContributors.forEach((contributor, index) => {
    console.log(`  ${index + 1}. ${contributor.name}: ${contributor.reputation.score}`)
  })
}

function calculateRepositoryStats(profiles: any[]) {
  const stats = {
    totalContributors: profiles.length,
    avgReputation: 0,
    topAreas: [] as string[],
    expertiseDistribution: {} as Record<string, number>
  }

  if (profiles.length === 0) return stats

  let totalReputation = 0
  const areaCounts: Record<string, number> = {}

  profiles.forEach(profile => {
    totalReputation += profile.reputation.score
    
    profile.areas.forEach(area => {
      areaCounts[area.category] = (areaCounts[area.category] || 0) + 1
    })
  })

  stats.avgReputation = totalReputation / profiles.length
  stats.expertiseDistribution = areaCounts
  stats.topAreas = Object.entries(areaCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([area]) => area)

  return stats
}

function calculateExpertiseStats(profiles: any[]) {
  const areas = ['architecture', 'security', 'performance', 'testing', 'deployment', 'monitoring', 'governance', 'best-practices', 'troubleshooting', 'onboarding']
  
  const coverage: Record<string, any> = {}
  const gaps: any[] = []

  areas.forEach(area => {
    const areaProfiles = profiles.filter(p => 
      p.areas.some(a => a.category === area)
    )
    
    const areaData = areaProfiles.map(p => 
      p.areas.find(a => a.category === area)
    )
    
    const avgConfidence = areaData.reduce((sum, a) => sum + a.confidence, 0) / areaData.length
    const experts = areaData.filter(a => a.level === 'expert').length
    const advanced = areaData.filter(a => a.level === 'advanced').length
    
    coverage[area] = {
      contributors: areaProfiles.length,
      avgConfidence,
      experts,
      advanced
    }
    
    // Identify gaps (less than 3 contributors or no experts)
    if (areaProfiles.length < 3 || experts === 0) {
      gaps.push({
        area,
        contributors: areaProfiles.length,
        needed: Math.max(3, experts === 0 ? 1 : 0)
      })
    }
  })

  const topContributors = profiles
    .sort((a, b) => b.reputation.score - a.reputation.score)
    .slice(0, 10)

  return {
    coverage,
    gaps,
    topContributors
  }
}

if (require.main === module) {
  main().catch(console.error)
}
