import { 
  RepositoryProperties, 
  RiskAssessment, 
  RiskFactor
} from './types'

/**
 * Risk assessment engine for repository classification
 */
export class RiskAssessmentEngine {
  private readonly weights = {
    business_criticality: 0.3,
    data_classification: 0.25,
    security_classification: 0.2,
    compliance_frameworks: 0.15,
    public_facing: 0.1
  }

  private readonly businessCriticalityWeights = {
    'Low': 1.0,
    'Medium': 2.0,
    'High': 3.0,
    'Critical': 4.0
  }

  private readonly dataClassificationWeights = {
    'Public': 1.0,
    'Internal': 2.0,
    'Confidential': 3.0,
    'Restricted': 4.0
  }

  private readonly securityClassificationWeights = {
    'Standard': 1.0,
    'Elevated': 2.0,
    'High': 3.0,
    'Critical': 4.0
  }

  private readonly complianceFrameworkWeights = {
    0: 0.5, // No frameworks
    1: 1.0, // One framework
    2: 2.0, // Two frameworks
    3: 3.0, // Three frameworks
    4: 4.0  // Four or more frameworks
  }

  /**
   * Calculate risk score for repository properties
   */
  calculateRiskScore(properties: RepositoryProperties): RiskAssessment {
    const factors: RiskFactor[] = []

    // Business Criticality Factor
    const businessCriticalityValue = this.businessCriticalityWeights[properties.business_criticality]
    const businessCriticalityContribution = businessCriticalityValue * this.weights.business_criticality
    factors.push({
      factor: 'Business Criticality',
      weight: this.weights.business_criticality,
      value: businessCriticalityValue,
      contribution: businessCriticalityContribution
    })

    // Data Classification Factor
    const dataClassificationValue = this.dataClassificationWeights[properties.data_classification]
    const dataClassificationContribution = dataClassificationValue * this.weights.data_classification
    factors.push({
      factor: 'Data Classification',
      weight: this.weights.data_classification,
      value: dataClassificationValue,
      contribution: dataClassificationContribution
    })

    // Security Classification Factor
    const securityClassificationValue = this.securityClassificationWeights[properties.security_classification]
    const securityClassificationContribution = securityClassificationValue * this.weights.security_classification
    factors.push({
      factor: 'Security Classification',
      weight: this.weights.security_classification,
      value: securityClassificationValue,
      contribution: securityClassificationContribution
    })

    // Compliance Frameworks Factor
    const frameworkCount = properties.compliance_frameworks.length
    const complianceFrameworkValue = this.getComplianceFrameworkWeight(frameworkCount)
    const complianceFrameworkContribution = complianceFrameworkValue * this.weights.compliance_frameworks
    factors.push({
      factor: 'Compliance Frameworks',
      weight: this.weights.compliance_frameworks,
      value: complianceFrameworkValue,
      contribution: complianceFrameworkContribution
    })

    // Public Facing Factor
    const publicFacingValue = properties.public_facing ? 1.5 : 1.0
    const publicFacingContribution = publicFacingValue * this.weights.public_facing
    factors.push({
      factor: 'Public Facing',
      weight: this.weights.public_facing,
      value: publicFacingValue,
      contribution: publicFacingContribution
    })

    // Calculate total risk score
    const totalScore = factors.reduce((sum, factor) => sum + factor.contribution, 0)
    const category = this.getRiskCategory(totalScore)

    // Generate recommendations
    const recommendations = this.generateRecommendations(properties, category, factors)

    return {
      score: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
      category,
      factors,
      recommendations,
      last_assessed: new Date().toISOString()
    }
  }

  /**
   * Get weight for compliance frameworks count
   */
  private getComplianceFrameworkWeight(count: number): number {
    if (count >= 4) return this.complianceFrameworkWeights[4]
    return this.complianceFrameworkWeights[count as keyof typeof this.complianceFrameworkWeights]
  }

  /**
   * Get risk category from score
   */
  private getRiskCategory(score: number): 'Low' | 'Medium' | 'High' | 'Critical' {
    if (score >= 3.5) return 'Critical'
    if (score >= 2.8) return 'High'
    if (score >= 2.0) return 'Medium'
    return 'Low'
  }

  /**
   * Generate risk-based recommendations
   */
  private generateRecommendations(
    properties: RepositoryProperties,
    category: string,
    factors: RiskFactor[]
  ): string[] {
    const recommendations: string[] = []

    // Base recommendations by category
    switch (category) {
      case 'Critical':
        recommendations.push('Implement enhanced monitoring and alerting')
        recommendations.push('Conduct quarterly security reviews')
        recommendations.push('Require multiple approvers for changes')
        recommendations.push('Implement real-time threat detection')
        break
      case 'High':
        recommendations.push('Conduct monthly security reviews')
        recommendations.push('Require automated security testing')
        recommendations.push('Implement comprehensive logging')
        break
      case 'Medium':
        recommendations.push('Conduct quarterly security reviews')
        recommendations.push('Implement basic security monitoring')
        break
      case 'Low':
        recommendations.push('Conduct semi-annual security reviews')
        recommendations.push('Maintain basic security practices')
        break
    }

    // Specific recommendations based on factors
    const criticalBusinessFactor = factors.find(f => f.factor === 'Business Criticality' && f.value >= 3.0)
    if (criticalBusinessFactor) {
      recommendations.push('Establish business continuity plan')
      recommendations.push('Implement disaster recovery procedures')
    }

    const restrictedDataFactor = factors.find(f => f.factor === 'Data Classification' && f.value >= 3.0)
    if (restrictedDataFactor) {
      recommendations.push('Implement data loss prevention (DLP)')
      recommendations.push('Encrypt sensitive data at rest and in transit')
      recommendations.push('Restrict data access to authorized personnel only')
    }

    const criticalSecurityFactor = factors.find(f => f.factor === 'Security Classification' && f.value >= 3.0)
    if (criticalSecurityFactor) {
      recommendations.push('Implement multi-factor authentication')
      recommendations.push('Conduct regular penetration testing')
      recommendations.push('Establish security incident response team')
    }

    const multipleFrameworksFactor = factors.find(f => f.factor === 'Compliance Frameworks' && f.value >= 3.0)
    if (multipleFrameworksFactor) {
      recommendations.push('Establish compliance management program')
      recommendations.push('Conduct regular compliance audits')
      recommendations.push('Implement compliance monitoring tools')
    }

    const publicFacingFactor = factors.find(f => f.factor === 'Public Facing' && f.value > 1.0)
    if (publicFacingFactor) {
      recommendations.push('Implement web application firewall (WAF)')
      recommendations.push('Conduct regular security scanning')
      recommendations.push('Implement DDoS protection')
    }

    // Lifecycle-based recommendations
    if (properties.lifecycle_stage === 'Development') {
      recommendations.push('Integrate security into development lifecycle')
      recommendations.push('Conduct security training for developers')
    } else if (properties.lifecycle_stage === 'Decommissioning') {
      recommendations.push('Ensure secure data deletion procedures')
      recommendations.push('Document decommissioning process')
    }

    // Test and CI/CD recommendations
    if (!properties.automated_tests) {
      recommendations.push('Implement automated testing for security vulnerabilities')
    }

    if (!properties.ci_cd_enabled) {
      recommendations.push('Enable CI/CD pipeline for automated security checks')
    }

    return [...new Set(recommendations)] // Remove duplicates
  }

  /**
   * Calculate risk score change between assessments
   */
  calculateRiskChange(
    previousAssessment: RiskAssessment,
    currentAssessment: RiskAssessment
  ): {
    scoreChange: number
    categoryChange: string
    trend: 'improving' | 'stable' | 'degrading'
    significantFactors: string[]
  } {
    const scoreChange = currentAssessment.score - previousAssessment.score
    const categoryChange = `${previousAssessment.category} → ${currentAssessment.category}`
    
    let trend: 'improving' | 'stable' | 'degrading'
    if (Math.abs(scoreChange) < 0.1) {
      trend = 'stable'
    } else if (scoreChange < 0) {
      trend = 'improving'
    } else {
      trend = 'degrading'
    }

    // Identify factors with significant changes
    const significantFactors: string[] = []
    const threshold = 0.2

    for (const currentFactor of currentAssessment.factors) {
      const previousFactor = previousAssessment.factors.find(f => f.factor === currentFactor.factor)
      if (previousFactor) {
        const change = Math.abs(currentFactor.value - previousFactor.value)
        if (change >= threshold) {
          significantFactors.push(currentFactor.factor)
        }
      }
    }

    return {
      scoreChange: Math.round(scoreChange * 100) / 100,
      categoryChange,
      trend,
      significantFactors
    }
  }

  /**
   * Aggregate risk scores across multiple repositories
   */
  aggregateRiskScores(assessments: Record<string, RiskAssessment>): {
    totalRepositories: number
    averageScore: number
    distribution: Record<string, number>
    highRiskRepositories: string[]
    criticalRiskRepositories: string[]
    recommendations: string[]
  } {
    const repositoryNames = Object.keys(assessments)
    const totalRepositories = repositoryNames.length

    if (totalRepositories === 0) {
      return {
        totalRepositories: 0,
        averageScore: 0,
        distribution: { Low: 0, Medium: 0, High: 0, Critical: 0 },
        highRiskRepositories: [],
        criticalRiskRepositories: [],
        recommendations: []
      }
    }

    // Calculate average score
    const totalScore = repositoryNames.reduce((sum, repo) => sum + (assessments[repo]?.score || 0), 0)
    const averageScore = Math.round((totalScore / totalRepositories) * 100) / 100

    // Calculate distribution
    const distribution = { Low: 0, Medium: 0, High: 0, Critical: 0 }
    repositoryNames.forEach(repo => {
      const category = assessments[repo]?.category
      if (category) {
        distribution[category]++
      }
    })

    // Identify high and critical risk repositories
    const highRiskRepositories = repositoryNames.filter(repo => 
      assessments[repo]?.category === 'High'
    )
    const criticalRiskRepositories = repositoryNames.filter(repo => 
      assessments[repo]?.category === 'Critical'
    )

    // Generate aggregate recommendations
    const recommendations = this.generateAggregateRecommendations(distribution, averageScore)

    return {
      totalRepositories,
      averageScore,
      distribution,
      highRiskRepositories,
      criticalRiskRepositories,
      recommendations
    }
  }

  /**
   * Generate recommendations for aggregate risk assessment
   */
  private generateAggregateRecommendations(
    distribution: Record<string, number>,
    averageScore: number
  ): string[] {
    const recommendations: string[] = []

    if (averageScore >= 3.0) {
      recommendations.push('Organization risk level is high - implement enterprise-wide security program')
      recommendations.push('Conduct organization-wide risk assessment')
      recommendations.push('Establish security governance committee')
    } else if (averageScore >= 2.0) {
      recommendations.push('Organization risk level is moderate - enhance security practices')
      recommendations.push('Implement standardized security policies')
    }

    if (distribution['Critical'] > 0) {
      recommendations.push(`Address ${distribution['Critical']} critical-risk repositories immediately`)
    }

    if (distribution['High'] > distribution['Low']) {
      recommendations.push('Focus risk mitigation efforts on high-risk repositories')
    }

    const totalRepos = Object.values(distribution).reduce((sum, count) => sum + count, 0)
    const highRiskPercentage = ((distribution['High'] + distribution['Critical']) / totalRepos) * 100

    if (highRiskPercentage > 50) {
      recommendations.push('More than 50% of repositories are high-risk - review overall security strategy')
    }

    return recommendations
  }

  /**
   * Validate risk assessment configuration
   */
  validateConfiguration(): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // Check weight sum
    const weightSum = Object.values(this.weights).reduce((sum, weight) => sum + weight, 0)
    if (Math.abs(weightSum - 1.0) > 0.01) {
      errors.push(`Weights sum to ${weightSum}, should sum to 1.0`)
    }

    // Check weight ranges
    Object.entries(this.weights).forEach(([name, weight]) => {
      if (weight < 0 || weight > 1) {
        errors.push(`Weight for ${name} is ${weight}, should be between 0 and 1`)
      }
    })

    // Check for very low weights
    Object.entries(this.weights).forEach(([name, weight]) => {
      if (weight < 0.05) {
        warnings.push(`Weight for ${name} is very low (${weight}), may have minimal impact`)
      }
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }
}
