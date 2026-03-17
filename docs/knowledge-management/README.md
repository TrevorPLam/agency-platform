# Integrated Knowledge Management System

## Overview

The Integrated Knowledge Management System is a comprehensive solution for capturing, organizing, and sharing knowledge within the agency platform. It leverages AI-powered search, automated capture, expertise mapping, and gamification to create a thriving knowledge-sharing culture.

## Features

### 🤖 Automated Knowledge Capture
- **Git Commit Analysis**: Automatically extracts knowledge from commit messages and code changes
- **Pull Request Processing**: Captures knowledge from PR descriptions and discussions
- **Code Analysis**: Identifies patterns, best practices, and architectural decisions
- **Issue Tracking**: Extracts troubleshooting solutions and problem-solving approaches

### 🔍 AI-Powered Search
- **Semantic Search**: Understands context and intent beyond keyword matching
- **Citations**: Provides source references for all search results
- **Personalized Recommendations**: Suggests relevant knowledge based on user role and expertise
- **Similar Content Discovery**: Finds related knowledge items automatically

### 👥 Expertise Mapping
- **Git-Based Analysis**: Identifies expertise from contribution patterns
- **Skill Assessment**: Determines expertise levels across different domains
- **Collaboration Insights**: Maps knowledge networks and collaboration patterns
- **Availability Tracking**: Monitors expert availability and mentorship capacity

### 🎯 Knowledge Audits
- **Quality Monitoring**: Automated quality scoring and improvement suggestions
- **Completeness Checks**: Ensures knowledge items are comprehensive and well-structured
- **Accuracy Verification**: Identifies outdated or inaccurate information
- **Relevance Assessment**: Evaluates content relevance to categories and audiences

### 🏆 Incentive Programs
- **Points System**: Rewards contributors with points for valuable knowledge sharing
- **Badge Achievements**: Recognize expertise and contributions with digital badges
- **Leader Boards**: Foster friendly competition and recognition
- **Reward Redemption**: Allow points to be exchanged for learning resources and privileges

## Architecture

### Core Components

```
@agency/knowledge
├── src/
│   ├── types.ts          # Type definitions and interfaces
│   ├── capture.ts        # Automated knowledge capture engine
│   ├── search.ts         # AI-powered search system
│   ├── expertise.ts      # Expertise mapping and analysis
│   ├── workflows.ts      # Workflow integration and automation
│   ├── audit.ts          # Knowledge quality auditing
│   ├── incentives.ts     # Gamification and incentive programs
│   └── index.ts          # Main entry point
└── scripts/
    ├── capture.ts        # CLI for knowledge capture
    ├── expertise-map.ts  # CLI for expertise mapping
    └── search.ts         # CLI for knowledge search
```

### Data Flow

```
Git Events → Knowledge Capture → Quality Assessment → Search Index
    ↓              ↓                    ↓              ↓
Expertise Mapping → Incentive Processing → User Profiles → Recommendations
```

## Getting Started

### Installation

The knowledge management system is included as part of the agency platform monorepo:

```bash
# Install dependencies
pnpm install

# Build the knowledge package
pnpm --filter @agency/knowledge build
```

### Basic Usage

#### Capturing Knowledge

```bash
# Capture from recent commits
pnpm capture-knowledge commits --since "1 week ago" --limit 20

# Capture from code files
pnpm capture-knowledge code --directory ./packages/ui

# Capture from all sources
pnpm capture-knowledge all --since "1 month ago"
```

#### Mapping Expertise

```bash
# Map expertise for all contributors
pnpm map-expertise repository --format table

# Map expertise for specific contributor
pnpm map-expertise contributor user@example.com

# Analyze expertise distribution
pnpm map-expertise analyze --category security
```

#### Searching Knowledge

```bash
# Search with query
pnpm search-knowledge query "React hooks best practices"

# Get personalized recommendations
pnpm search-knowledge recommend user@example.com --categories testing,security

# Find similar items
pnpm search-knowledge similar item-id-123
```

### Programmatic Usage

```typescript
import { 
  KnowledgeCaptureEngine, 
  KnowledgeSearchEngine, 
  ExpertiseMapper,
  IncentiveManager 
} from '@agency/knowledge'

// Initialize components
const captureEngine = new KnowledgeCaptureEngine()
const searchEngine = new KnowledgeSearchEngine()
const expertiseMapper = new ExpertiseMapper()
const incentiveManager = new IncentiveManager()

// Capture knowledge
const captures = await captureEngine.captureFromCommits('1 week ago', 50)

// Search knowledge
const results = await searchEngine.search({
  query: 'React performance optimization',
  category: 'performance',
  limit: 10
})

// Map expertise
const profiles = await expertiseMapper.mapRepositoryExpertise()

// Process incentives
const incentives = await incentiveManager.processContribution(
  captures[0], 
  'contribute'
)
```

## Configuration

### Environment Variables

```bash
# Optional: Configure repository path
KNOWLEDGE_REPO_PATH=/path/to/repository

# Optional: Configure database connection
KNOWLEDGE_DATABASE_URL=postgresql://...

# Optional: Configure AI search provider
KNOWLEDGE_AI_PROVIDER=openai
KNOWLEDGE_AI_API_KEY=your-api-key
```

### Custom Rules

You can customize audit rules, incentive programs, and workflow triggers:

```typescript
// Custom audit rules
const customRules = [
  {
    type: 'security',
    condition: 'category === "security" && quality.accuracy < 90',
    severity: 'high',
    description: 'Security content must be highly accurate',
    recommendation: 'Review security content for accuracy'
  }
]

// Custom incentive programs
const customProgram = {
  id: 'security-expert',
  name: 'Security Expert Program',
  type: 'badges',
  rules: [
    {
      action: 'contribute',
      condition: { category: 'security', quality: 95 },
      badges: ['security-expert'],
      description: 'Expert-level security contribution'
    }
  ]
}
```

## Integration with Workflows

### GitHub Actions Integration

The system includes automated GitHub Actions workflows:

- **Knowledge Capture**: Runs on pushes and PRs to capture new knowledge
- **Expertise Mapping**: Daily updates to expertise profiles
- **Quality Audits**: Regular audits of knowledge quality
- **Dashboard Updates**: Updates knowledge management dashboard

### CI/CD Pipeline Integration

```yaml
# .github/workflows/knowledge-management.yml
name: Knowledge Management
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'

jobs:
  capture-knowledge:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Capture knowledge
        run: pnpm capture-knowledge all
```

## Knowledge Categories

The system organizes knowledge into these categories:

- **Architecture**: System design, patterns, and architectural decisions
- **Security**: Authentication, authorization, and security best practices
- **Performance**: Optimization, caching, and performance tuning
- **Testing**: Unit tests, integration tests, and testing strategies
- **Deployment**: CI/CD, release management, and deployment processes
- **Monitoring**: Logging, metrics, and observability
- **Governance**: Policies, procedures, and compliance requirements
- **Best Practices**: General best practices and guidelines
- **Troubleshooting**: Problem-solving and debugging approaches
- **Onboarding**: Setup guides and getting started documentation

## Expertise Levels

Knowledge items are classified by expertise level:

- **Beginner**: Basic concepts and introductory content
- **Intermediate**: Practical applications and moderate complexity
- **Advanced**: Complex topics and expert-level content
- **Expert**: Deep expertise and cutting-edge knowledge

## Quality Metrics

Each knowledge item is evaluated on these quality dimensions:

- **Clarity**: How well the content is written and structured
- **Accuracy**: Technical correctness and factual accuracy
- **Completeness**: Thoroughness and coverage of the topic
- **Relevance**: Alignment with category and audience needs
- **Overall**: Composite quality score (0-100)

## Incentive System

### Points System

- **Basic Contribution**: 10 points
- **High-Quality Contribution**: 25 points
- **Expert-Level Contribution**: 50 points
- **Review and Improvement**: 5 points
- **Mentorship**: 15 points
- **Knowledge Sharing**: 8 points

### Badges

- **🌟 First Contribution**: First knowledge contribution
- **💎 Quality Master**: Consistently high-quality contributions
- **🔒 Security Expert**: Expert in security knowledge
- **🚀 Performance Guru**: Expert in performance optimization
- **🧪 Testing Champion**: Expert in testing strategies

### Rewards

- **Team Recognition**: Public recognition (50 points)
- **Learning Budget**: $50 learning budget (100 points)
- **Conference Ticket**: Conference allowance (500 points)

## API Reference

### KnowledgeCaptureEngine

```typescript
class KnowledgeCaptureEngine {
  constructor(repositoryPath?: string)
  
  async captureFromCommits(since?: string, limit?: number): Promise<KnowledgeCapture[]>
  async captureFromCode(directory?: string): Promise<KnowledgeCapture[]>
}
```

### KnowledgeSearchEngine

```typescript
class KnowledgeSearchEngine {
  constructor(knowledgeBase?: KnowledgeCapture[])
  
  async search(query: SearchQuery): Promise<SearchResponse>
  async getRecommendations(userId: string, categories?, expertise?, limit?): Promise<SearchResult[]>
  async findSimilar(itemId: string, limit?: number): Promise<SearchResult[]>
}
```

### ExpertiseMapper

```typescript
class ExpertiseMapper {
  constructor(repositoryPath?: string)
  
  async mapRepositoryExpertise(): Promise<ExpertiseProfile[]>
  async buildExpertiseProfile(contributor: Contributor): Promise<ExpertiseProfile>
}
```

### IncentiveManager

```typescript
class IncentiveManager {
  async processContribution(contribution: KnowledgeCapture, action: string): Promise<IncentiveResult>
  async getUserIncentiveSummary(userEmail: string): Promise<UserIncentiveSummary>
  async getLeaderBoard(limit?: number): Promise<LeaderBoardEntry[]>
  async claimReward(userEmail: string, rewardId: string): Promise<RewardClaimResult>
}
```

## Best Practices

### Knowledge Contribution

1. **Write Clear Titles**: Use descriptive, searchable titles
2. **Provide Context**: Include background and use cases
3. **Add Examples**: Include code examples and practical applications
4. **Cite Sources**: Reference documentation and related resources
5. **Use Tags**: Add relevant tags for better discoverability
6. **Set Expertise Level**: Indicate appropriate expertise level
7. **Review Quality**: Ensure high clarity, accuracy, and completeness

### Search Usage

1. **Use Natural Language**: Search with questions and phrases
2. **Filter by Category**: Narrow results by knowledge category
3. **Specify Expertise Level**: Find content at appropriate complexity
4. **Use Citations**: Follow source links for deeper understanding
5. **Provide Feedback**: Help improve search relevance with ratings

### Expertise Development

1. **Contribute Regularly**: Build expertise through consistent contributions
2. **Review Content**: Improve existing knowledge through reviews
3. **Mentor Others**: Share knowledge through mentorship
4. **Stay Current**: Keep expertise up-to-date with latest practices
5. **Collaborate**: Work with others on complex topics

## Troubleshooting

### Common Issues

**Knowledge not being captured:**
- Check git history and commit messages
- Verify repository path configuration
- Ensure commit messages contain knowledge indicators

**Search results not relevant:**
- Check query terms and spelling
- Try different category filters
- Use more specific search terms

**Expertise mapping inaccurate:**
- Verify git author configuration
- Check contribution history
- Ensure sufficient contribution data

**Incentives not awarded:**
- Verify program configuration
- Check rule conditions
- Ensure contribution meets quality thresholds

### Debug Mode

Enable debug logging for troubleshooting:

```bash
DEBUG=knowledge:* pnpm capture-knowledge commits
```

## Contributing

To contribute to the knowledge management system:

1. **Fork the Repository**: Create a fork of the agency platform
2. **Create Feature Branch**: Use descriptive branch names
3. **Implement Changes**: Follow existing code patterns and conventions
4. **Add Tests**: Include unit tests for new functionality
5. **Update Documentation**: Update relevant documentation
6. **Submit Pull Request**: Include clear description of changes

## License

This knowledge management system is part of the agency platform and follows the same licensing terms.

## Support

For support and questions:

- **Documentation**: Check this README and API reference
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub discussions for questions and ideas
- **Team Contact**: Reach out to the development team directly

## Roadmap

### Upcoming Features

- **AI-Enhanced Summaries**: Automatic content summarization
- **Knowledge Graph**: Visual representation of knowledge relationships
- **Integration with External Tools**: Slack, Teams, and other platforms
- **Advanced Analytics**: Detailed usage and engagement metrics
- **Mobile App**: Native mobile application for knowledge access
- **Voice Search**: Voice-activated knowledge retrieval
- **Translation Support**: Multi-language knowledge sharing

### Performance Improvements

- **Parallel Processing**: Faster knowledge capture and indexing
- **Caching Optimization**: Improved search performance
- **Database Optimization**: Better query performance for large datasets
- **Memory Management**: Reduced memory footprint for large repositories

## Changelog

### Version 1.0.0
- Initial release of integrated knowledge management system
- Automated knowledge capture from git commits and code
- AI-powered search with citations and recommendations
- Expertise mapping and profiling
- Knowledge quality auditing system
- Incentive programs and gamification
- Workflow integration with GitHub Actions
- Comprehensive CLI tools
- Full TypeScript support and type safety
