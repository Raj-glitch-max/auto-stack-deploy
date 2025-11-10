# Setup Jenkins CI/CD for AutoStack
# This script helps configure Jenkins for automated deployments

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Jenkins CI/CD Setup for AutoStack" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$JENKINS_URL = "http://65.2.39.10:8080"

Write-Host "📋 Pre-requisites Checklist:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  [1] Jenkins is running at $JENKINS_URL" -ForegroundColor White
Write-Host "  [2] You have Jenkins admin credentials" -ForegroundColor White
Write-Host "  [3] You have AWS Access Key & Secret" -ForegroundColor White
Write-Host "  [4] You have GitHub Personal Access Token" -ForegroundColor White
Write-Host ""

$continue = Read-Host "Have you completed all pre-requisites? (y/n)"
if ($continue -ne "y") {
    Write-Host "Please complete pre-requisites first" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 1: Install Required Jenkins Plugins" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Please install these plugins manually:" -ForegroundColor Yellow
Write-Host "  1. Go to: $JENKINS_URL/pluginManager/available" -ForegroundColor White
Write-Host "  2. Search and install:" -ForegroundColor White
Write-Host "     - Docker Pipeline" -ForegroundColor Gray
Write-Host "     - Git Plugin" -ForegroundColor Gray
Write-Host "     - GitHub Plugin" -ForegroundColor Gray
Write-Host "     - AWS Steps" -ForegroundColor Gray
Write-Host "     - Kubernetes CLI" -ForegroundColor Gray
Write-Host "     - Pipeline: Stage View" -ForegroundColor Gray
Write-Host "     - Credentials Binding" -ForegroundColor Gray
Write-Host "  3. Click 'Install without restart'" -ForegroundColor White
Write-Host ""

$pluginsInstalled = Read-Host "Plugins installed? (y/n)"
if ($pluginsInstalled -ne "y") {
    Write-Host "Please install plugins first" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 2: Add AWS Credentials" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Please add AWS credentials manually:" -ForegroundColor Yellow
Write-Host "  1. Go to: $JENKINS_URL/credentials/store/system/domain/_/newCredentials" -ForegroundColor White
Write-Host "  2. Kind: AWS Credentials" -ForegroundColor White
Write-Host "  3. ID: aws-credentials" -ForegroundColor White
Write-Host "  4. Description: AWS credentials for ECR and EKS" -ForegroundColor White
Write-Host "  5. Enter your AWS Access Key ID" -ForegroundColor White
Write-Host "  6. Enter your AWS Secret Access Key" -ForegroundColor White
Write-Host "  7. Click 'Create'" -ForegroundColor White
Write-Host ""

$awsCreds = Read-Host "AWS credentials added? (y/n)"
if ($awsCreds -ne "y") {
    Write-Host "Please add AWS credentials first" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 3: Add GitHub Token" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Please add GitHub token manually:" -ForegroundColor Yellow
Write-Host "  1. Go to: $JENKINS_URL/credentials/store/system/domain/_/newCredentials" -ForegroundColor White
Write-Host "  2. Kind: Secret text" -ForegroundColor White
Write-Host "  3. ID: github-token" -ForegroundColor White
Write-Host "  4. Secret: <Your GitHub Personal Access Token>" -ForegroundColor White
Write-Host "  5. Description: GitHub token for repo access" -ForegroundColor White
Write-Host "  6. Click 'Create'" -ForegroundColor White
Write-Host ""
Write-Host "  Create GitHub token at: https://github.com/settings/tokens" -ForegroundColor Gray
Write-Host "  Required scopes: repo, workflow, write:packages" -ForegroundColor Gray
Write-Host ""

$githubToken = Read-Host "GitHub token added? (y/n)"
if ($githubToken -ne "y") {
    Write-Host "Please add GitHub token first" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 4: Create Jenkins Jobs" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Creating Jenkins job configurations..." -ForegroundColor Yellow
Write-Host ""

# Create job config XMLs
$backendJobXml = @"
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job@2.40">
  <description>AutoStack Backend CI/CD Pipeline</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <org.jenkinsci.plugins.workflow.job.properties.PipelineTriggersJobProperty>
      <triggers>
        <com.cloudbees.jenkins.GitHubPushTrigger plugin="github@1.34.1">
          <spec></spec>
        </com.cloudbees.jenkins.GitHubPushTrigger>
      </triggers>
    </org.jenkinsci.plugins.workflow.job.properties.PipelineTriggersJobProperty>
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps@2.87">
    <scm class="hudson.plugins.git.GitSCM" plugin="git@4.7.1">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>https://github.com/Raj-glitch-max/auto-stack-deploy.git</url>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches>
        <hudson.plugins.git.BranchSpec>
          <name>*/main</name>
        </hudson.plugins.git.BranchSpec>
      </branches>
      <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
      <submoduleCfg class="list"/>
      <extensions/>
    </scm>
    <scriptPath>Jenkinsfile.backend</scriptPath>
    <lightweight>true</lightweight>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>
"@

$frontendJobXml = @"
<?xml version='1.1' encoding='UTF-8'?>
<flow-definition plugin="workflow-job@2.40">
  <description>AutoStack Frontend CI/CD Pipeline</description>
  <keepDependencies>false</keepDependencies>
  <properties>
    <org.jenkinsci.plugins.workflow.job.properties.PipelineTriggersJobProperty>
      <triggers>
        <com.cloudbees.jenkins.GitHubPushTrigger plugin="github@1.34.1">
          <spec></spec>
        </com.cloudbees.jenkins.GitHubPushTrigger>
      </triggers>
    </org.jenkinsci.plugins.workflow.job.properties.PipelineTriggersJobProperty>
  </properties>
  <definition class="org.jenkinsci.plugins.workflow.cps.CpsScmFlowDefinition" plugin="workflow-cps@2.87">
    <scm class="hudson.plugins.git.GitSCM" plugin="git@4.7.1">
      <configVersion>2</configVersion>
      <userRemoteConfigs>
        <hudson.plugins.git.UserRemoteConfig>
          <url>https://github.com/Raj-glitch-max/auto-stack-deploy.git</url>
        </hudson.plugins.git.UserRemoteConfig>
      </userRemoteConfigs>
      <branches>
        <hudson.plugins.git.BranchSpec>
          <name>*/main</name>
        </hudson.plugins.git.BranchSpec>
      </branches>
      <doGenerateSubmoduleConfigurations>false</doGenerateSubmoduleConfigurations>
      <submoduleCfg class="list"/>
      <extensions/>
    </scm>
    <scriptPath>Jenkinsfile.frontend</scriptPath>
    <lightweight>true</lightweight>
  </definition>
  <triggers/>
  <disabled>false</disabled>
</flow-definition>
"@

$backendJobXml | Out-File -FilePath "jenkins-job-backend.xml" -Encoding UTF8
$frontendJobXml | Out-File -FilePath "jenkins-job-frontend.xml" -Encoding UTF8

Write-Host "[OK] Job configuration files created" -ForegroundColor Green
Write-Host ""

Write-Host "Please create Jenkins jobs manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend Job:" -ForegroundColor White
Write-Host "  1. Go to: $JENKINS_URL/view/all/newJob" -ForegroundColor White
Write-Host "  2. Name: autostack-backend-deploy" -ForegroundColor White
Write-Host "  3. Type: Pipeline" -ForegroundColor White
Write-Host "  4. Click OK" -ForegroundColor White
Write-Host "  5. Under 'Pipeline':" -ForegroundColor White
Write-Host "     - Definition: Pipeline script from SCM" -ForegroundColor Gray
Write-Host "     - SCM: Git" -ForegroundColor Gray
Write-Host "     - Repository URL: https://github.com/Raj-glitch-max/auto-stack-deploy.git" -ForegroundColor Gray
Write-Host "     - Branch: */main" -ForegroundColor Gray
Write-Host "     - Script Path: Jenkinsfile.backend" -ForegroundColor Gray
Write-Host "  6. Under 'Build Triggers':" -ForegroundColor White
Write-Host "     - ✓ GitHub hook trigger for GITScm polling" -ForegroundColor Gray
Write-Host "  7. Click Save" -ForegroundColor White
Write-Host ""

$backendJob = Read-Host "Backend job created? (y/n)"

Write-Host ""
Write-Host "Frontend Job:" -ForegroundColor White
Write-Host "  Repeat above steps with:" -ForegroundColor White
Write-Host "     - Name: autostack-frontend-deploy" -ForegroundColor White
Write-Host "     - Script Path: Jenkinsfile.frontend" -ForegroundColor Gray
Write-Host ""

$frontendJob = Read-Host "Frontend job created? (y/n)"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 5: Configure GitHub Webhook" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Please configure GitHub webhook:" -ForegroundColor Yellow
Write-Host "  1. Go to: https://github.com/Raj-glitch-max/auto-stack-deploy/settings/hooks" -ForegroundColor White
Write-Host "  2. Click 'Add webhook'" -ForegroundColor White
Write-Host "  3. Payload URL: $JENKINS_URL/github-webhook/" -ForegroundColor White
Write-Host "  4. Content type: application/json" -ForegroundColor White
Write-Host "  5. Events: Just the push event" -ForegroundColor White
Write-Host "  6. Active: ✓" -ForegroundColor White
Write-Host "  7. Click 'Add webhook'" -ForegroundColor White
Write-Host ""

$webhook = Read-Host "Webhook configured? (y/n)"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Step 6: Test the Pipeline" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Let's test the CI/CD pipeline!" -ForegroundColor Yellow
Write-Host ""

$test = Read-Host "Trigger a test build? (y/n)"
if ($test -eq "y") {
    Write-Host ""
    Write-Host "Creating a test commit..." -ForegroundColor Yellow
    
    $testContent = @"
// CI/CD Test - $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
// This commit triggers the Jenkins pipeline
"@
    
    $testContent | Out-File -FilePath "CI-CD-TEST.md" -Encoding UTF8
    
    git add .
    git commit -m "test: trigger CI/CD pipeline - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    git push origin main
    
    Write-Host ""
    Write-Host "[OK] Test commit pushed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Watch the builds at:" -ForegroundColor Cyan
    Write-Host "  Backend:  $JENKINS_URL/job/autostack-backend-deploy/" -ForegroundColor White
    Write-Host "  Frontend: $JENKINS_URL/job/autostack-frontend-deploy/" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "🎉 Jenkins CI/CD Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "✅ Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Monitor first build:" -ForegroundColor White
Write-Host "   $JENKINS_URL" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Verify ArgoCD auto-sync:" -ForegroundColor White
Write-Host "   kubectl get applications -n argocd" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Check deployed pods:" -ForegroundColor White
Write-Host "   kubectl get pods -n default" -ForegroundColor Gray
Write-Host ""
Write-Host "4. From now on, every git push will:" -ForegroundColor White
Write-Host "   → Build Docker image" -ForegroundColor Gray
Write-Host "   → Push to ECR" -ForegroundColor Gray
Write-Host "   → Update GitOps repo" -ForegroundColor Gray
Write-Host "   → ArgoCD auto-syncs" -ForegroundColor Gray
Write-Host "   → Zero-downtime deploy to EKS!" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 You now have full CI/CD automation!" -ForegroundColor Green
Write-Host ""
Write-Host "Test it by editing any code file and pushing to GitHub!" -ForegroundColor Yellow
