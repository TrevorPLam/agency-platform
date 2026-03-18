/**
 * Security Compliance Dashboard
 * 
 * Provides real-time security header monitoring and compliance reporting
 * for all agency platform applications
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@agency/ui/card'
import { Badge } from '@agency/ui/badge'
import { Button } from '@agency/ui/button'
import { Progress } from '@agency/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@agency/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@agency/ui/tabs'
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  Download,
  Info
} from 'lucide-react'

interface SecurityHeaderResult {
  header: string
  present: boolean
  value?: string
  valid: boolean
  score: number
  maxScore: number
  issues: string[]
}

interface SecurityScanResult {
  url: string
  timestamp: string
  overallScore: number
  maxScore: number
  grade: string
  headers: Record<string, SecurityHeaderResult>
  criticalIssues: string[]
  recommendations: string[]
}

interface ApplicationSecurity {
  name: string
  url: string
  type: 'admin' | 'public' | 'client'
  lastScan: SecurityScanResult | null
  isScanning: boolean
  error?: string | undefined
}

const APPLICATIONS: ApplicationSecurity[] = [
  { name: 'Agency Admin', url: 'http://localhost:3001', type: 'admin', lastScan: null, isScanning: false },
  { name: 'Firm', url: 'http://localhost:3000', type: 'public', lastScan: null, isScanning: false },
  { name: 'Riley Day Care', url: 'http://localhost:3002', type: 'client', lastScan: null, isScanning: false },
  { name: 'The Barber Cave', url: 'http://localhost:3003', type: 'client', lastScan: null, isScanning: false }
]

export default function SecurityComplianceDashboard() {
  const [applications, setApplications] = useState<ApplicationSecurity[]>(APPLICATIONS)
  const [selectedApp, setSelectedApp] = useState<ApplicationSecurity | null>(null)
  const [isScanningAll, setIsScanningAll] = useState(false)

  // Scan security headers for a single application
  const scanApplication = async (app: ApplicationSecurity) => {
    setApplications(prev => prev.map(a => 
      a.name === app.name 
        ? { ...a, isScanning: true, error: undefined }
        : a
    ))

    try {
      const response = await fetch('/api/security/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: app.url })
      })

      if (!response.ok) {
        throw new Error(`Scan failed: ${response.statusText}`)
      }

      const scanResult: SecurityScanResult = await response.json()
      
      setApplications(prev => prev.map(a => 
        a.name === app.name 
          ? { ...a, lastScan: scanResult, isScanning: false }
          : a
      ))
    } catch (error) {
      setApplications(prev => prev.map(a => 
        a.name === app.name 
          ? { ...a, isScanning: false, error: error instanceof Error ? error.message : 'Unknown error' }
          : a
      ))
    }
  }

  // Scan all applications
  const scanAllApplications = async () => {
    setIsScanningAll(true)
    
    await Promise.all(
      applications.map(app => scanApplication(app))
    )
    
    setIsScanningAll(false)
  }

  // Initial scan on component mount
  useEffect(() => {
    scanAllApplications()
  }, [])

  // Get grade color
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-green-500'
      case 'B':
        return 'bg-blue-500'
      case 'C':
        return 'bg-yellow-500'
      case 'D':
        return 'bg-orange-500'
      case 'F':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  // Get status icon
  const getStatusIcon = (app: ApplicationSecurity) => {
    if (app.isScanning) {
      return <RefreshCw className="h-4 w-4 animate-spin" />
    }
    
    if (app.error) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    
    if (!app.lastScan) {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />
    }
    
    const grade = app.lastScan.grade
    if (grade === 'A+' || grade === 'A') {
      return <ShieldCheck className="h-4 w-4 text-green-500" />
    } else if (grade === 'F') {
      return <ShieldAlert className="h-4 w-4 text-red-500" />
    } else {
      return <Shield className="h-4 w-4 text-yellow-500" />
    }
  }

  // Calculate overall security score
  const getOverallScore = () => {
    const scannedApps = applications.filter(app => app.lastScan && !app.error)
    if (scannedApps.length === 0) return 0
    
    const totalScore = scannedApps.reduce((sum, app) => sum + app.lastScan!.overallScore, 0)
    const totalMaxScore = scannedApps.reduce((sum, app) => sum + app.lastScan!.maxScore, 0)
    
    return Math.round((totalScore / totalMaxScore) * 100)
  }

  // Get critical issues count
  const getCriticalIssuesCount = () => {
    return applications.reduce((count, app) => 
      count + (app.lastScan?.criticalIssues.length || 0), 0
    )
  }

  // Export security report
  const exportReport = async () => {
    try {
      const response = await fetch('/api/security/report')
      const reportData = await response.json()
      
      // Create and download the report
      const blob = new Blob([reportData.report], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `security-report-${new Date().toISOString().split('T')[0]}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export report:', error)
    }
  }

  const overallScore = getOverallScore()
  const criticalIssues = getCriticalIssuesCount()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Security Compliance Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of security headers across all applications
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button 
            onClick={scanAllApplications} 
            disabled={isScanningAll}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isScanningAll ? 'animate-spin' : ''}`} />
            {isScanningAll ? 'Scanning...' : 'Scan All'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallScore}%</div>
            <Progress value={overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{criticalIssues}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications.filter(app => app.lastScan && !app.error).length}
            </div>
            <p className="text-xs text-muted-foreground">of {applications.length} scanned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Scan</CardTitle>
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {applications
                .filter(app => app.lastScan)
                .map(app => new Date(app.lastScan!.timestamp).toLocaleTimeString())
                .join(', ') || 'Never'}
            </div>
            <p className="text-xs text-muted-foreground">Most recent scan time</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical Issues Alert */}
      {criticalIssues > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Security Issues Detected</AlertTitle>
          <AlertDescription>
            {criticalIssues} critical security issue{criticalIssues > 1 ? 's' : ''} found across applications. 
            Review the details below and address immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Applications Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {applications.map(app => (
          <Card key={app.name} className="cursor-pointer" onClick={() => setSelectedApp(app)}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(app)}
                  <CardTitle className="text-lg">{app.name}</CardTitle>
                </div>
                <Badge variant={app.type === 'admin' ? 'destructive' : 'secondary'}>
                  {app.type}
                </Badge>
              </div>
              <CardDescription>{app.url}</CardDescription>
            </CardHeader>
            <CardContent>
              {app.error ? (
                <div className="text-red-500 text-sm">
                  <XCircle className="h-4 w-4 inline mr-2" />
                  {app.error}
                </div>
              ) : app.lastScan ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Security Grade</span>
                    <Badge className={getGradeColor(app.lastScan.grade)}>
                      {app.lastScan.grade}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>Score</span>
                      <span>{Math.round((app.lastScan.overallScore / app.lastScan.maxScore) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(app.lastScan.overallScore / app.lastScan.maxScore) * 100} 
                      className="h-2" 
                    />
                  </div>
                  {app.lastScan.criticalIssues.length > 0 && (
                    <div className="text-red-500 text-sm">
                      <AlertTriangle className="h-4 w-4 inline mr-1" />
                      {app.lastScan.criticalIssues.length} critical issue{app.lastScan.criticalIssues.length > 1 ? 's' : ''}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Last scanned: {new Date(app.lastScan.timestamp).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  Not scanned yet
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed View Modal */}
      {selectedApp && selectedApp.lastScan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedApp.name} Security Details</CardTitle>
                  <CardDescription>{selectedApp.url}</CardDescription>
                </div>
                <Button variant="ghost" onClick={() => setSelectedApp(null)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="overview" className="w-full">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="headers">Headers</TabsTrigger>
                  <TabsTrigger value="issues">Issues</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium">Security Grade</h4>
                      <Badge className={`mt-1 ${getGradeColor(selectedApp.lastScan.grade)}`}>
                        {selectedApp.lastScan.grade}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-medium">Score</h4>
                      <div className="text-2xl font-bold mt-1">
                        {Math.round((selectedApp.lastScan.overallScore / selectedApp.lastScan.maxScore) * 100)}%
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Critical Issues</h4>
                      <div className="text-2xl font-bold text-red-500 mt-1">
                        {selectedApp.lastScan.criticalIssues.length}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium">Headers Checked</h4>
                      <div className="text-2xl font-bold mt-1">
                        {Object.keys(selectedApp.lastScan.headers).length}
                      </div>
                    </div>
                  </div>
                  
                  {selectedApp.lastScan.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <ul className="space-y-1 text-sm">
                        {selectedApp.lastScan.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Info className="h-4 w-4 mt-0.5 text-blue-500 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="headers" className="space-y-4">
                  {Object.entries(selectedApp.lastScan.headers).map(([headerName, result]) => (
                    <div key={headerName} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{headerName}</h4>
                        <div className="flex items-center gap-2">
                          {result.valid ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {result.score}/{result.maxScore}
                          </span>
                        </div>
                      </div>
                      {result.value && (
                        <div className="text-sm text-muted-foreground mb-2 font-mono bg-gray-100 p-2 rounded">
                          {result.value}
                        </div>
                      )}
                      {result.issues.length > 0 && (
                        <ul className="text-sm text-red-500 space-y-1">
                          {result.issues.map((issue, index) => (
                            <li key={index}>• {issue}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </TabsContent>
                
                <TabsContent value="issues" className="space-y-4">
                  {selectedApp.lastScan.criticalIssues.length > 0 ? (
                    <div>
                      <h4 className="font-medium mb-2 text-red-500">Critical Issues</h4>
                      <ul className="space-y-2">
                        {selectedApp.lastScan.criticalIssues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded">
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>No critical issues found!</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
