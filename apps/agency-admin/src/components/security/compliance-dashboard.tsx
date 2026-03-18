'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@agency/ui/card'
import { Badge } from '@agency/ui/badge'
import { Button } from '@agency/ui/button'
import { Progress } from '@agency/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@agency/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@agency/ui/alert'
import { AlertTriangle, CheckCircle, XCircle, Shield, TrendingUp, AlertCircle } from 'lucide-react'

interface SecurityDashboardProps {
  className?: string
}

interface ApplicationSecurityStatus {
  name: string
  url: string
  status: 'loading' | 'success' | 'error'
  lastChecked: string
  report?: any
}

const APPLICATIONS = [
  { name: 'Firm', url: 'http://localhost:3000' },
  { name: 'Agency Admin', url: 'http://localhost:3001' },
  { name: 'Riley Day Care', url: 'http://localhost:3002' },
  { name: 'The Barber Cave', url: 'http://localhost:3003' }
]

export function SecurityComplianceDashboard({ className }: SecurityDashboardProps) {
  const [applications, setApplications] = useState<ApplicationSecurityStatus[]>(
    APPLICATIONS.map(app => ({
      ...app,
      status: 'loading',
      lastChecked: new Date().toISOString()
    }))
  )
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  const fetchSecurityReport = async (url: string): Promise<any> => {
    try {
      // Use the new security compliance API
      const response = await fetch('/api/security/compliance')
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const data = await response.json()

      // Find the specific application data
      const appData = data.applications.find((app: any) => app.url === url)
      if (!appData || appData.error) {
        throw new Error(appData?.error || 'Application data not found')
      }

      return appData
    } catch (error) {
      throw new Error(`Failed to fetch security report: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const scanAllApplications = async () => {
    setIsScanning(true)

    const updatedApplications = await Promise.all(
      APPLICATIONS.map(async (app) => {
        try {
          const report = await fetchSecurityReport(app.url)
          return {
            ...app,
            status: 'success' as const,
            lastChecked: new Date().toISOString(),
            report
          }
        } catch (error) {
          return {
            ...app,
            status: 'error' as const,
            lastChecked: new Date().toISOString(),
            report: undefined
          }
        }
      })
    )

    setApplications(updatedApplications)
    setIsScanning(false)
  }

  useEffect(() => {
    scanAllApplications()
  }, [])

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

  const getGradeIcon = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return <CheckCircle className="h-4 w-4" />
      case 'B':
        return <Shield className="h-4 w-4" />
      case 'C':
        return <AlertCircle className="h-4 w-4" />
      case 'D':
      case 'F':
        return <XCircle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const ComplianceBadge = ({ compliant, label }: { compliant: boolean, label: string }) => (
    <Badge variant={compliant ? 'default' : 'destructive'}>
      {compliant ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
      {label}
    </Badge>
  )

  const SecurityScoreCard = ({ app }: { app: ApplicationSecurityStatus }) => {
    if (app.status === 'loading') {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-900" />
              {app.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500">Scanning security headers...</p>
          </CardContent>
        </Card>
      )
    }

    if (app.status === 'error') {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-4 w-4" />
              {app.name}
            </CardTitle>
            <CardDescription>Failed to scan security headers</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => scanAllApplications()}
              className="mt-2"
            >
              Retry Scan
            </Button>
          </CardContent>
        </Card>
      )
    }

    const report = app.report!
    const securityScore = report.security?.score || 0

    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedApp(app.name)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getGradeIcon(report.grade)}
              {app.name}
            </div>
            <Badge className={getGradeColor(report.security?.grade || 'F')}>
              {report.security?.grade || 'F'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Last checked: {new Date(app.lastChecked).toLocaleString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Security Score</span>
                <span className="font-medium">{securityScore}%</span>
              </div>
              <Progress value={securityScore} className="h-2" />
            </div>

            <div className="flex flex-wrap gap-2">
              <ComplianceBadge compliant={report.security?.meetsMinimums || false} label="Security" />
              <ComplianceBadge compliant={report.csp?.meetsMinimums || false} label="CSP" />
            </div>

            {((report.security?.criticalIssues?.length || 0) > 0 || (report.csp?.criticalIssues?.length || 0) > 0) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Critical Issues</AlertTitle>
                <AlertDescription>
                  {(report.security?.criticalIssues?.length || 0) + (report.csp?.criticalIssues?.length || 0)} critical issue{((report.security?.criticalIssues?.length || 0) + (report.csp?.criticalIssues?.length || 0)) > 1 ? 's' : ''} found
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const selectedAppData = applications.find(app => app.name === selectedApp)

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Security Compliance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor security headers and compliance across all applications
          </p>
        </div>
        <Button onClick={scanAllApplications} disabled={isScanning}>
          {isScanning ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
              Scanning...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Scan All
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {applications.map((app) => (
          <SecurityScoreCard key={app.name} app={app} />
        ))}
      </div>

      {selectedAppData && selectedAppData.report && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {selectedAppData.name} - Detailed Report
            </CardTitle>
            <CardDescription>
              Comprehensive security analysis for {selectedAppData.url}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="breakdown">Score Breakdown</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="compliance">Compliance</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Overall Security Score</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-3xl font-bold">
                        {selectedAppData.report?.security?.score || 0}%
                      </div>
                      <Badge className={getGradeColor(selectedAppData.report?.security?.grade || 'F')}>
                        {selectedAppData.report?.security?.grade || 'F'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">CSP Score</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-3xl font-bold">
                        {selectedAppData.report?.csp?.score || 0}%
                      </div>
                      <Badge className={getGradeColor(selectedAppData.report?.csp?.grade || 'F')}>
                        {selectedAppData.report?.csp?.grade || 'F'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium">Security Issues</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-3xl font-bold text-red-600">
                        {selectedAppData.report?.security?.criticalIssues?.length || 0}
                      </div>
                      <span className="text-sm text-gray-500">critical</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">CSP Issues</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-3xl font-bold text-red-600">
                        {selectedAppData.report?.csp?.criticalIssues?.length || 0}
                      </div>
                      <span className="text-sm text-gray-500">critical</span>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="breakdown" className="space-y-4">
                <div className="space-y-4">
                  <h4 className="font-medium">Security Headers</h4>
                  {selectedAppData.report?.headers && Object.entries(selectedAppData.report.headers).map(([header, value]) => (
                    <div key={header} className="flex items-center justify-between p-3 border rounded">
                      <span className="font-medium">{header}</span>
                      <Badge variant={value ? 'default' : 'secondary'}>
                        {value ? 'Present' : 'Missing'}
                      </Badge>
                    </div>
                  ))}
                </div>

                {selectedAppData.report?.csp && (
                  <div className="space-y-4">
                    <h4 className="font-medium">CSP Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>Nonce-based: {selectedAppData.report.csp.nonceBased ? '✅' : '❌'}</div>
                      <div>Strict Dynamic: {selectedAppData.report.csp.strictDynamic ? '✅' : '❌'}</div>
                      <div>Report URI: {selectedAppData.report.csp.reportUri ? '✅' : '❌'}</div>
                      <div>Meets Minimums: {selectedAppData.report.csp.meetsMinimums ? '✅' : '❌'}</div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="issues" className="space-y-4">
                {(selectedAppData.report?.security?.criticalIssues?.length || 0) > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">Security Issues</h4>
                    <ul className="space-y-2">
                      {selectedAppData.report?.security?.criticalIssues?.map((issue: string, index: number) => (
                        <Alert key={index} variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{issue}</AlertDescription>
                        </Alert>
                      ))}
                    </ul>
                  </div>
                )}

                {(selectedAppData.report?.csp?.criticalIssues?.length || 0) > 0 && (
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">CSP Issues</h4>
                    <ul className="space-y-2">
                      {selectedAppData.report?.csp?.criticalIssues?.map((issue: string, index: number) => (
                        <Alert key={index} variant="destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{issue}</AlertDescription>
                        </Alert>
                      ))}
                    </ul>
                  </div>
                )}

                {((selectedAppData.report?.security?.criticalIssues?.length || 0) === 0 &&
                  (selectedAppData.report?.csp?.criticalIssues?.length || 0) === 0) && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertTitle>No Critical Issues</AlertTitle>
                    <AlertDescription>
                      Great job! No critical security issues were found.
                    </AlertDescription>
                  </Alert>
                )}

                {(selectedAppData.report?.security?.recommendations?.length || 0) > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2">Security Recommendations</h4>
                    <ul className="space-y-2">
                      {selectedAppData.report?.security?.recommendations?.map((rec: string, index: number) => (
                        <Alert key={index}>
                          <TrendingUp className="h-4 w-4" />
                          <AlertDescription>{rec}</AlertDescription>
                        </Alert>
                      ))}
                    </ul>
                  </div>
                )}

                {(selectedAppData.report?.csp?.recommendations?.length || 0) > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-600 mb-2">CSP Recommendations</h4>
                    <ul className="space-y-2">
                      {selectedAppData.report?.csp?.recommendations?.map((rec: string, index: number) => (
                        <Alert key={index}>
                          <TrendingUp className="h-4 w-4" />
                          <AlertDescription>{rec}</AlertDescription>
                        </Alert>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="compliance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="font-medium">Security Requirements</span>
                    <ComplianceBadge compliant={selectedAppData.report?.security?.meetsMinimums || false} label={selectedAppData.report?.security?.meetsMinimums ? 'Compliant' : 'Non-Compliant'} />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="font-medium">CSP Requirements</span>
                    <ComplianceBadge compliant={selectedAppData.report?.csp?.meetsMinimums || false} label={selectedAppData.report?.csp?.meetsMinimums ? 'Compliant' : 'Non-Compliant'} />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="font-medium">Nonce-based CSP</span>
                    <ComplianceBadge compliant={selectedAppData.report?.csp?.nonceBased || false} label={selectedAppData.report?.csp?.nonceBased ? 'Yes' : 'No'} />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <span className="font-medium">CSP Reporting</span>
                    <ComplianceBadge compliant={!!selectedAppData.report?.csp?.reportUri} label={selectedAppData.report?.csp?.reportUri ? 'Configured' : 'Missing'} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
