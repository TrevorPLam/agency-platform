import { Button } from '@agency/ui'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Welcome to Our Agency
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            We deliver exceptional digital marketing solutions that drive results
          </p>
          <div className="space-x-4">
            <Button size="lg">Get Started</Button>
            <Button variant="outline" size="lg">
              Learn More
            </Button>
          </div>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Strategy</h3>
            <p className="text-slate-600">
              Data-driven marketing strategies tailored to your business goals
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Design</h3>
            <p className="text-slate-600">
              Creative design solutions that capture your brand essence
            </p>
          </div>
          <div className="text-center p-6 bg-white rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Growth</h3>
            <p className="text-slate-600">
              Sustainable growth through optimized marketing campaigns
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
