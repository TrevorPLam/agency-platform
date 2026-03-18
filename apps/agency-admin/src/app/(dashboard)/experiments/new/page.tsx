import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@agency/ui/card'
import { Button } from '@agency/ui/button'
import { Input } from '@agency/ui/input'
import { Label } from '@agency/ui/label'
import { Textarea } from '@agency/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@agency/ui/select'
import { Badge } from '@agency/ui/badge'
import { Plus, Trash2, ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

export default function NewExperimentPage() {
  // In a real implementation, this would be handled by a form library
  // and would include proper validation and state management
  
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    // Handle form submission
    console.log('Creating experiment...')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/experiments">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Experiments
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">New Experiment</h1>
            <p className="text-muted-foreground">
              Create a new A/B test or feature experiment
            </p>
          </div>
        </div>
        <Button type="submit" form="experiment-form">
          <Save className="mr-2 h-4 w-4" />
          Create Experiment
        </Button>
      </div>

      {/* Form */}
      <form id="experiment-form" onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Configure the basic details of your experiment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Experiment Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Homepage Hero Variant Test"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="key">Experiment Key</Label>
                <Input
                  id="key"
                  placeholder="e.g., homepage-hero-2024-q1"
                  pattern="[a-z0-9-]+"
                  title="Lowercase letters, numbers, and hyphens only"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what you're testing and why..."
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="traffic">Traffic Percentage</Label>
                <Input
                  id="traffic"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="100"
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner">Owner</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sarah">Sarah Chen</SelectItem>
                    <SelectItem value="mike">Mike Johnson</SelectItem>
                    <SelectItem value="alex">Alex Rivera</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PICOT Framework */}
        <Card>
          <CardHeader>
            <CardTitle>PICOT Framework</CardTitle>
            <CardDescription>
              Define your experiment using the PICOT framework for clear, testable hypotheses
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="population">
                  Population <Badge variant="outline" className="ml-2">P</Badge>
                </Label>
                <Input
                  id="population"
                  placeholder="e.g., All mobile users, New visitors"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Who are you testing with?
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="intervention">
                  Intervention <Badge variant="outline" className="ml-2">I</Badge>
                </Label>
                <Input
                  id="intervention"
                  placeholder="e.g., New hero section design"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  What are you testing?
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="control">
                  Control <Badge variant="outline" className="ml-2">C</Badge>
                </Label>
                <Input
                  id="control"
                  placeholder="e.g., Current hero section"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  What is the baseline?
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="outcome">
                  Outcome <Badge variant="outline" className="ml-2">O</Badge>
                </Label>
                <Input
                  id="outcome"
                  placeholder="e.g., Conversion rate, Click-through rate"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  What metric will you measure?
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time">
                Time Horizon <Badge variant="outline" className="ml-2">T</Badge>
              </Label>
              <Input
                id="time"
                placeholder="e.g., 14 days, 1000 conversions"
                required
              />
              <p className="text-sm text-muted-foreground">
                How long will the test run or what sample size do you need?
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hypothesis">Hypothesis Statement</Label>
              <Textarea
                id="hypothesis"
                placeholder="Changing the hero section from the current design to the new design will increase conversion rate by 15% over 14 days for mobile users."
                rows={3}
                required
              />
              <p className="text-sm text-muted-foreground">
                A clear, testable statement combining your PICOT elements
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Variants */}
        <Card>
          <CardHeader>
            <CardTitle>Experiment Variants</CardTitle>
            <CardDescription>
              Define the different versions you'll be testing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Control Variant */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Control</Badge>
                  <h4 className="font-semibold">Control Group</h4>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="control-name">Variant Name</Label>
                  <Input
                    id="control-name"
                    defaultValue="Control"
                    placeholder="Control"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="control-key">Variant Key</Label>
                  <Input
                    id="control-key"
                    defaultValue="control"
                    placeholder="control"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="control-description">Description</Label>
                <Textarea
                  id="control-description"
                  placeholder="The current version as baseline"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="control-traffic">Traffic Percentage</Label>
                <Input
                  id="control-traffic"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="50"
                  placeholder="50"
                />
              </div>
            </div>

            {/* Test Variant */}
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">Test</Badge>
                  <h4 className="font-semibold">Test Variant</h4>
                </div>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="test-name">Variant Name</Label>
                  <Input
                    id="test-name"
                    defaultValue="Variant A"
                    placeholder="Variant A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-key">Variant Key</Label>
                  <Input
                    id="test-key"
                    defaultValue="variant_a"
                    placeholder="variant_a"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="test-description">Description</Label>
                <Textarea
                  id="test-description"
                  placeholder="The new version being tested"
                  rows={2}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="test-traffic">Traffic Percentage</Label>
                <Input
                  id="test-traffic"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue="50"
                  placeholder="50"
                />
              </div>
            </div>

            {/* Add Variant Button */}
            <Button variant="outline" type="button" className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Another Variant
            </Button>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Configuration</CardTitle>
            <CardDescription>
              Additional settings for your experiment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="confidence">Confidence Level</Label>
                <Select defaultValue="0.95">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.90">90%</SelectItem>
                    <SelectItem value="0.95">95% (Recommended)</SelectItem>
                    <SelectItem value="0.99">99%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="power">Statistical Power</Label>
                <Select defaultValue="0.80">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.70">70%</SelectItem>
                    <SelectItem value="0.80">80% (Recommended)</SelectItem>
                    <SelectItem value="0.90">90%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
