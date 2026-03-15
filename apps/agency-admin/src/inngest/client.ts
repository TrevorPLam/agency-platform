import { Inngest } from 'inngest'

export const inngest = new Inngest({
  id: 'agency-admin',
  checkpointing: {
    maxRuntime: '260s',
    bufferedSteps: 2,
    maxInterval: '10s',
  },
})
