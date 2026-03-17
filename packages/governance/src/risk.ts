import { 
  RepositoryProperties, 
  RiskAssessment, 
  RiskFactor,
  AgentProperties,
  AgentRiskAssessment,
  AgentRiskFactor
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

  // ============================================================================
  // AGENT-SPECIFIC RISK ASSESSMENT METHODS
  // ============================================================================

  /**
   * Calculate agent-specific risk assessment
   */
  calculateAgentRiskScore(
    agentProperties: AgentProperties,
    baseProperties?: RepositoryProperties
  ): AgentRiskAssessment {
    // Start with base repository risk assessment if provided
    let baseAssessment: RiskAssessment | null = null
    if (baseProperties) {
      baseAssessment = this.calculateRiskScore(baseProperties)
    }

    // Calculate agent-specific risk factors
    const agentFactors = this.calculateAgentRiskFactors(agentProperties)
    
    // Calculate agent-specific risk scores
    const autonomyRiskScore = this.calculateAutonomyRisk(agentProperties)
    const humanOversightRisk = this.calculateHumanOversightRisk(agentProperties)
    const decisionImpactRisk = this.calculateDecisionImpactRisk(agentProperties)
    const biasFairnessRisk = this.calculateBiasFairnessRisk(agentProperties)

    // Combine all risk factors
    const allFactors: AgentRiskFactor[] = [
      ...agentFactors,
      ...this.createAgentSpecificRiskFactors(
        autonomyRiskScore,
        humanOversightRisk,
        decisionImpactRisk,
        biasFairnessRisk
      )
    ]

    // Calculate total agent risk score
    const agentSpecificScore = this.calculateAgentSpecificRiskScore(allFactors)
    
    // Combine with base assessment if available
    let totalScore = agentSpecificScore
    if (baseAssessment) {
      // Weight agent-specific risk higher than base repository risk
      totalScore = (agentSpecificScore * 0.7) + (baseAssessment.score * 0.3)
    }

    const category = this.getRiskCategory(totalScore)
    const overallAgentRisk = this.getAgentRiskCategory(totalScore, agentProperties)

    // Generate agent-specific recommendations
    const recommendations = this.generateAgentRecommendations(
      agentProperties,
      category,
      allFactors,
      baseAssessment
    )

    return {
      score: Math.round(totalScore * 100) / 100,
      category,
      factors: allFactors,
      recommendations,
      last_assessed: new Date().toISOString(),
      agent_specific_factors: allFactors.filter(f => 'factor_category' in f),
      autonomy_risk_score: autonomyRiskScore,
      human_oversight_risk: humanOversightRisk,
      decision_impact_risk: decisionImpactRisk,
      bias_fairness_risk: biasFairnessRisk,
      overall_agent_risk
    }
  }

  /**
   * Calculate agent-specific risk factors
   */
  private calculateAgentRiskFactors(agentProperties: AgentProperties): AgentRiskFactor[] {
    const factors: AgentRiskFactor[] = []

    // Autonomy Level Risk
    const autonomyWeight = this.getAutonomyWeight(agentProperties.autonomy_level)
    factors.push({
      factor: 'Agent Autonomy Level',
      weight: 0.25,
      value: autonomyWeight,
      contribution: autonomyWeight * 0.25,
      factor_category: 'Autonomy',
      mitigation_strategies: this.getAutonomyMitigationStrategies(agentProperties.autonomy_level),
      monitoring_required: agentProperties.autonomy_level !== 'Low',
      review_frequency: this.getReviewFrequency(agentProperties.autonomy_level)
    })

    // Decision Scope Risk
    const decisionScopeWeight = this.getDecisionScopeWeight(agentProperties.decision_scope)
    factors.push({
      factor: 'Agent Decision Scope',
      weight: 0.20,
      value: decisionScopeWeight,
      contribution: decisionScopeWeight * 0.20,
      factor_category: 'Decision_Impact',
      mitigation_strategies: this.getDecisionScopeMitigationStrategies(agentProperties.decision_scope),
      monitoring_required: agentProperties.decision_scope !== 'Internal',
      review_frequency: 'Daily'
    })

    // Data Access Risk
    const dataAccessWeight = this.getDataAccessWeight(agentProperties.data_access_level)
    factors.push({
      factor: 'Agent Data Access Level',
      weight: 0.15,
      value: dataAccessWeight,
      contribution: dataAccessWeight * 0.15,
      factor_category: 'Data_Access',
      mitigation_strategies: this.getDataAccessMitigationStrategies(agentProperties.data_access_level),
      monitoring_required: agentProperties.data_access_level !== 'Public',
      review_frequency: 'Hourly'
    })

    // Human Oversight Risk
    const oversightWeight = agentProperties.human_oversight_required ? 1.0 : 2.0
    factors.push({
      factor: 'Human Oversight Requirements',
      weight: 0.20,
      value: oversightWeight,
      contribution: oversightWeight * 0.20,
      factor_category: 'Human_Oversight',
      mitigation_strategies: this.getOversightMitigationStrategies(agentProperties.human_oversight_required),
      monitoring_required: !agentProperties.human_oversight_required,
      review_frequency: agentProperties.human_oversight_required ? 'Weekly' : 'Continuous'
    })

    // Technical Complexity Risk
    const technicalWeight = this.getTechnicalComplexityWeight(agentProperties)
    factors.push({
      factor: 'Agent Technical Complexity',
      weight: 0.10,
      value: technicalWeight,
      contribution: technicalWeight * 0.10,
      factor_category: 'Technical',
      mitigation_strategies: this.getTechnicalMitigationStrategies(agentProperties),
      monitoring_required: agentProperties.orchestration_pattern !== 'Hierarchical',
      review_frequency: 'Monthly'
    })

    // Compliance Framework Risk
    const complianceWeight = this.getComplianceFrameworkWeight(agentProperties.compliance_frameworks.length)
    factors.push({
      factor: 'Agent Compliance Requirements',
      weight: 0.10,
      value: complianceWeight,
      contribution: complianceWeight * 0.10,
      factor_category: 'Compliance',
      mitigation_strategies: this.getComplianceMitigationStrategies(agentProperties.compliance_frameworks),
      monitoring_required: agentProperties.compliance_frameworks.length > 0,
      review_frequency: 'Weekly'
    })

    return factors
  }

  /**
   * Calculate autonomy-specific risk score
   */
  private calculateAutonomyRisk(agentProperties: AgentProperties): number {
    const autonomyWeights = { 'Low': 1.0, 'Medium': 2.0, 'High': 3.0, 'Critical': 4.0 }
    let risk = autonomyWeights[agentProperties.autonomy_level]

    // Increase risk for customer-facing agents
    if (agentProperties.decision_scope === 'Customer-Facing') {
      risk *= 1.5
    }

    // Increase risk for agents without human oversight
    if (!agentProperties.human_oversight_required) {
      risk *= 2.0
    }

    // Decrease risk for agents with comprehensive monitoring
    if (agentProperties.monitoring_level === 'Comprehensive') {
      risk *= 0.8
    }

    return Math.min(risk, 4.0) // Cap at maximum risk
  }

  /**
   * Calculate human oversight risk
   */
  private calculateHumanOversightRisk(agentProperties: AgentProperties): number {
    let risk = 1.0 // Base risk

    if (!agentProperties.human_oversight_required) {
      risk = 3.0 // High risk without oversight
    }

    // Increase risk based on decision impact
    const impactWeights = { 'Low': 0.8, 'Medium': 1.0, 'High': 1.5, 'Critical': 2.0 }
    risk *= impactWeights[agentProperties.max_decision_impact]

    // Decrease risk with comprehensive audit trails
    if (agentProperties.audit_trail_required && agentProperties.audit_frequency === 'Real-time') {
      risk *= 0.7
    }

    return Math.min(risk, 4.0)
  }

  /**
   * Calculate decision impact risk
   */
  private calculateDecisionImpactRisk(agentProperties: AgentProperties): number {
    const impactWeights = { 'Low': 1.0, 'Medium': 2.0, 'High': 3.0, 'Critical': 4.0 }
    let risk = impactWeights[agentProperties.max_decision_impact]

    // Increase risk for cross-system decisions
    if (agentProperties.decision_scope === 'Cross-System') {
      risk *= 1.5
    }

    // Increase risk for autonomous agents
    if (agentProperties.autonomy_level === 'Critical') {
      risk *= 1.3
    }

    return Math.min(risk, 4.0)
  }

  /**
   * Calculate bias and fairness risk
   */
  private calculateBiasFairnessRisk(agentProperties: AgentProperties): number {
    let risk = 1.5 // Base risk for all AI agents

    // Increase risk for customer-facing agents
    if (agentProperties.decision_scope === 'Customer-Facing') {
      risk *= 1.5
    }

    // Increase risk for autonomous agents
    if (agentProperties.autonomy_level === 'High' || agentProperties.autonomy_level === 'Critical') {
      risk *= 1.3
    }

    // Decrease risk for agents with comprehensive monitoring
    if (agentProperties.monitoring_level === 'Comprehensive') {
      risk *= 0.8
    }

    // Increase risk for neural networks (more prone to bias)
    if (agentProperties.reasoning_approach === 'Neural') {
      risk *= 1.2
    }

    return Math.min(risk, 4.0)
  }

  /**
   * Create agent-specific risk factors
   */
  private createAgentSpecificRiskFactors(
    autonomyRisk: number,
    humanOversightRisk: number,
    decisionImpactRisk: number,
    biasFairnessRisk: number
  ): AgentRiskFactor[] {
    return [
      {
        factor: 'Autonomy Risk Score',
        weight: 0.3,
        value: autonomyRisk,
        contribution: autonomyRisk * 0.3,
        factor_category: 'Autonomy',
        mitigation_strategies: ['Implement bounded autonomy', 'Add human-in-the-loop checkpoints', 'Enhanced monitoring'],
        monitoring_required: true,
        review_frequency: 'Continuous'
      },
      {
        factor: 'Human Oversight Risk',
        weight: 0.25,
        value: humanOversightRisk,
        contribution: humanOversightRisk * 0.25,
        factor_category: 'Human_Oversight',
        mitigation_strategies: ['Implement oversight protocols', 'Add escalation paths', 'Enhanced audit trails'],
        monitoring_required: humanOversightRisk > 2.0,
        review_frequency: 'Daily'
      },
      {
        factor: 'Decision Impact Risk',
        weight: 0.25,
        value: decisionImpactRisk,
        contribution: decisionImpactRisk * 0.25,
        factor_category: 'Decision_Impact',
        mitigation_strategies: ['Implement decision boundaries', 'Add approval workflows', 'Risk-based controls'],
        monitoring_required: true,
        review_frequency: 'Hourly'
      },
      {
        factor: 'Bias and Fairness Risk',
        weight: 0.2,
        value: biasFairnessRisk,
        contribution: biasFairnessRisk * 0.2,
        factor_category: 'Technical',
        mitigation_strategies: ['Regular bias audits', 'Fairness metrics monitoring', 'Diverse training data'],
        monitoring_required: biasFairnessRisk > 2.0,
        review_frequency: 'Weekly'
      }
    ]
  }

  /**
   * Calculate agent-specific total risk score
   */
  private calculateAgentSpecificRiskScore(factors: AgentRiskFactor[]): number {
    return factors.reduce((sum, factor) => sum + factor.contribution, 0)
  }

  /**
   * Get agent-specific risk category
   */
  private getAgentRiskCategory(score: number, agentProperties: AgentProperties): 'Low' | 'Medium' | 'High' | 'Critical' {
    // Stricter thresholds for agents due to higher potential impact
    if (score >= 3.0) return 'Critical'
    if (score >= 2.5) return 'High'
    if (score >= 1.8) return 'Medium'
    return 'Low'
  }

  /**
   * Generate agent-specific recommendations
   */
  private generateAgentRecommendations(
    agentProperties: AgentProperties,
    category: string,
    factors: AgentRiskFactor[],
    baseAssessment: RiskAssessment | null
  ): string[] {
    const recommendations: string[] = []

    // Base recommendations by category
    switch (category) {
      case 'Critical':
        recommendations.push('Implement real-time agent monitoring and alerting')
        recommendations.push('Require human approval for all agent decisions')
        recommendations.push('Establish agent incident response team')
        recommendations.push('Implement comprehensive audit trails')
        break
      case 'High':
        recommendations.push('Implement enhanced agent monitoring')
        recommendations.push('Require human oversight for high-impact decisions')
        recommendations.push('Conduct regular agent behavior audits')
        break
      case 'Medium':
        recommendations.push('Implement basic agent monitoring')
        recommendations.push('Establish agent performance metrics')
        recommendations.push('Conduct periodic agent reviews')
        break
      case 'Low':
        recommendations.push('Maintain basic agent oversight')
        recommendations.push('Monitor agent performance metrics')
        break
    }

    // Autonomy-specific recommendations
    if (agentProperties.autonomy_level === 'Critical') {
      recommendations.push('Implement multi-layer human oversight')
      recommendations.push('Establish agent decision review board')
    }

    // Decision scope recommendations
    if (agentProperties.decision_scope === 'Customer-Facing') {
      recommendations.push('Implement customer interaction monitoring')
      recommendations.push('Establish agent communication guidelines')
    }

    if (agentProperties.decision_scope === 'Cross-System') {
      recommendations.push('Implement system integration monitoring')
      recommendations.push('Establish cross-system coordination protocols')
    }

    // Human oversight recommendations
    if (!agentProperties.human_oversight_required) {
      recommendations.push('Implement automated oversight mechanisms')
      recommendations.push('Establish agent behavior anomaly detection')
    }

    // Include base repository recommendations if available
    if (baseAssessment) {
      recommendations.push(...baseAssessment.recommendations)
    }

    return [...new Set(recommendations)] // Remove duplicates
  }

  // Helper methods for agent risk calculations

  private getAutonomyWeight(level: string): number {
    const weights = { 'Low': 1.0, 'Medium': 2.0, 'High': 3.0, 'Critical': 4.0 }
    return weights[level as keyof typeof weights] || 2.0
  }

  private getDecisionScopeWeight(scope: string): number {
    const weights = { 'Internal': 1.0, 'Customer-Facing': 2.5, 'System-Admin': 3.0, 'Cross-System': 4.0 }
    return weights[scope as keyof typeof weights] || 1.0
  }

  private getDataAccessWeight(level: string): number {
    const weights = { 'Public': 1.0, 'Internal': 2.0, 'Confidential': 3.0, 'Restricted': 4.0 }
    return weights[level as keyof typeof weights] || 1.0
  }

  private getTechnicalComplexityWeight(agentProperties: AgentProperties): number {
    let weight = 1.0

    // Increase weight based on reasoning approach
    if (agentProperties.reasoning_approach === 'Hybrid') weight += 0.5
    if (agentProperties.reasoning_approach === 'Neural') weight += 0.8

    // Increase weight based on orchestration pattern
    if (agentProperties.orchestration_pattern === 'Peer-to-Peer') weight += 0.5
    if (agentProperties.orchestration_pattern === 'Event-Driven') weight += 0.7

    // Increase weight based on memory systems
    if (agentProperties.memory_systems.length > 2) weight += 0.3

    return Math.min(weight, 4.0)
  }

  private getReviewFrequency(autonomyLevel: string): 'Continuous' | 'Hourly' | 'Daily' | 'Weekly' {
    switch (autonomyLevel) {
      case 'Critical': return 'Continuous'
      case 'High': return 'Hourly'
      case 'Medium': return 'Daily'
      case 'Low': return 'Weekly'
      default: return 'Daily'
    }
  }

  private getAutonomyMitigationStrategies(level: string): string[] {
    switch (level) {
      case 'Critical':
        return ['Multi-layer human oversight', 'Decision approval workflows', 'Real-time monitoring', 'Automated intervention']
      case 'High':
        return ['Human oversight checkpoints', 'Enhanced monitoring', 'Decision logging', 'Periodic reviews']
      case 'Medium':
        return ['Basic monitoring', 'Decision boundaries', 'Performance metrics']
      case 'Low':
        return ['Basic oversight', 'Error handling', 'Performance tracking']
      default:
        return ['Basic monitoring']
    }
  }

  private getDecisionScopeMitigationStrategies(scope: string): string[] {
    switch (scope) {
      case 'Cross-System':
        return ['System integration monitoring', 'Cross-system coordination protocols', 'Comprehensive logging']
      case 'System-Admin':
        return ['Admin action logging', 'Privilege escalation controls', 'System integrity checks']
      case 'Customer-Facing':
        return ['Customer interaction monitoring', 'Communication guidelines', 'Quality assurance']
      case 'Internal':
        return ['Internal process monitoring', 'Performance metrics', 'Error tracking']
      default:
        return ['Basic monitoring']
    }
  }

  private getDataAccessMitigationStrategies(level: string): string[] {
    switch (level) {
      case 'Restricted':
        return ['Data encryption', 'Access logging', 'Multi-factor authentication', 'Data loss prevention']
      case 'Confidential':
        return ['Data encryption', 'Access controls', 'Audit logging', 'Privacy controls']
      case 'Internal':
        return ['Access controls', 'Basic logging', 'Data classification']
      case 'Public':
        return ['Basic access controls', 'Performance monitoring']
      default:
        return ['Basic controls']
    }
  }

  private getOversightMitigationStrategies(oversightRequired: boolean): string[] {
    if (oversightRequired) {
      return ['Human review protocols', 'Escalation procedures', 'Oversight training', 'Review documentation']
    } else {
      return ['Automated oversight', 'Anomaly detection', 'Performance monitoring', 'Automated intervention']
    }
  }

  private getTechnicalMitigationStrategies(agentProperties: AgentProperties): string[] {
    const strategies = ['Regular system updates', 'Performance monitoring', 'Error handling']

    if (agentProperties.orchestration_pattern === 'Peer-to-Peer') {
      strategies.push('Peer coordination monitoring', 'Consensus mechanism validation')
    }

    if (agentProperties.reasoning_approach === 'Neural') {
      strategies.push('Model validation', 'Training data monitoring', 'Bias detection')
    }

    return strategies
  }

  private getComplianceMitigationStrategies(frameworks: string[]): string[] {
    const strategies = ['Compliance monitoring', 'Audit trail maintenance']

    if (frameworks.includes('HIPAA')) {
      strategies.push('HIPAA compliance monitoring', 'PHI protection', 'BAA management')
    }

    if (frameworks.includes('GDPR')) {
      strategies.push('GDPR compliance monitoring', 'Data subject rights management', 'Privacy controls')
    }

    if (frameworks.includes('SOC2')) {
      strategies.push('SOC2 compliance monitoring', 'Security controls validation', 'Audit readiness')
    }

    return strategies
  }
}
