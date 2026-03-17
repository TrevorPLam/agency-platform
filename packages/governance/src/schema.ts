/**
 * JSON Schema definitions for repository governance
 */

export const repositoryClassificationSchema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agency-platform.github.io/schemas/repository-classification.json",
  "title": "Repository Classification Schema",
  "description": "Schema for repository classification properties used in agency platform governance",
  "type": "object",
  "properties": {
    "business_criticality": {
      "type": "string",
      "enum": ["Low", "Medium", "High", "Critical"],
      "description": "Business impact level if repository is compromised or unavailable",
      "default": "Medium"
    },
    "owner_team": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "description": "Primary team responsible for repository maintenance",
      "examples": ["platform-ops", "client-services", "security-team", "product-team"]
    },
    "service_tier": {
      "type": "string",
      "enum": ["Platform", "Application", "Library", "Infrastructure"],
      "description": "Architectural classification of repository purpose",
      "default": "Application"
    },
    "client_name": {
      "type": "string",
      "pattern": "^[a-z0-9-]+$",
      "description": "Associated client for client-specific repositories",
      "examples": ["riverside-hotel", "riley-day-care", "the-barber-cave"]
    },
    "public_facing": {
      "type": "boolean",
      "description": "Whether repository hosts public-facing applications/services",
      "default": false
    },
    "compliance_frameworks": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["SOC2", "ISO27001", "HIPAA", "PCI-DSS", "GDPR", "CCPA", "NIST"]
      },
      "uniqueItems": true,
      "description": "Applicable compliance frameworks",
      "default": []
    },
    "data_classification": {
      "type": "string",
      "enum": ["Public", "Internal", "Confidential", "Restricted"],
      "description": "Highest data sensitivity level in repository",
      "default": "Internal"
    },
    "environment": {
      "type": "string",
      "enum": ["Development", "Staging", "Production", "Hybrid"],
      "description": "Primary deployment environment",
      "default": "Development"
    },
    "security_classification": {
      "type": "string",
      "enum": ["Standard", "Elevated", "High", "Critical"],
      "description": "Security requirements level",
      "default": "Standard"
    },
    "tech_stack": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "React", "Next.js", "Node.js", "TypeScript", "Python", "Docker",
          "PostgreSQL", "Supabase", "Vercel", "AWS", "Azure", "GCP",
          "Turborepo", "pnpm", "Tailwind CSS", "shadcn/ui", "Inngest"
        ]
      },
      "uniqueItems": true,
      "description": "Primary technologies used in repository",
      "default": []
    },
    "architecture_pattern": {
      "type": "string",
      "enum": ["Monolith", "Microservices", "Serverless", "Library", "Config"],
      "description": "Architectural pattern of repository",
      "default": "Library"
    },
    "dependencies": {
      "type": "string",
      "enum": ["Internal", "External", "Mixed"],
      "description": "Dependency classification",
      "default": "Mixed"
    },
    "build_system": {
      "type": "string",
      "enum": ["Turborepo", "Webpack", "Vite", "Custom"],
      "description": "Build tooling used",
      "default": "Turborepo"
    },
    "lifecycle_stage": {
      "type": "string",
      "enum": ["Development", "Maintenance", "Decommissioning", "Archived"],
      "description": "Current repository lifecycle stage",
      "default": "Development"
    },
    "last_security_review": {
      "type": "string",
      "format": "date",
      "description": "Date of last security review (ISO 8601 format)"
    },
    "review_frequency": {
      "type": "string",
      "enum": ["Monthly", "Quarterly", "Semi-annual", "Annual", "As-needed"],
      "description": "Required review cadence",
      "default": "Quarterly"
    },
    "automated_tests": {
      "type": "boolean",
      "description": "Whether automated tests are present",
      "default": true
    },
    "ci_cd_enabled": {
      "type": "boolean",
      "description": "Whether CI/CD pipeline is configured",
      "default": true
    }
  },
  "required": [
    "business_criticality",
    "owner_team",
    "service_tier",
    "public_facing",
    "compliance_frameworks",
    "data_classification",
    "environment",
    "security_classification",
    "lifecycle_stage",
    "automated_tests",
    "ci_cd_enabled"
  ],
  "additionalProperties": false
}

export const governancePolicySchema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agency-platform.github.io/schemas/governance-policy.json",
  "title": "Governance Policy Schema",
  "description": "Schema for governance policy definitions",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique policy identifier"
    },
    "name": {
      "type": "string",
      "description": "Human-readable policy name"
    },
    "description": {
      "type": "string",
      "description": "Policy description and purpose"
    },
    "target": {
      "$ref": "#/$defs/PropertyFilter"
    },
    "rules": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/GovernanceRule"
      },
      "description": "Policy rules to enforce"
    },
    "enabled": {
      "type": "boolean",
      "description": "Whether policy is currently enabled",
      "default": true
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Policy creation timestamp"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time",
      "description": "Policy last update timestamp"
    }
  },
  "required": ["id", "name", "description", "target", "rules"],
  "$defs": {
    "PropertyFilter": {
      "type": "object",
      "properties": {
        "business_criticality": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["Low", "Medium", "High", "Critical"]
          }
        },
        "compliance_frameworks": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["SOC2", "ISO27001", "HIPAA", "PCI-DSS", "GDPR", "CCPA", "NIST"]
          }
        },
        "data_classification": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["Public", "Internal", "Confidential", "Restricted"]
          }
        },
        "environment": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["Development", "Staging", "Production", "Hybrid"]
          }
        },
        "service_tier": {
          "type": "array",
          "items": {
            "type": "string",
            "enum": ["Platform", "Application", "Library", "Infrastructure"]
          }
        },
        "owner_team": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "custom_expression": {
          "type": "string",
          "description": "Custom filter expression"
        }
      },
      "additionalProperties": false
    },
    "GovernanceRule": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["requirement", "restriction", "automation"],
          "description": "Rule type"
        },
        "name": {
          "type": "string",
          "description": "Rule name"
        },
        "description": {
          "type": "string",
          "description": "Rule description"
        },
        "condition": {
          "type": "string",
          "description": "Rule condition expression"
        },
        "action": {
          "type": "string",
          "description": "Action to take when condition is met"
        },
        "enforcement": {
          "type": "string",
          "enum": ["advisory", "warning", "blocking"],
          "description": "Enforcement level"
        }
      },
      "required": ["type", "name", "description", "condition", "action", "enforcement"]
    }
  }
}

export const workflowDefinitionSchema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agency-platform.github.io/schemas/workflow-definition.json",
  "title": "Workflow Definition Schema",
  "description": "Schema for metadata-driven workflow definitions",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique workflow identifier"
    },
    "name": {
      "type": "string",
      "description": "Human-readable workflow name"
    },
    "description": {
      "type": "string",
      "description": "Workflow description and purpose"
    },
    "enabled": {
      "type": "boolean",
      "description": "Whether workflow is currently enabled",
      "default": true
    },
    "triggers": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/WorkflowTrigger"
      },
      "description": "Workflow triggers"
    },
    "actions": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/WorkflowAction"
      },
      "description": "Workflow actions"
    },
    "created_at": {
      "type": "string",
      "format": "date-time",
      "description": "Workflow creation timestamp"
    },
    "updated_at": {
      "type": "string",
      "format": "date-time",
      "description": "Workflow last update timestamp"
    }
  },
  "required": ["id", "name", "description", "triggers", "actions"],
  "$defs": {
    "WorkflowTrigger": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["property_change", "schedule", "compliance_failure", "risk_threshold", "manual"],
          "description": "Trigger type"
        },
        "condition": {
          "type": "string",
          "description": "Trigger condition"
        },
        "metadata": {
          "type": "object",
          "description": "Additional trigger metadata"
        }
      },
      "required": ["type", "condition"]
    },
    "WorkflowAction": {
      "type": "object",
      "properties": {
        "type": {
          "type": "string",
          "enum": ["set_property", "create_issue", "send_notification", "run_scan", "trigger_build", "apply_policy"],
          "description": "Action type"
        },
        "parameters": {
          "type": "object",
          "description": "Action parameters"
        },
        "delay": {
          "type": "number",
          "description": "Delay before executing action (seconds)"
        }
      },
      "required": ["type", "parameters"]
    }
  }
}

export const agentClassificationSchema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://agency-platform.github.io/schemas/agent-classification.json",
  "title": "Agent Classification Schema",
  "description": "Schema for agent classification properties used in agency platform governance",
  "type": "object",
  "properties": {
    // Agent Classification
    "agent_type": {
      "type": "string",
      "enum": ["Autonomous", "Semi-Autonomous", "Scripted", "Orchestrator"],
      "description": "Type of agent based on autonomy and decision-making capabilities",
      "default": "Semi-Autonomous"
    },
    "autonomy_level": {
      "type": "string",
      "enum": ["Low", "Medium", "High", "Critical"],
      "description": "Level of agent autonomy in decision-making",
      "default": "Medium"
    },
    "decision_scope": {
      "type": "string",
      "enum": ["Internal", "Customer-Facing", "System-Admin", "Cross-System"],
      "description": "Scope of agent decision-making authority",
      "default": "Internal"
    },
    
    // Authority & Boundaries
    "human_oversight_required": {
      "type": "boolean",
      "description": "Whether human oversight is required for agent decisions",
      "default": true
    },
    "max_decision_impact": {
      "type": "string",
      "enum": ["Low", "Medium", "High", "Critical"],
      "description": "Maximum impact level of agent decisions",
      "default": "Medium"
    },
    
    // Technical Properties
    "model_framework": {
      "type": "string",
      "description": "AI model framework used by the agent",
      "examples": ["OpenAI GPT-4", "Claude", "Custom LLM", "Rule-Based Engine"]
    },
    "reasoning_approach": {
      "type": "string",
      "enum": ["Symbolic", "Neural", "Hybrid", "Rule-Based"],
      "description": "Primary reasoning approach used by the agent",
      "default": "Hybrid"
    },
    "orchestration_pattern": {
      "type": "string",
      "enum": ["Hierarchical", "Peer-to-Peer", "Event-Driven"],
      "description": "Orchestration pattern for multi-agent coordination",
      "default": "Hierarchical"
    },
    
    // Operational Properties
    "lifecycle_stage": {
      "type": "string",
      "enum": ["Development", "Testing", "Validation", "Pilot", "Production", "Maintenance", "Decommissioning"],
      "description": "Current stage in agent lifecycle",
      "default": "Development"
    },
    "deployment_environment": {
      "type": "string",
      "enum": ["Development", "Staging", "Production", "Hybrid"],
      "description": "Deployment environment for the agent",
      "default": "Development"
    },
    "monitoring_level": {
      "type": "string",
      "enum": ["Basic", "Enhanced", "Comprehensive"],
      "description": "Level of monitoring and observability for the agent",
      "default": "Enhanced"
    },
    "audit_frequency": {
      "type": "string",
      "enum": ["Real-time", "Hourly", "Daily", "Weekly"],
      "description": "Frequency of agent audit trail generation",
      "default": "Daily"
    },
    
    // Compliance & Security
    "compliance_frameworks": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["SOC2", "ISO27001", "HIPAA", "PCI-DSS", "GDPR", "CCPA", "NIST"]
      },
      "uniqueItems": true,
      "description": "Applicable compliance frameworks for the agent",
      "default": []
    },
    "data_access_level": {
      "type": "string",
      "enum": ["Public", "Internal", "Confidential", "Restricted"],
      "description": "Maximum data access level for the agent",
      "default": "Internal"
    },
    "security_classification": {
      "type": "string",
      "enum": ["Standard", "Elevated", "High", "Critical"],
      "description": "Security classification level for the agent",
      "default": "Standard"
    },
    "audit_trail_required": {
      "type": "boolean",
      "description": "Whether comprehensive audit trail is required for the agent",
      "default": true
    }
  },
  "required": [
    "agent_type",
    "autonomy_level",
    "decision_scope",
    "human_oversight_required",
    "max_decision_impact",
    "lifecycle_stage",
    "deployment_environment",
    "monitoring_level",
    "audit_frequency",
    "data_access_level",
    "security_classification",
    "audit_trail_required"
  ]
}
