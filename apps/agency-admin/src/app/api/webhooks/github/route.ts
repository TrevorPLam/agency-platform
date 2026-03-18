import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { getAdminClient } from '@agency/database/admin'

// GitHub webhook signature verification
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const hmac = createHmac('sha256', secret)
  const digest = 'sha256=' + hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
}

// Handle different GitHub webhook events
async function handlePushEvent(payload: any) {
  const supabase = getAdminClient()
  
  // Extract deployment information from push event
  const { ref, commits, repository, head_commit } = payload
  
  // Only process pushes to main branch (deployments)
  if (ref !== 'refs/heads/main') {
    return { processed: false, reason: 'Not a main branch push' }
  }

  // Record deployment event
  const deployment = {
    id: `deploy-${repository.name}-${head_commit.id}`,
    timestamp: head_commit.timestamp,
    commit_sha: head_commit.id,
    environment: 'production',
    service: repository.name,
    status: 'success',
    metadata: {
      ref,
      commits_count: commits.length,
      message: head_commit.message,
      author: head_commit.author.name,
      repository: repository.full_name
    }
  }

  const { error } = await supabase.from('deployments').upsert(deployment)
  if (error) {
    throw new Error(`Failed to store deployment: ${error.message}`)
  }

  return { processed: true, deployment }
}

async function handlePullRequestEvent(payload: any) {
  const supabase = getAdminClient()
  
  const { action, pull_request, repository } = payload
  
  // Process PR opened, closed, or merged events
  if (!['opened', 'closed', 'merged'].includes(action)) {
    return { processed: false, reason: 'PR action not tracked' }
  }

  // Get first commit for lead time calculation
  const commits = await fetch(`https://api.github.com/repos/${repository.full_name}/pulls/${pull_request.number}/commits`, {
    headers: {
      'Authorization': `token ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  }).then(res => res.json())

  const firstCommit = commits[0]
  
  const prEvent = {
    id: `pr-${repository.name}-${pull_request.number}`,
    number: pull_request.number,
    first_commit_at: firstCommit.commit.committer.date,
    created_at: pull_request.created_at,
    merged_at: pull_request.merged_at,
    base_branch: pull_request.base.ref,
    head_branch: pull_request.head.ref,
    metadata: {
      action,
      title: pull_request.title,
      author: pull_request.user.login,
      repository: repository.full_name,
      commits_count: commits.length
    }
  }

  const { error } = await supabase.from('pull_requests').upsert(prEvent)
  if (error) {
    throw new Error(`Failed to store PR event: ${error.message}`)
  }

  return { processed: true, prEvent }
}

async function handleIssuesEvent(payload: any) {
  const supabase = getAdminClient()
  
  const { action, issue, repository } = payload
  
  // Process issues labeled as 'incident' or 'bug'
  const isIncident = issue.labels.some((label: any) => 
    ['incident', 'bug', 'critical'].includes(label.name.toLowerCase())
  )

  if (!isIncident) {
    return { processed: false, reason: 'Issue not marked as incident' }
  }

  // Determine severity from labels
  const severityLabel = issue.labels.find((label: any) => 
    ['critical', 'high', 'medium', 'low'].includes(label.name.toLowerCase())
  )
  const severity = severityLabel?.name.toLowerCase() || 'medium'

  const incident = {
    id: `incident-${repository.name}-${issue.number}`,
    detected_at: issue.created_at,
    resolved_at: action === 'closed' ? issue.closed_at : null,
    severity,
    description: issue.title,
    service: repository.name,
    metadata: {
      action,
      number: issue.number,
      author: issue.user.login,
      repository: repository.full_name,
      labels: issue.labels.map((label: any) => label.name),
      url: issue.html_url
    }
  }

  const { error } = await supabase.from('incidents').upsert(incident)
  if (error) {
    throw new Error(`Failed to store incident: ${error.message}`)
  }

  return { processed: true, incident }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256')
    const githubEvent = request.headers.get('x-github-event')
    
    if (!signature || !githubEvent) {
      return NextResponse.json(
        { error: 'Missing required headers' },
        { status: 400 }
      )
    }

    const body = await request.text()
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, webhookSecret)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const payload = JSON.parse(body)
    let result

    // Route to appropriate handler based on event type
    switch (githubEvent) {
      case 'push':
        result = await handlePushEvent(payload)
        break
      case 'pull_request':
        result = await handlePullRequestEvent(payload)
        break
      case 'issues':
        result = await handleIssuesEvent(payload)
        break
      default:
        result = { processed: false, reason: `Event type ${githubEvent} not handled` }
    }

    return NextResponse.json({
      event: githubEvent,
      processed: result.processed,
      result
    })

  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
