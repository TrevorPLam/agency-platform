'use server'

export type ContactFormState = {
  success: boolean
  message: string
}

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData
): Promise<ContactFormState> {
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const message = (formData.get('message') as string)?.trim()

  if (!name || !email || !message) {
    return { success: false, message: 'Please fill in all fields.' }
  }

  // Placeholder: in production, send email (Resend, SendGrid, etc.) or store in DB
  await new Promise((r) => setTimeout(r, 500))

  return { success: true, message: 'Thank you! We will get back to you soon.' }
}
