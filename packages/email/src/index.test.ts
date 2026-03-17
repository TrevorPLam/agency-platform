import { beforeEach, describe, expect, it, vi } from 'vitest'

const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}))

vi.mock('resend', () => {
  class Resend {
    emails = {
      send: sendMock,
    }
  }
  return { Resend }
})

import { sendContactNotification, sendEmail } from './index'

describe('email helpers', () => {
  beforeEach(() => {
    sendMock.mockReset()
  })

  it('returns success false when contact target inbox is missing', async () => {
    const result = await sendContactNotification({
      source: 'website',
      name: 'Test User',
      email: 'test@example.com',
      message: 'hello',
      to: '',
    })

    expect(result).toEqual({ success: false, error: 'CONTACT_TO_EMAIL not set' })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('returns success true when resend returns no error', async () => {
    sendMock.mockResolvedValueOnce({ error: null })
    const result = await sendEmail({
      to: 'owner@example.com',
      subject: 'Subject',
      html: '<p>Body</p>',
      from: 'Agency <owner@example.com>',
    })

    expect(result).toEqual({ success: true })
    expect(sendMock).toHaveBeenCalledTimes(1)
  })

  it('returns success false when resend returns an error', async () => {
    sendMock.mockResolvedValueOnce({ error: { message: 'provider-failed' } })
    const result = await sendEmail({
      to: 'owner@example.com',
      subject: 'Subject',
      html: '<p>Body</p>',
      from: 'Agency <owner@example.com>',
    })

    expect(result).toEqual({ success: false, error: 'provider-failed' })
  })
})
