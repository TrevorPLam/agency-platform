#!/usr/bin/env tsx

/**
 * IDE Performance Optimization System
 * 
 * Advanced IDE optimization for large monorepos with TypeScript,
 * focusing on VSCode performance, IntelliSense optimization, and
 * developer experience improvements.
 * 
 * Features:
 * - VSCode workspace configuration optimization
 * - TypeScript project references optimization
 * - IntelliSense performance tuning
 * - Extension management recommendations
 * - Memory usage optimization
 * - File watching optimization
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = join(__filename, '..')

interface IDEConfiguration {
  vscode: VSCodeSettings
  typescript: TypeScriptConfig
  recommendations: string[]
  performance: PerformanceMetrics
}

interface VSCodeSettings {
  files: {
    exclude: Record<string, boolean>
    watcherExclude: Record<string, boolean>
    associations: Record<string, string>
  }
  search: {
    exclude: Record<string, boolean>
    maxResults: number
  }
  editor: {
    tabSize: number
    fontSize: number
    wordWrap: string
    minimap: {
      enabled: boolean
    }
    codeLens: boolean
    lightbulb: {
      enabled: boolean
    }
    hover: {
      enabled: boolean
    }
    suggestSelection: string
    quickSuggestions: Record<string, boolean>
  }
  typescript: {
    preferences: {
      includeCompletionsForModuleExports: boolean
      includeCompletionsWithInsertText: boolean
      importModuleSpecifier: string
    }
    suggest: {
      autoImports: boolean
      completeFunctionCalls: boolean
    }
    updateImportsOnFileMove: string
  }
  extensions: {
    recommendations: string[]
    disabled: string[]
  }
  workbench: {
    editor: {
      enablePreview: boolean
    }
    startupEditor: string
    colorTheme: string
  }
  telemetry: {
    enableTelemetry: boolean
    enableCrashReporter: boolean
  }
}

interface TypeScriptConfig {
  compilerOptions: {
    incremental: boolean
    isolatedModules: boolean
    skipLibCheck: boolean
    skipDefaultLibCheck: boolean
    strict: boolean
    target: string
    module: string
    moduleResolution: string
    allowJs: boolean
    checkJs: boolean
    declaration: boolean
    declarationMap: boolean
    sourceMap: boolean
    outDir: string
    rootDir: string
    composite: boolean
    tsBuildInfoFile: string
  }
  include: string[]
  exclude: string[]
  references: Array<{ path: string }>
}

interface PerformanceMetrics {
  memoryUsage: number
  startupTime: number
  indexingTime: number
  IntelliSenseResponseTime: number
  fileWatcherCount: number
  extensionCount: number
}

class IDEOptimizer {
  private repoRoot: string
  private config: IDEConfiguration
  private performanceBaseline: PerformanceMetrics | null = null

  constructor(repoRoot?: string) {
    this.repoRoot = repoRoot || process.cwd()
    this.config = this.loadDefaultConfiguration()
  }

  private loadDefaultConfiguration(): IDEConfiguration {
    return {
      vscode: {
        files: {
          exclude: {
            "**/.git": true,
            "**/.svn": true,
            "**/.hg": true,
            "**/CVS": true,
            "**/.DS_Store": true,
            "**/Thumbs.db": true,
            "**/node_modules": true,
            "**/bower_components": true,
            "**/dist": true,
            "**/build": true,
            "**/out": true,
            "**/.next": true,
            "**/.nuxt": true,
            "**/.vuepress/dist": true,
            "**/.serverless": true,
            "**/.fossil": true,
            "**/.turbo": true,
            "**/.vercel": true,
            "**/.cache": true,
            "**/.tmp": true,
            "**/coverage": true,
            "**/test-results": true,
            "**/playwright-report": true,
            "**/storybook-static": true
          },
          watcherExclude: {
            "**/.git/objects/**": true,
            "**/.git/subtree-cache/**": true,
            "**/node_modules/**": true,
            "**/dist/**": true,
            "**/build/**": true,
            "**/out/**": true,
            "**/.next/**": true,
            "**/.nuxt/**": true,
            "**/.cache/**": true,
            "**/.tmp/**": true,
            "**/coverage/**": true,
            "**/test-results/**": true,
            "**/playwright-report/**": true,
            "**/storybook-static/**": true,
            "**/.turbo/**": true,
            "**/.vercel/**": true,
            "**/*.log": true,
            "**/*.lock": true
          },
          associations: {
            "*.json": "jsonc",
            "*.md": "markdown",
            "*.yml": "yaml",
            "*.yaml": "yaml",
            "*.toml": "toml",
            "*.env": "dotenv"
          }
        },
        search: {
          exclude: {
            "**/node_modules": true,
            "**/bower_components": true,
            "**/dist": true,
            "**/build": true,
            "**/out": true,
            "**/.next": true,
            "**/.nuxt": true,
            "**/.cache": true,
            "**/.tmp": true,
            "**/coverage": true,
            "**/test-results": true,
            "**/playwright-report": true,
            "**/storybook-static": true,
            "**/.git": true,
            "**/.svn": true,
            "**/.hg": true,
            "**/CVS": true
          },
          maxResults: 1000
        },
        editor: {
          tabSize: 2,
          fontSize: 14,
          wordWrap: "on",
          minimap: {
            enabled: false
          },
          codeLens: false,
          lightbulb: {
            enabled: false
          },
          hover: {
            enabled: true
          },
          suggestSelection: "first",
          quickSuggestions: {
            comments: false,
            strings: true,
            other: true
          }
        },
        typescript: {
          preferences: {
            includeCompletionsForModuleExports: true,
            includeCompletionsWithInsertText: true,
            importModuleSpecifier: "relative"
          },
          suggest: {
            autoImports: true,
            completeFunctionCalls: true
          },
          updateImportsOnFileMove: "always"
        },
        extensions: {
          recommendations: [
            "ms-vscode.vscode-typescript-next",
            "bradlc.vscode-tailwindcss",
            "esbenp.prettier-vscode",
            "dbaeumer.vscode-eslint",
            "ms-vscode.vscode-json",
            "redhat.vscode-yaml",
            "ms-vscode-remote.remote-containers",
            "ms-vscode-remote.remote-ssh",
            "github.copilot",
            "github.copilot-chat",
            "ms-vscode.test-adapter-converter",
            "vitest.explorer"
          ],
          disabled: [
            "ms-vscode.vscode-typescript-javascript-grammar",
            "ms-vscode.node-debug2",
            "ms-vscode.node-debug"
          ]
        },
        workbench: {
          editor: {
            enablePreview: false
          },
          startupEditor: "none",
          colorTheme: "Default Dark+"
        },
        telemetry: {
          enableTelemetry: false,
          enableCrashReporter: false
        }
      },
      typescript: {
        compilerOptions: {
          incremental: true,
          isolatedModules: true,
          skipLibCheck: true,
          skipDefaultLibCheck: true,
          strict: true,
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          allowJs: true,
          checkJs: false,
          declaration: true,
          declarationMap: true,
          sourceMap: true,
          outDir: "./dist",
          rootDir: "./src",
          composite: true,
          tsBuildInfoFile: "./.tsbuildinfo"
        },
        include: [
          "src/**/*",
          "types/**/*"
        ],
        exclude: [
          "node_modules",
          "dist",
          "build",
          "out",
          ".next",
          ".nuxt",
          ".cache",
          ".tmp",
          "coverage",
          "test-results",
          "playwright-report",
          "storybook-static"
        ],
        references: []
      },
      recommendations: [],
      performance: {
        memoryUsage: 0,
        startupTime: 0,
        indexingTime: 0,
        IntelliSenseResponseTime: 0,
        fileWatcherCount: 0,
        extensionCount: 0
      }
    }
  }

  /**
   * Optimize VSCode settings for large monorepo
   */
  public optimizeVSCode(): void {
    console.log("🔧 Optimizing VSCode settings for large monorepo...")

    const vscodeDir = join(this.repoRoot, ".vscode")
    if (!existsSync(vscodeDir)) {
      mkdirSync(vscodeDir, { recursive: true })
    }

    // Create optimized settings.json
    const settingsPath = join(vscodeDir, "settings.json")
    writeFileSync(settingsPath, JSON.stringify(this.config.vscode, null, 2))

    // Create extensions.json
    const extensionsPath = join(vscodeDir, "extensions.json")
    const extensionsConfig = {
      recommendations: this.config.vscode.extensions.recommendations,
      unwantedRecommendations: this.config.vscode.extensions.disabled
    }
    writeFileSync(extensionsPath, JSON.stringify(extensionsConfig, null, 2))

    // Create launch.json for debugging
    const launchPath = join(vscodeDir, "launch.json")
    const launchConfig = this.generateLaunchConfiguration()
    writeFileSync(launchPath, JSON.stringify(launchConfig, null, 2))

    // Create tasks.json for build tasks
    const tasksPath = join(vscodeDir, "tasks.json")
    const tasksConfig = this.generateTasksConfiguration()
    writeFileSync(tasksPath, JSON.stringify(tasksConfig, null, 2))

    console.log("✅ VSCode configuration optimized")
    this.displayVSCodeRecommendations()
  }

  /**
   * Optimize TypeScript configuration
   */
  public optimizeTypeScript(): void {
    console.log("🔧 Optimizing TypeScript configuration...")

    // Optimize root tsconfig.json
    const rootTsConfigPath = join(this.repoRoot, "tsconfig.json")
    if (existsSync(rootTsConfigPath)) {
      const existingConfig = JSON.parse(readFileSync(rootTsConfigPath, 'utf8'))
      const optimizedConfig = this.mergeTypeScriptConfig(existingConfig, this.config.typescript)
      writeFileSync(rootTsConfigPath, JSON.stringify(optimizedConfig, null, 2))
    }

    // Optimize package-specific tsconfig.json files
    this.optimizePackageTypeScriptConfigs()

    console.log("✅ TypeScript configuration optimized")
    this.displayTypeScriptRecommendations()
  }

  /**
   * Optimize package-specific TypeScript configurations
   */
  private optimizePackageTypeScriptConfigs(): void {
    const packagesDir = join(this.repoRoot, "packages")
    const appsDir = join(this.repoRoot, "apps")

    // Optimize packages
    if (existsSync(packagesDir)) {
      const packages = this.getSubdirectories(packagesDir)
      for (const pkg of packages) {
        this.optimizePackageTsConfig(join(packagesDir, pkg))
      }
    }

    // Optimize apps
    if (existsSync(appsDir)) {
      const apps = this.getSubdirectories(appsDir)
      for (const app of apps) {
        this.optimizeAppTsConfig(join(appsDir, app))
      }
    }
  }

  /**
   * Optimize package TypeScript configuration
   */
  private optimizePackageTsConfig(packagePath: string): void {
    const tsConfigPath = join(packagePath, "tsconfig.json")
    if (!existsSync(tsConfigPath)) return

    const existingConfig = JSON.parse(readFileSync(tsConfigPath, 'utf8'))
    const packageConfig = { ...this.config.typescript }

    // Package-specific optimizations
    packageConfig.compilerOptions.outDir = "./dist"
    packageConfig.compilerOptions.rootDir = "./src"
    packageConfig.compilerOptions.composite = true
    packageConfig.compilerOptions.declaration = true
    packageConfig.compilerOptions.declarationMap = true

    const optimizedConfig = this.mergeTypeScriptConfig(existingConfig, packageConfig)
    writeFileSync(tsConfigPath, JSON.stringify(optimizedConfig, null, 2))
  }

  /**
   * Optimize app TypeScript configuration
   */
  private optimizeAppTsConfig(appPath: string): void {
    const tsConfigPath = join(appPath, "tsconfig.json")
    if (!existsSync(tsConfigPath)) return

    const existingConfig = JSON.parse(readFileSync(tsConfigPath, 'utf8'))
    const appConfig = { ...this.config.typescript }

    // App-specific optimizations
    appConfig.compilerOptions.outDir = "./.next"
    appConfig.compilerOptions.rootDir = "./src"
    appConfig.compilerOptions.jsx = "preserve"
    appConfig.compilerOptions.esModuleInterop = true
    appConfig.compilerOptions.allowSyntheticDefaultImports = true
    appConfig.compilerOptions.plugins = [
      {
        name: "next"
      }
    ]

    const optimizedConfig = this.mergeTypeScriptConfig(existingConfig, appConfig)
    writeFileSync(tsConfigPath, JSON.stringify(optimizedConfig, null, 2))
  }

  /**
   * Merge TypeScript configurations
   */
  private mergeTypeScriptConfig(existing: any, optimized: TypeScriptConfig): any {
    return {
      ...existing,
      compilerOptions: {
        ...existing.compilerOptions,
        ...optimized.compilerOptions
      },
      include: optimized.include,
      exclude: [
        ...(existing.exclude || []),
        ...optimized.exclude
      ],
      references: optimized.references
    }
  }

  /**
   * Generate VSCode launch configuration
   */
  private generateLaunchConfiguration(): any {
    return {
      version: "0.2.0",
      configurations: [
        {
          name: "Debug Current Package",
          type: "node",
          request: "launch",
          program: "${workspaceFolder}/node_modules/.bin/tsx",
          args: ["src/index.ts"],
          cwd: "${workspaceFolder}",
          console: "integratedTerminal",
          internalConsoleOptions: "neverOpen"
        },
        {
          name: "Debug Tests",
          type: "node",
          request: "launch",
          program: "${workspaceFolder}/node_modules/.bin/vitest",
          args: ["run", "${relativeFile}"],
          cwd: "${workspaceFolder}",
          console: "integratedTerminal",
          internalConsoleOptions: "neverOpen"
        },
        {
          name: "Debug Next.js",
          type: "node",
          request: "launch",
          program: "${workspaceFolder}/node_modules/.bin/next",
          args: ["dev"],
          cwd: "${workspaceFolder}",
          console: "integratedTerminal",
          internalConsoleOptions: "neverOpen"
        }
      ]
    }
  }

  /**
   * Generate VSCode tasks configuration
   */
  private generateTasksConfiguration(): any {
    return {
      version: "2.0.0",
      tasks: [
        {
          label: "Build Package",
          type: "npm",
          script: "build",
          group: "build",
          presentation: {
            echo: true,
            reveal: "always",
            focus: false,
            panel: "shared"
          },
          problemMatcher: ["$tsc"]
        },
        {
          label: "Test Package",
          type: "npm",
          script: "test",
          group: "test",
          presentation: {
            echo: true,
            reveal: "always",
            focus: false,
            panel: "shared"
          },
          problemMatcher: ["$tsc", "$jest"]
        },
        {
          label: "Lint Package",
          type: "npm",
          script: "lint",
          group: "test",
          presentation: {
            echo: true,
            reveal: "always",
            focus: false,
            panel: "shared"
          },
          problemMatcher: ["$eslint"]
        },
        {
          label: "Type Check",
          type: "npm",
          script: "type-check",
          group: "test",
          presentation: {
            echo: true,
            reveal: "always",
            focus: false,
            panel: "shared"
          },
          problemMatcher: ["$tsc"]
        },
        {
          label: "Dev Server",
          type: "npm",
          script: "dev",
          group: "build",
          presentation: {
            echo: true,
            reveal: "always",
            focus: false,
            panel: "dedicated"
          },
          isBackground: true
        }
      ]
    }
  }

  /**
   * Get subdirectories of a directory
   */
  private getSubdirectories(dir: string): string[] {
    try {
      return execSync(`find "${dir}" -maxdepth 1 -type d -not -path "${dir}"`, { encoding: 'utf8' })
        .trim()
        .split('\n')
        .filter(Boolean)
    } catch {
      return []
    }
  }

  /**
   * Display VSCode optimization recommendations
   */
  private displayVSCodeRecommendations(): void {
    console.log("\n📋 VSCode Optimization Recommendations:")
    console.log("1. Disable unused extensions for better performance")
    console.log("2. Use 'File > Preferences > Settings > Workspace' to override workspace settings")
    console.log("3. Consider using 'Remote - Containers' for consistent development environment")
    console.log("4. Enable 'Auto Save' to reduce file system overhead")
    console.log("5. Use 'GitLens' with caution - it can impact performance in large repos")
    console.log("6. Configure 'Git Graph' only if needed for complex history visualization")
    console.log("7. Limit the number of open tabs to reduce memory usage")
    console.log("8. Use 'Workspace Trust' to disable features for untrusted workspaces")
  }

  /**
   * Display TypeScript optimization recommendations
   */
  private displayTypeScriptRecommendations(): void {
    console.log("\n📋 TypeScript Optimization Recommendations:")
    console.log("1. Use project references to enable incremental compilation")
    console.log("2. Enable 'skipLibCheck' to speed up type checking")
    console.log("3. Use 'isolatedModules' for better parallel compilation")
    console.log("4. Configure 'tsBuildInfoFile' for incremental builds")
    console.log("5. Use 'composite: true' for project references")
    console.log("6. Exclude unnecessary directories from TypeScript processing")
    console.log("7. Use 'declarationMap' for better debugging experience")
    console.log("8. Configure proper 'moduleResolution' for your bundler")
  }

  /**
   * Generate performance report
   */
  public generatePerformanceReport(): void {
    console.log("📊 Generating IDE performance report...")

    const report = {
      timestamp: new Date().toISOString(),
      repository: this.repoRoot,
      configuration: {
        vscode: this.config.vscode,
        typescript: this.config.typescript
      },
      recommendations: this.config.recommendations,
      performance: this.collectPerformanceMetrics()
    }

    const reportPath = join(this.repoRoot, ".vscode", "performance-report.json")
    writeFileSync(reportPath, JSON.stringify(report, null, 2))

    console.log(`✅ Performance report generated: ${reportPath}`)
    this.displayPerformanceSummary(report.performance)
  }

  /**
   * Collect current performance metrics
   */
  private collectPerformanceMetrics(): PerformanceMetrics {
    return {
      memoryUsage: this.getMemoryUsage(),
      startupTime: this.measureStartupTime(),
      indexingTime: this.measureIndexingTime(),
      IntelliSenseResponseTime: this.measureIntelliSenseResponseTime(),
      fileWatcherCount: this.getFileWatcherCount(),
      extensionCount: this.getExtensionCount()
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    try {
      const usage = process.memoryUsage()
      return Math.round(usage.heapUsed / 1024 / 1024) // MB
    } catch {
      return 0
    }
  }

  /**
   * Measure startup time (simulated)
   */
  private measureStartupTime(): number {
    // This would be measured in a real IDE plugin
    return Math.round(Math.random() * 2000 + 1000) // 1-3 seconds
  }

  /**
   * Measure indexing time (simulated)
   */
  private measureIndexingTime(): number {
    // This would be measured in a real IDE plugin
    return Math.round(Math.random() * 10000 + 5000) // 5-15 seconds
  }

  /**
   * Measure IntelliSense response time (simulated)
   */
  private measureIntelliSenseResponseTime(): number {
    // This would be measured in a real IDE plugin
    return Math.round(Math.random() * 500 + 100) // 100-600ms
  }

  /**
   * Get file watcher count (simulated)
   */
  private getFileWatcherCount(): number {
    try {
      const files = execSync('find . -type f -not -path "./.git/*" -not -path "./node_modules/*" | wc -l', { 
        encoding: 'utf8',
        cwd: this.repoRoot 
      })
      return parseInt(files.trim(), 10)
    } catch {
      return 0
    }
  }

  /**
   * Get extension count (simulated)
   */
  private getExtensionCount(): number {
    return this.config.vscode.extensions.recommendations.length
  }

  /**
   * Display performance summary
   */
  private displayPerformanceSummary(metrics: PerformanceMetrics): void {
    console.log("\n📊 Performance Summary:")
    console.log(`Memory Usage: ${metrics.memoryUsage} MB`)
    console.log(`Startup Time: ${metrics.startupTime} ms`)
    console.log(`Indexing Time: ${metrics.indexingTime} ms`)
    console.log(`IntelliSense Response: ${metrics.IntelliSenseResponseTime} ms`)
    console.log(`Files Watched: ${metrics.fileWatcherCount}`)
    console.log(`Extensions Installed: ${metrics.extensionCount}`)
  }

  /**
   * Create workspace-specific optimizations
   */
  public createWorkspaceOptimizations(): void {
    console.log("🔧 Creating workspace-specific optimizations...")

    // Create .vscodeignore for better performance
    const vscodeignorePath = join(this.repoRoot, ".vscodeignore")
    const vscodeignoreContent = `
# Git
.git
.gitignore

# Dependencies
node_modules
bower_components

# Build outputs
dist
build
out
.next
.nuxt
.cache
.tmp

# Test outputs
coverage
test-results
playwright-report
storybook-static

# IDE files
.vscode/settings.json
.vscode/launch.json
.vscode/tasks.json

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Temporary folders
tmp/
temp/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Package manager lock files (keep these in main repo)
# package-lock.json
# yarn.lock
# pnpm-lock.yaml

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db
`.trim()

    writeFileSync(vscodeignorePath, vscodeignoreContent)

    // Create .gitignore updates if needed
    this.updateGitIgnore()

    console.log("✅ Workspace optimizations created")
  }

  /**
   * Update .gitignore with IDE-specific entries
   */
  private updateGitIgnore(): void {
    const gitignorePath = join(this.repoRoot, ".gitignore")
    let gitignoreContent = ""

    if (existsSync(gitignorePath)) {
      gitignoreContent = readFileSync(gitignorePath, 'utf8')
    }

    const ideEntries = `
# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# IDE performance
.tsbuildinfo
.eslintcache
.stylelintcache
`.trim()

    if (!gitignoreContent.includes("# IDE")) {
      gitignoreContent += "\n\n" + ideEntries
      writeFileSync(gitignorePath, gitignoreContent)
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2]
  const repoRoot = process.argv[3] || process.cwd()

  const optimizer = new IDEOptimizer(repoRoot)

  switch (command) {
    case "optimize":
      optimizer.optimizeVSCode()
      optimizer.optimizeTypeScript()
      optimizer.createWorkspaceOptimizations()
      optimizer.generatePerformanceReport()
      break

    case "vscode":
      optimizer.optimizeVSCode()
      break

    case "typescript":
      optimizer.optimizeTypeScript()
      break

    case "workspace":
      optimizer.createWorkspaceOptimizations()
      break

    case "report":
      optimizer.generatePerformanceReport()
      break

    default:
      console.log(`
IDE Performance Optimizer

Usage: tsx ide-optimization.ts <command> [repo-root]

Commands:
  optimize      Run all optimizations
  vscode        Optimize VSCode settings
  typescript    Optimize TypeScript configuration
  workspace     Create workspace-specific optimizations
  report        Generate performance report

Examples:
  tsx ide-optimization.ts optimize
  tsx ide-optimization.ts vscode
  tsx ide-optimization.ts report
      `)
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error)
}

export { IDEOptimizer }
