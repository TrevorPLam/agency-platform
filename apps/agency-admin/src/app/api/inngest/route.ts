import { serve } from 'inngest/next'
import { inngest } from '../../../inngest/client'
import { onboardingWorkflow } from '../../../inngest/functions/onboarding'
import { emailSequence } from '../../../inngest/functions/email-sequence'

export const maxDuration = 300

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [onboardingWorkflow, emailSequence],
  streaming: 'allow',
})
