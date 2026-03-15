import { Button } from '@agency/ui'

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Agency Admin Dashboard
              </h1>
              <p className="text-gray-600 mb-8">
                Internal control panel for agency operations
              </p>
              <Button>Get Started</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
