// ============================================
// AutoStack - Jenkins CI/CD Pipeline
// ============================================

pipeline {
    agent any
    
    parameters {
        choice(name: 'TARGET', choices: ['both', 'frontend', 'backend'], description: 'What to deploy')
        string(name: 'BRANCH', defaultValue: 'main', description: 'Git branch to build')
        string(name: 'REPO', defaultValue: 'autostack', description: 'Repository name')
    }
    
    environment {
        AWS_REGION = 'us-east-1'
        ECR_REGISTRY = "${env.AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
        ECR_FRONTEND = "${ECR_REGISTRY}/autostack-frontend"
        ECR_BACKEND = "${ECR_REGISTRY}/autostack-backend"
        GIT_COMMIT_SHORT = sh(returnStdout: true, script: 'git rev-parse --short HEAD').trim()
        IMAGE_TAG = "${env.BUILD_NUMBER}-${GIT_COMMIT_SHORT}"
        GITOPS_REPO = 'autostack' // Same repo, different path
        DOCKER_BUILDKIT = '1'
    }
    
    stages {
        stage('Checkout') {
            steps {
                script {
                    echo "🔍 Checking out ${params.REPO}:${params.BRANCH}"
                    checkout scm
                }
            }
        }
        
        stage('Set Version') {
            steps {
                script {
                    echo "📌 Version: ${IMAGE_TAG}"
                    echo "🎯 Target: ${params.TARGET}"
                }
            }
        }
        
        stage('ECR Login') {
            steps {
                script {
                    echo "🔐 Logging into ECR..."
                    sh '''
                        aws ecr get-login-password --region ${AWS_REGION} | \
                        docker login --username AWS --password-stdin ${ECR_REGISTRY}
                    '''
                }
            }
        }
        
        stage('Build & Push Frontend') {
            when {
                expression { params.TARGET == 'frontend' || params.TARGET == 'both' }
            }
            steps {
                script {
                    echo "🏗️  Building frontend..."
                    dir('autostack-frontend') {
                        sh """
                            docker build \
                                --build-arg BUILDKIT_INLINE_CACHE=1 \
                                --cache-from ${ECR_FRONTEND}:latest \
                                -t ${ECR_FRONTEND}:${IMAGE_TAG} \
                                -t ${ECR_FRONTEND}:latest \
                                .
                            
                            docker push ${ECR_FRONTEND}:${IMAGE_TAG}
                            docker push ${ECR_FRONTEND}:latest
                        """
                    }
                    echo "✅ Frontend pushed: ${ECR_FRONTEND}:${IMAGE_TAG}"
                }
            }
        }
        
        stage('Build & Push Backend') {
            when {
                expression { params.TARGET == 'backend' || params.TARGET == 'both' }
            }
            steps {
                script {
                    echo "🏗️  Building backend..."
                    dir('autostack-backend') {
                        sh """
                            docker build \
                                --build-arg BUILDKIT_INLINE_CACHE=1 \
                                --cache-from ${ECR_BACKEND}:latest \
                                -f backend/Dockerfile \
                                -t ${ECR_BACKEND}:${IMAGE_TAG} \
                                -t ${ECR_BACKEND}:latest \
                                .
                            
                            docker push ${ECR_BACKEND}:${IMAGE_TAG}
                            docker push ${ECR_BACKEND}:latest
                        """
                    }
                    echo "✅ Backend pushed: ${ECR_BACKEND}:${IMAGE_TAG}"
                }
            }
        }
        
        stage('Update GitOps Repo') {
            steps {
                script {
                    echo "📝 Updating Helm values..."
                    
                    withCredentials([usernamePassword(credentialsId: 'github-token', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                        sh """
                            git config user.email "jenkins@autostack.io"
                            git config user.name "Jenkins CI"
                            
                            # Update frontend values if needed
                            if [ "${params.TARGET}" = "frontend" ] || [ "${params.TARGET}" = "both" ]; then
                                sed -i 's|tag:.*|tag: "${IMAGE_TAG}"|' infra/helm/autostack-frontend/values.yaml
                            fi
                            
                            # Update backend values if needed
                            if [ "${params.TARGET}" = "backend" ] || [ "${params.TARGET}" = "both" ]; then
                                sed -i 's|tag:.*|tag: "${IMAGE_TAG}"|' infra/helm/autostack-backend/values.yaml
                            fi
                            
                            # Commit and push
                            git add infra/helm/*/values.yaml
                            git commit -m "chore: update image tags to ${IMAGE_TAG} [skip ci]" || true
                            git push https://${GIT_TOKEN}@github.com/${GIT_USER}/${GITOPS_REPO}.git HEAD:${params.BRANCH}
                        """
                    }
                    echo "✅ GitOps repo updated"
                }
            }
        }
        
        stage('Trigger ArgoCD Sync') {
            steps {
                script {
                    echo "🔄 Triggering ArgoCD sync..."
                    
                    // Optional: Trigger ArgoCD sync via API
                    sh '''
                        # ArgoCD will auto-sync, but we can force it
                        # Requires ArgoCD CLI or API token
                        echo "ArgoCD auto-sync enabled - waiting for sync..."
                    '''
                }
            }
        }
        
        stage('Wait for Rollout') {
            steps {
                script {
                    echo "⏳ Waiting for rollout to complete..."
                    
                    sh '''
                        # Configure kubectl
                        aws eks update-kubeconfig --region ${AWS_REGION} --name autostack-dev-eks
                        
                        # Wait for deployments
                        if [ "${TARGET}" = "frontend" ] || [ "${TARGET}" = "both" ]; then
                            kubectl rollout status deployment/autostack-frontend -n autostack --timeout=5m
                        fi
                        
                        if [ "${TARGET}" = "backend" ] || [ "${TARGET}" = "both" ]; then
                            kubectl rollout status deployment/autostack-backend -n autostack --timeout=5m
                        fi
                    '''
                    echo "✅ Rollout completed successfully"
                }
            }
        }
        
        stage('Smoke Tests') {
            steps {
                script {
                    echo "🧪 Running smoke tests..."
                    
                    sh '''
                        # Get ALB DNS
                        ALB_DNS=$(kubectl get ingress autostack-ingress -n autostack -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
                        
                        # Test backend health
                        if [ "${TARGET}" = "backend" ] || [ "${TARGET}" = "both" ]; then
                            echo "Testing backend health..."
                            curl -f http://${ALB_DNS}/api/health || exit 1
                        fi
                        
                        # Test frontend
                        if [ "${TARGET}" = "frontend" ] || [ "${TARGET}" = "both" ]; then
                            echo "Testing frontend..."
                            curl -f http://${ALB_DNS}/ || exit 1
                        fi
                    '''
                    echo "✅ Smoke tests passed"
                }
            }
        }
    }
    
    post {
        success {
            echo "🎉 Pipeline completed successfully!"
            echo "🌐 Frontend: http://\${ALB_DNS}"
            echo "🌐 Backend: http://\${ALB_DNS}/api"
        }
        failure {
            echo "❌ Pipeline failed!"
        }
        always {
            cleanWs()
        }
    }
}
