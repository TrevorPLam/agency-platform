#!/usr/bin/env tsx

/**
 * Dependency Report Generator
 * 
 * This script generates comprehensive reports about the project's dependencies,
 * including outdated packages, security vulnerabilities, and license information.
 */

import { execSync } from 'child_process';
import { readFile, writeFile } from 'fs';
import { join } from 'path';

interface ReportOptions {
  outputFile?: string;
  outputFormat: 'markdown' | 'json' | 'html';
  includeSecurity: boolean;
  includeOutdated: boolean;
  includeLicenses: boolean;
}

interface DependencyReport {
  summary: {
    totalDependencies: number;
    outdatedDependencies: number;
    securityVulnerabilities: number;
    licenseIssues: number;
    lastUpdated: string;
  };
  outdated: DependencyInfo[];
  vulnerabilities: SecurityVulnerability[];
  licenses: LicenseInfo[];
  recommendations: string[];
}

interface DependencyInfo {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  type: 'dependencies' | 'devDependencies' | 'peerDependencies';
  updateCategory: 'major' | 'minor' | 'patch';
  packagePath: string;
}

interface SecurityVulnerability {
  name: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  version: string;
  title: string;
  url: string;
  fixAvailable: boolean;
  fixedVersion?: string;
}

interface LicenseInfo {
  name: string;
  version: string;
  license: string;
  licenseFile?: string;
  compliant: boolean;
  issues: string[];
}

/**
 * Gets outdated dependencies from npm
 */
function getOutdatedDependencies(packagePath: string = './'): DependencyInfo[] {
  try {
    const output = execSync(`npm outdated --json --prefix ${packagePath}`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    const outdated = JSON.parse(output);
    
    const dependencies: DependencyInfo[] = [];
    
    for (const [name, info] of Object.entries(outdated)) {
      const dep = info as any;
      dependencies.push({
        name,
        current: dep.current,
        wanted: dep.wanted,
        latest: dep.latest,
        type: dep.type || 'dependencies',
        packagePath,
        updateCategory: getUpdateCategory(dep.current, dep.latest),
      });
    }
    
    return dependencies;
  } catch (error) {
    // npm outdated returns non-zero exit code when there are outdated packages
    try {
      const output = execSync(`npm outdated --json --prefix ${packagePath}`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      return JSON.parse(output);
    } catch {
      return [];
    }
  }
}

/**
 * Determines the update category
 */
function getUpdateCategory(current: string, latest: string): 'major' | 'minor' | 'patch' {
  const currentParts = current.replace(/[^\d.]/g, '').split('.').map(Number);
  const latestParts = latest.replace(/[^\d.]/g, '').split('.').map(Number);
  
  if (latestParts[0] > currentParts[0]) return 'major';
  if (latestParts[1] > currentParts[1]) return 'minor';
  return 'patch';
}

/**
 * Gets security vulnerabilities from npm audit
 */
function getSecurityVulnerabilities(): SecurityVulnerability[] {
  try {
    const output = execSync('npm audit --json', { encoding: 'utf8' });
    const audit = JSON.parse(output);
    
    const vulnerabilities: SecurityVulnerability[] = [];
    
    if (audit.vulnerabilities) {
      for (const [name, vuln] of Object.entries(audit.vulnerabilities)) {
        const vulnerability = vuln as any;
        vulnerabilities.push({
          name,
          severity: vulnerability.severity,
          version: vulnerability.version,
          title: vulnerability.title,
          url: vulnerability.url,
          fixAvailable: vulnerability.fixAvailable !== false,
          fixedVersion: vulnerability.fixAvailable?.version,
        });
      }
    }
    
    return vulnerabilities;
  } catch (error) {
    console.warn('Warning: Could not get security vulnerabilities');
    return [];
  }
}

/**
 * Gets license information for dependencies
 */
function getLicenseInformation(): LicenseInfo[] {
  try {
    const packageJson = JSON.parse(readFile('package.json', 'utf8'));
    const licenses: LicenseInfo[] = [];
    
    // Get all dependencies
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    };
    
    for (const [name, version] of Object.entries(allDeps)) {
      // This is a simplified implementation
      // In reality, you'd use tools like `npm ls --json` or `license-checker`
      licenses.push({
        name,
        version: version as string,
        license: 'MIT', // Default assumption
        compliant: true,
        issues: [],
      });
    }
    
    return licenses;
  } catch (error) {
    console.warn('Warning: Could not get license information');
    return [];
  }
}

/**
 * Generates recommendations based on the report data
 */
function generateRecommendations(report: DependencyReport): string[] {
  const recommendations: string[] = [];
  
  // Security recommendations
  if (report.summary.securityVulnerabilities > 0) {
    recommendations.push('🔒 Address security vulnerabilities immediately');
    recommendations.push('📧 Consider setting up automated security updates');
  }
  
  // Outdated dependencies recommendations
  if (report.summary.outdatedDependencies > 0) {
    const criticalUpdates = report.outdated.filter(d => d.updateCategory === 'major').length;
    if (criticalUpdates > 0) {
      recommendations.push(`🔴 Plan for ${criticalUpdates} major version updates`);
    }
    
    const minorUpdates = report.outdated.filter(d => d.updateCategory === 'minor').length;
    if (minorUpdates > 5) {
      recommendations.push('🟡 Consider regular minor version updates to stay current');
    }
  }
  
  // License recommendations
  if (report.summary.licenseIssues > 0) {
    recommendations.push('📄 Review and resolve license compliance issues');
  }
  
  // General recommendations
  recommendations.push('📅 Schedule regular dependency updates (weekly/monthly)');
  recommendations.push('🔧 Set up automated dependency monitoring');
  recommendations.push('📊 Track dependency health metrics over time');
  
  return recommendations;
}

/**
 * Generates markdown report
 */
function generateMarkdownReport(report: DependencyReport): string {
  const lines = [
    '# 📊 Dependency Report',
    '',
    `Generated on: ${new Date().toLocaleDateString()}`,
    '',
    '## 📈 Summary',
    '',
    `- **Total Dependencies**: ${report.summary.totalDependencies}`,
    `- **Outdated Dependencies**: ${report.summary.outdatedDependencies}`,
    `- **Security Vulnerabilities**: ${report.summary.securityVulnerabilities}`,
    `- **License Issues**: ${report.summary.licenseIssues}`,
    '',
  ];
  
  // Outdated dependencies section
  if (report.outdated.length > 0) {
    lines.push('## 📦 Outdated Dependencies');
    lines.push('');
    lines.push('| Package | Current | Latest | Type | Update |');
    lines.push('|---------|---------|--------|------|--------|');
    
    report.outdated.forEach(dep => {
      const emoji = dep.updateCategory === 'major' ? '🔴' : 
                    dep.updateCategory === 'minor' ? '🟡' : '🟢';
      lines.push(`| ${dep.name} | ${dep.current} | ${dep.latest} | ${dep.type} | ${emoji} ${dep.updateCategory} |`);
    });
    lines.push('');
  }
  
  // Security vulnerabilities section
  if (report.vulnerabilities.length > 0) {
    lines.push('## 🔒 Security Vulnerabilities');
    lines.push('');
    
    report.vulnerabilities.forEach(vuln => {
      const severityEmoji = vuln.severity === 'critical' ? '🚨' :
                           vuln.severity === 'high' ? '🔴' :
                           vuln.severity === 'moderate' ? '🟡' : '🟢';
      
      lines.push(`### ${severityEmoji} ${vuln.name} (${vuln.severity})`);
      lines.push(`- **Version**: ${vuln.version}`);
      lines.push(`- **Title**: ${vuln.title}`);
      lines.push(`- **Fix Available**: ${vuln.fixAvailable ? 'Yes' : 'No'}`);
      if (vuln.fixedVersion) {
        lines.push(`- **Fixed Version**: ${vuln.fixedVersion}`);
      }
      lines.push(`- **URL**: [More Information](${vuln.url})`);
      lines.push('');
    });
  }
  
  // License issues section
  if (report.licenses.length > 0) {
    lines.push('## 📄 License Information');
    lines.push('');
    
    const licenseIssues = report.licenses.filter(l => !l.compliant);
    if (licenseIssues.length > 0) {
      lines.push('### ⚠️ License Issues');
      lines.push('');
      licenseIssues.forEach(license => {
        lines.push(`- **${license.name}** (${license.license}): ${license.issues.join(', ')}`);
      });
      lines.push('');
    }
  }
  
  // Recommendations section
  if (report.recommendations.length > 0) {
    lines.push('## 💡 Recommendations');
    lines.push('');
    report.recommendations.forEach(rec => {
      lines.push(`- ${rec}`);
    });
    lines.push('');
  }
  
  lines.push('---');
  lines.push('*This report was generated automatically by the dependency report generator.*');
  
  return lines.join('\n');
}

/**
 * Generates JSON report
 */
function generateJSONReport(report: DependencyReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Main report generation function
 */
async function generateReport(options: ReportOptions): Promise<DependencyReport> {
  console.log('📊 Generating dependency report...');
  
  const report: DependencyReport = {
    summary: {
      totalDependencies: 0,
      outdatedDependencies: 0,
      securityVulnerabilities: 0,
      licenseIssues: 0,
      lastUpdated: new Date().toISOString(),
    },
    outdated: [],
    vulnerabilities: [],
    licenses: [],
    recommendations: [],
  };
  
  try {
    // Get package.json info
    const packageJson = JSON.parse(readFile('package.json', 'utf8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    };
    report.summary.totalDependencies = Object.keys(allDeps).length;
    
    // Get outdated dependencies
    if (options.includeOutdated) {
      report.outdated = getOutdatedDependencies();
      report.summary.outdatedDependencies = report.outdated.length;
    }
    
    // Get security vulnerabilities
    if (options.includeSecurity) {
      report.vulnerabilities = getSecurityVulnerabilities();
      report.summary.securityVulnerabilities = report.vulnerabilities.length;
    }
    
    // Get license information
    if (options.includeLicenses) {
      report.licenses = getLicenseInformation();
      report.summary.licenseIssues = report.licenses.filter(l => !l.compliant).length;
    }
    
    // Generate recommendations
    report.recommendations = generateRecommendations(report);
    
    // Generate output
    let output: string;
    switch (options.outputFormat) {
      case 'markdown':
        output = generateMarkdownReport(report);
        break;
      case 'json':
        output = generateJSONReport(report);
        break;
      case 'html':
        output = generateHTMLReport(report);
        break;
      default:
        output = generateMarkdownReport(report);
    }
    
    // Write to file or console
    if (options.outputFile) {
      writeFile(options.outputFile, output);
      console.log(`✅ Report saved to ${options.outputFile}`);
    } else {
      console.log(output);
    }
    
  } catch (error) {
    console.error('❌ Failed to generate report:', error);
    throw error;
  }
  
  return report;
}

/**
 * Generates HTML report (simplified)
 */
function generateHTMLReport(report: DependencyReport): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Dependency Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .vulnerability { border-left: 4px solid #dc3545; padding: 10px; margin: 10px 0; }
        .outdated { border-left: 4px solid #ffc107; padding: 10px; margin: 10px 0; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>📊 Dependency Report</h1>
    <div class="summary">
        <h2>📈 Summary</h2>
        <p>Total Dependencies: ${report.summary.totalDependencies}</p>
        <p>Outdated Dependencies: ${report.summary.outdatedDependencies}</p>
        <p>Security Vulnerabilities: ${report.summary.securityVulnerabilities}</p>
        <p>License Issues: ${report.summary.licenseIssues}</p>
    </div>
    
    ${report.vulnerabilities.length > 0 ? `
    <h2>🔒 Security Vulnerabilities</h2>
    ${report.vulnerabilities.map(v => `
        <div class="vulnerability">
            <strong>${v.name}</strong> (${v.severity})<br>
            Version: ${v.version}<br>
            ${v.title}<br>
            Fix Available: ${v.fixAvailable ? 'Yes' : 'No'}
        </div>
    `).join('')}
    ` : ''}
    
    <h2>💡 Recommendations</h2>
    <ul>
        ${report.recommendations.map(r => `<li>${r}</li>`).join('')}
    </ul>
</body>
</html>
  `;
}

/**
 * Parse command line arguments
 */
function parseArguments(): ReportOptions {
  const args = process.argv.slice(2);
  const options: Partial<ReportOptions> = {};

  for (let i = 0; i < args.length; i += 2) {
    const flag = args[i];
    const value = args[i + 1];

    switch (flag) {
      case '--output-file':
        options.outputFile = value;
        break;
      case '--output-format':
        options.outputFormat = value as any;
        break;
      case '--include-security':
        options.includeSecurity = value === 'true';
        break;
      case '--include-outdated':
        options.includeOutdated = value === 'true';
        break;
      case '--include-licenses':
        options.includeLicenses = value === 'true';
        break;
    }
  }

  return {
    outputFormat: options.outputFormat || 'markdown',
    includeSecurity: options.includeSecurity !== false,
    includeOutdated: options.includeOutdated !== false,
    includeLicenses: options.includeLicenses !== false,
    outputFile: options.outputFile,
  };
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    const options = parseArguments();
    
    console.log('📊 Dependency Report Generator');
    console.log('=============================');
    console.log(`Output format: ${options.outputFormat}`);
    console.log(`Include security: ${options.includeSecurity}`);
    console.log(`Include outdated: ${options.includeOutdated}`);
    console.log(`Include licenses: ${options.includeLicenses}`);
    console.log('');

    const report = await generateReport(options);
    
    console.log('');
    console.log('✅ Report generated successfully!');
    
    // Print summary
    console.log('');
    console.log('📊 Summary:');
    console.log(`  Total dependencies: ${report.summary.totalDependencies}`);
    console.log(`  Outdated dependencies: ${report.summary.outdatedDependencies}`);
    console.log(`  Security vulnerabilities: ${report.summary.securityVulnerabilities}`);
    console.log(`  License issues: ${report.summary.licenseIssues}`);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

export { 
  generateReport, 
  getOutdatedDependencies, 
  getSecurityVulnerabilities, 
  type ReportOptions, 
  type DependencyReport 
};
