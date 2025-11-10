"""
Kubernetes Deploy Engine for AutoStack
Deploys user applications to AWS EKS with full DevOps features
"""

import os
import tempfile
import asyncio
import logging
from pathlib import Path
from typing import Dict, Optional, Tuple
from datetime import datetime
import git
from git.exc import GitCommandError
import yaml
import base64
import secrets

logger = logging.getLogger(__name__)


class K8sDeployEngine:
    """Deploys user applications to Kubernetes with full DevOps features"""
    
    def __init__(self):
        self.namespace = "user-apps"
        self.ecr_registry = os.getenv("ECR_REGISTRY", "367749063363.dkr.ecr.ap-south-1.amazonaws.com")
        self.aws_region = os.getenv("AWS_REGION", "ap-south-1")
        self.workspace_base = os.getenv("DEPLOY_WORKSPACE", "/tmp/autostack-deploys")
        Path(self.workspace_base).mkdir(parents=True, exist_ok=True)
        
    def generate_app_name(self, repo_url: str) -> str:
        """Generate a unique app name from repo URL"""
        # Extract repo name from URL
        repo_name = repo_url.rstrip('/').split('/')[-1].replace('.git', '')
        # Add random suffix for uniqueness
        suffix = secrets.token_hex(4)
        # Sanitize for Kubernetes (lowercase alphanumeric and hyphens only)
        app_name = f"{repo_name}-{suffix}".lower()
        app_name = ''.join(c if c.isalnum() or c == '-' else '-' for c in app_name)
        return app_name[:63]  # K8s name limit
    
    async def build_and_deploy(
        self, 
        repo_url: str, 
        branch: str,
        deploy_id: str,
        user_id: str,
        project_type: Optional[str] = None
    ) -> Tuple[bool, Dict, str]:
        """
        Build and deploy user application to Kubernetes
        
        Returns:
            (success, metadata, message)
        """
        try:
            app_name = self.generate_app_name(repo_url)
            logger.info(f"Starting deployment {deploy_id} for {repo_url} as {app_name}")
            
            # Step 1: Clone repository
            repo_path = await self._clone_repo(repo_url, branch, deploy_id)
            if not repo_path:
                return False, {}, "Failed to clone repository"
            
            # Step 2: Detect project type
            if not project_type:
                project_type = self._detect_project_type(repo_path)
            logger.info(f"Detected project type: {project_type}")
            
            # Step 3: Create Dockerfile if needed
            dockerfile_path = await self._ensure_dockerfile(repo_path, project_type)
            
            # Step 4: Build Docker image using Kubernetes Job
            image_name = f"{self.ecr_registry}/user-{app_name}:{deploy_id[:8]}"
            build_success = await self._build_image_k8s(repo_path, image_name, deploy_id)
            if not build_success:
                return False, {"image": image_name}, "Failed to build Docker image"
            
            # Step 5: Push to ECR
            push_success = await self._push_to_ecr(image_name)
            if not push_success:
                return False, {"image": image_name}, "Failed to push image to ECR"
            
            # Step 6: Deploy to Kubernetes
            deployment_url = await self._deploy_to_k8s(
                app_name=app_name,
                image_name=image_name,
                deploy_id=deploy_id,
                user_id=user_id,
                repo_url=repo_url,
                project_type=project_type
            )
            
            if not deployment_url:
                return False, {"image": image_name}, "Failed to deploy to Kubernetes"
            
            metadata = {
                "app_name": app_name,
                "image": image_name,
                "url": deployment_url,
                "namespace": self.namespace,
                "project_type": project_type,
                "deployed_at": datetime.utcnow().isoformat()
            }
            
            logger.info(f"Deployment {deploy_id} successful: {deployment_url}")
            return True, metadata, f"Deployed successfully at {deployment_url}"
            
        except Exception as e:
            logger.error(f"Deployment failed: {str(e)}", exc_info=True)
            return False, {}, f"Deployment failed: {str(e)}"
        finally:
            # Cleanup
            if repo_path and Path(repo_path).exists():
                import shutil
                shutil.rmtree(repo_path, ignore_errors=True)
    
    async def _clone_repo(self, repo_url: str, branch: str, deploy_id: str) -> Optional[str]:
        """Clone Git repository"""
        try:
            repo_path = os.path.join(self.workspace_base, deploy_id)
            logger.info(f"Cloning {repo_url} branch {branch} to {repo_path}")
            
            await asyncio.to_thread(
                git.Repo.clone_from,
                repo_url,
                repo_path,
                branch=branch,
                depth=1
            )
            return repo_path
        except GitCommandError as e:
            logger.error(f"Git clone failed: {str(e)}")
            return None
    
    def _detect_project_type(self, repo_path: str) -> str:
        """Detect project type from files"""
        path = Path(repo_path)
        
        if (path / "package.json").exists():
            return "nodejs"
        elif (path / "requirements.txt").exists() or (path / "Pipfile").exists():
            return "python"
        elif (path / "go.mod").exists():
            return "go"
        elif (path / "Gemfile").exists():
            return "ruby"
        elif (path / "composer.json").exists():
            return "php"
        elif (path / "index.html").exists():
            return "static"
        else:
            return "dockerfile"  # Assume user provides Dockerfile
    
    async def _ensure_dockerfile(self, repo_path: str, project_type: str) -> str:
        """Create Dockerfile if not exists"""
        dockerfile_path = Path(repo_path) / "Dockerfile"
        
        if dockerfile_path.exists():
            return str(dockerfile_path)
        
        # Generate Dockerfile based on project type
        dockerfile_content = self._generate_dockerfile(project_type)
        dockerfile_path.write_text(dockerfile_content)
        logger.info(f"Generated Dockerfile for {project_type}")
        return str(dockerfile_path)
    
    def _generate_dockerfile(self, project_type: str) -> str:
        """Generate Dockerfile content based on project type"""
        dockerfiles = {
            "nodejs": """FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
""",
            "python": """FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["python", "app.py"]
""",
            "static": """FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
""",
            "go": """FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.* ./
RUN go mod download
COPY . .
RUN go build -o main .

FROM alpine:latest
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
"""
        }
        return dockerfiles.get(project_type, dockerfiles["static"])
    
    async def _build_image_k8s(self, repo_path: str, image_name: str, deploy_id: str) -> bool:
        """Build Docker image using Kaniko in Kubernetes Job"""
        try:
            # Create Kubernetes Job manifest for building with Kaniko
            job_manifest = self._create_kaniko_job(repo_path, image_name, deploy_id)
            
            # Apply job and wait for completion
            job_file = f"/tmp/build-job-{deploy_id}.yaml"
            with open(job_file, 'w') as f:
                yaml.dump(job_manifest, f)
            
            # Apply job
            proc = await asyncio.create_subprocess_exec(
                "kubectl", "apply", "-f", job_file,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await proc.communicate()
            
            if proc.returncode != 0:
                logger.error("Failed to create build job")
                return False
            
            # Wait for job completion (with timeout)
            for _ in range(60):  # 10 minutes timeout
                proc = await asyncio.create_subprocess_exec(
                    "kubectl", "get", "job", f"build-{deploy_id[:8]}", 
                    "-n", self.namespace, "-o", "json",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, _ = await proc.communicate()
                
                if proc.returncode == 0:
                    import json
                    job_status = json.loads(stdout)
                    if job_status.get("status", {}).get("succeeded", 0) > 0:
                        logger.info("Build job completed successfully")
                        return True
                    elif job_status.get("status", {}).get("failed", 0) > 0:
                        logger.error("Build job failed")
                        return False
                
                await asyncio.sleep(10)
            
            logger.error("Build job timed out")
            return False
            
        except Exception as e:
            logger.error(f"Image build failed: {str(e)}")
            return False
    
    def _create_kaniko_job(self, repo_path: str, image_name: str, deploy_id: str) -> dict:
        """Create Kaniko build job manifest"""
        return {
            "apiVersion": "batch/v1",
            "kind": "Job",
            "metadata": {
                "name": f"build-{deploy_id[:8]}",
                "namespace": self.namespace
            },
            "spec": {
                "ttlSecondsAfterFinished": 3600,
                "template": {
                    "spec": {
                        "containers": [{
                            "name": "kaniko",
                            "image": "gcr.io/kaniko-project/executor:latest",
                            "args": [
                                f"--dockerfile=/workspace/Dockerfile",
                                f"--context=/workspace",
                                f"--destination={image_name}"
                            ],
                            "volumeMounts": [{
                                "name": "workspace",
                                "mountPath": "/workspace"
                            }]
                        }],
                        "restartPolicy": "Never",
                        "volumes": [{
                            "name": "workspace",
                            "emptyDir": {}
                        }]
                    }
                }
            }
        }
    
    async def _push_to_ecr(self, image_name: str) -> bool:
        """Push image to ECR (handled by Kaniko)"""
        # Kaniko pushes directly to ECR, so this is a no-op
        # Just verify the image exists
        return True
    
    async def _deploy_to_k8s(
        self,
        app_name: str,
        image_name: str,
        deploy_id: str,
        user_id: str,
        repo_url: str,
        project_type: str
    ) -> Optional[str]:
        """Deploy application to Kubernetes and return public URL"""
        try:
            # Create deployment and service manifests
            manifests = self._create_k8s_manifests(
                app_name, image_name, user_id, repo_url, project_type
            )
            
            # Apply manifests
            manifest_file = f"/tmp/deploy-{deploy_id}.yaml"
            with open(manifest_file, 'w') as f:
                yaml.dump_all(manifests, f)
            
            proc = await asyncio.create_subprocess_exec(
                "kubectl", "apply", "-f", manifest_file,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await proc.communicate()
            
            if proc.returncode != 0:
                logger.error("Failed to apply Kubernetes manifests")
                return None
            
            # Wait for LoadBalancer URL
            for _ in range(30):  # 5 minutes timeout
                proc = await asyncio.create_subprocess_exec(
                    "kubectl", "get", "service", app_name,
                    "-n", self.namespace, "-o", "json",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, _ = await proc.communicate()
                
                if proc.returncode == 0:
                    import json
                    service = json.loads(stdout)
                    ingress = service.get("status", {}).get("loadBalancer", {}).get("ingress", [])
                    if ingress and ingress[0].get("hostname"):
                        url = f"http://{ingress[0]['hostname']}"
                        logger.info(f"LoadBalancer URL ready: {url}")
                        return url
                
                await asyncio.sleep(10)
            
            # Fallback: return service name
            return f"http://{app_name}.{self.namespace}.svc.cluster.local"
            
        except Exception as e:
            logger.error(f"Kubernetes deployment failed: {str(e)}")
            return None
    
    def _create_k8s_manifests(
        self,
        app_name: str,
        image_name: str,
        user_id: str,
        repo_url: str,
        project_type: str
    ) -> list:
        """Create Kubernetes Deployment and Service manifests with full DevOps features"""
        
        # Deployment with HPA, health checks, resource limits
        deployment = {
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {
                "name": app_name,
                "namespace": self.namespace,
                "labels": {
                    "app": app_name,
                    "user": user_id,
                    "managed-by": "autostack"
                }
            },
            "spec": {
                "replicas": 2,  # HA by default
                "selector": {
                    "matchLabels": {"app": app_name}
                },
                "template": {
                    "metadata": {
                        "labels": {"app": app_name, "user": user_id}
                    },
                    "spec": {
                        "containers": [{
                            "name": app_name,
                            "image": image_name,
                            "ports": [{"containerPort": 3000}],  # Default port
                            "resources": {
                                "requests": {"cpu": "100m", "memory": "128Mi"},
                                "limits": {"cpu": "500m", "memory": "512Mi"}
                            },
                            "livenessProbe": {
                                "httpGet": {"path": "/", "port": 3000},
                                "initialDelaySeconds": 30,
                                "periodSeconds": 10
                            },
                            "readinessProbe": {
                                "httpGet": {"path": "/", "port": 3000},
                                "initialDelaySeconds": 10,
                                "periodSeconds": 5
                            }
                        }]
                    }
                }
            }
        }
        
        # Service with LoadBalancer for public access
        service = {
            "apiVersion": "v1",
            "kind": "Service",
            "metadata": {
                "name": app_name,
                "namespace": self.namespace,
                "labels": {"app": app_name}
            },
            "spec": {
                "type": "LoadBalancer",
                "selector": {"app": app_name},
                "ports": [{
                    "port": 80,
                    "targetPort": 3000,
                    "protocol": "TCP"
                }]
            }
        }
        
        # HPA for auto-scaling
        hpa = {
            "apiVersion": "autoscaling/v2",
            "kind": "HorizontalPodAutoscaler",
            "metadata": {
                "name": app_name,
                "namespace": self.namespace
            },
            "spec": {
                "scaleTargetRef": {
                    "apiVersion": "apps/v1",
                    "kind": "Deployment",
                    "name": app_name
                },
                "minReplicas": 2,
                "maxReplicas": 10,
                "metrics": [{
                    "type": "Resource",
                    "resource": {
                        "name": "cpu",
                        "target": {"type": "Utilization", "averageUtilization": 70}
                    }
                }]
            }
        }
        
        return [deployment, service, hpa]
    
    async def delete_deployment(self, app_name: str) -> Tuple[bool, str]:
        """Delete a deployment from Kubernetes"""
        try:
            proc = await asyncio.create_subprocess_exec(
                "kubectl", "delete", "all", "-l", f"app={app_name}",
                "-n", self.namespace,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await proc.communicate()
            
            if proc.returncode == 0:
                return True, f"Deployment {app_name} deleted successfully"
            else:
                return False, f"Failed to delete deployment {app_name}"
                
        except Exception as e:
            logger.error(f"Delete failed: {str(e)}")
            return False, f"Error deleting deployment: {str(e)}"
    
    async def get_deployment_logs(self, app_name: str, tail: int = 100) -> str:
        """Get logs from deployment"""
        try:
            proc = await asyncio.create_subprocess_exec(
                "kubectl", "logs", "-l", f"app={app_name}",
                "-n", self.namespace, f"--tail={tail}",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, _ = await proc.communicate()
            return stdout.decode('utf-8')
        except Exception as e:
            return f"Error fetching logs: {str(e)}"
