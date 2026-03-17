## Pull Request Template

### 📋 Related Issue
Closes #(issue number)
Related to #(issue number)

### 🎯 Description
<!-- Brief description of what this PR changes -->

### 🔄 Type of Change
- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🛠️ Refactor (non-breaking change that improves code maintainability)
- [ ] 🔧 Configuration change
- [ ] 🧪 Test addition/improvement
- [ ] 🎨 Style/formatting change (no code change)

### 🧪 Testing
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] I have added or updated documentation as required
- [ ] Existing tests pass locally with my changes
- [ ] I have tested this change in the following environments:
  - [ ] Local development
  - [ ] Staging (if applicable)

### 📝 Checklist
<!-- Review the list and check all that apply -->

#### Code Quality
- [ ] Code follows the project's style guidelines
- [ ] Self-review of the code completed
- [ ] Code has been formatted with `pnpm format`
- [ ] Linting passes with `pnpm lint`
- [ ] TypeScript compilation succeeds

#### Security & Compliance
- [ ] No hardcoded secrets or sensitive data
- [ ] Security implications have been considered
- [ ] Database changes (if any) follow RLS requirements
- [ ] Migration requirements met (if applicable):
  - [ ] Updated expected table count in `supabase/tests/database/00-rls-coverage.sql`
  - [ ] Added pgTAP tests for new tables
  - [ ] Generated and committed updated types

#### Documentation
- [ ] API documentation updated (if applicable)
- [ ] README.md updated (if applicable)
- [ ] CONTRIBUTING.md updated (if applicable)
- [ ] Architecture documentation updated (if applicable)

#### Testing & Quality
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed
- [ ] Performance implications considered

### 🔗 Dependencies
<!-- List any new dependencies or changes to existing dependencies -->
- [ ] No new dependencies added
- [ ] Dependencies updated with security considerations
- [ ] Package.json updated appropriately

### 📊 Impact
<!-- Describe the impact of this change -->
- **Performance**: [ ] No impact | [ ] Improved | [ ] Degraded
- **Security**: [ ] No impact | [ ] Improved | [ ] Requires review
- **User Experience**: [ ] No impact | [ ] Improved | [ ] Changed
- **Documentation**: [ ] No impact | [ ] Updated | [ ] Required

### 🚀 Deployment
- [ ] Ready for deployment
- [ ] Requires database migration
- [ ] Requires environment configuration
- [ ] Requires feature flag
- [ ] Rollback plan documented

### 📸 Screenshots (if applicable)
<!-- Add screenshots to help explain your changes -->

### 💬 Additional Notes
<!-- Any additional information that reviewers should know -->

### 👥 Reviewers
<!-- Tag specific reviewers if needed -->
@trevo

---

## How to Test
<!-- Provide clear instructions for testing this change -->

1. 
2. 
3. 

## Verification Steps
<!-- List the exact steps to verify the fix works -->

- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Rollback Plan
<!-- If this change can be rolled back, describe how -->

---

**Thank you for contributing to the Agency Platform! 🎉**
