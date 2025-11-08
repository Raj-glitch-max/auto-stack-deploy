"""
Deploy Engine for AutoStack
Handles GitHub repo cloning, Docker building, and container deployment
"""

import os
import shutil
import asyncio
import tempfile
from pathlib import Path
from typing import Dict, Optional, Tuple
import docker
from docker.errors import DockerException, BuildError, APIError
import git
from git.exc import GitCommandError
import logging

logger = logging.getLogger(__name__)


class DeployEngine:
    """Handles deployment of applications from GitHub to Docker"""
    
    def __init__(self):
        try:
            self.docker_client = docker.from_env()
            logger.info("Docker client initialized successfully")
        except DockerException as e:
            logger.error(f"Failed to initialize Docker client: {e}")
            raise
        
        self.workspace_base = os.getenv("DEPLOY_WORKSPACE", "/tmp/autostack-deploys")
        self.base_port = int(os.getenv("DEPLOY_BASE_PORT", "10000"))
        self.max_port = int(os.getenv("DEPLOY_MAX_PORT", "20000"))
        
        # Create workspace directory
        Path(self.workspace_base).mkdir(parents=True, exist_ok=True)
    
    def detect_project_type(self, repo_path: str) -> Optional[str]:
        """
        Detect project type based on files in repository
        
        Returns:
            Project type: 'nodejs', 'python', 'go', 'static', or None
        """
        repo_path_obj = Path(repo_path)
        
        # Check for Node.js
        if (repo_path_obj / "package.json").exists():
            return "nodejs"
        
        # Check for Python
        if (repo_path_obj / "requirements.txt").exists() or \
           (repo_path_obj / "Pipfile").exists() or \
           (repo_path_obj / "pyproject.toml").exists():
            return "python"
        
        # Check for Go
        if (repo_path_obj / "go.mod").exists():
            return "go"
        
        # Check for static site
        if (repo_path_obj / "index.html").exists():
            return "static"
        
        logger.warning(f"Could not detect project type for {repo_path}")
        return None
    
    def generate_dockerfile(self, project_type: str, repo_path: str) -> str:
        """
        Generate Dockerfile based on project type
        
        Args:
            project_type: Type of project (nodejs, python, go, static)
            repo_path: Path to repository
            
        Returns:
            Dockerfile content as string
        """
        dockerfiles = {
            "nodejs": """FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
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
""",
            "static": """FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
"""
        }
        
        return dockerfiles.get(project_type, dockerfiles["static"])
    
    async def clone_repository(self, repo_url: str, branch: str = "main") -> Tuple[bool, str, str]:
        """
        Clone GitHub repository
        
        Args:
            repo_url: GitHub repository URL
            branch: Branch to clone (default: main)
            
        Returns:
            Tuple of (success, repo_path, error_message)
        """
        try:
            # Create unique directory for this deployment
            repo_dir = tempfile.mkdtemp(dir=self.workspace_base)
            
            logger.info(f"Cloning {repo_url} (branch: {branch}) to {repo_dir}")
            
            # Clone repository
            git.Repo.clone_from(
                repo_url,
                repo_dir,
                branch=branch,
                depth=1  # Shallow clone for speed
            )
            
            logger.info(f"Successfully cloned repository to {repo_dir}")
            return True, repo_dir, ""
            
        except GitCommandError as e:
            error_msg = f"Git clone failed: {str(e)}"
            logger.error(error_msg)
            return False, "", error_msg
        except Exception as e:
            error_msg = f"Unexpected error during clone: {str(e)}"
            logger.error(error_msg)
            return False, "", error_msg
    
    def find_available_port(self) -> Optional[int]:
        """Find an available port in the configured range"""
        import socket
        
        for port in range(self.base_port, self.max_port):
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                try:
                    s.bind(('', port))
                    return port
                except OSError:
                    continue
        
        logger.error("No available ports in range")
        return None
    
    async def build_and_deploy(
        self,
        repo_path: str,
        deploy_id: str,
        project_type: Optional[str] = None
    ) -> Tuple[bool, Dict, str]:
        """
        Build Docker image and run container
        
        Args:
            repo_path: Path to cloned repository
            deploy_id: Unique deployment ID
            project_type: Optional project type (will auto-detect if None)
            
        Returns:
            Tuple of (success, deployment_info, error_message)
        """
        try:
            # Detect project type if not provided
            if not project_type:
                project_type = self.detect_project_type(repo_path)
                if not project_type:
                    return False, {}, "Could not detect project type"
            
            logger.info(f"Building {project_type} project for deploy {deploy_id}")
            
            # Check if Dockerfile exists, if not create one
            dockerfile_path = Path(repo_path) / "Dockerfile"
            if not dockerfile_path.exists():
                logger.info("No Dockerfile found, generating one")
                dockerfile_content = self.generate_dockerfile(project_type, repo_path)
                dockerfile_path.write_text(dockerfile_content)
            
            # Build Docker image
            image_tag = f"autostack-deploy-{deploy_id}"
            logger.info(f"Building Docker image: {image_tag}")
            
            image, build_logs = self.docker_client.images.build(
                path=repo_path,
                tag=image_tag,
                rm=True,
                forcerm=True
            )
            
            # Log build output
            for log in build_logs:
                if 'stream' in log:
                    logger.debug(log['stream'].strip())
            
            # Find available port
            port = self.find_available_port()
            if not port:
                return False, {}, "No available ports"
            
            # Run container
            container_name = f"deploy-{deploy_id}"
            logger.info(f"Starting container {container_name} on port {port}")
            
            # Determine internal port based on project type
            internal_ports = {
                "nodejs": 3000,
                "python": 8000,
                "go": 8080,
                "static": 80
            }
            internal_port = internal_ports.get(project_type, 8000)
            
            container = self.docker_client.containers.run(
                image=image.id,
                name=container_name,
                ports={f'{internal_port}/tcp': port},
                detach=True,
                restart_policy={"Name": "unless-stopped"}
            )
            
            deployment_info = {
                "container_id": container.id,
                "container_name": container_name,
                "image_id": image.id,
                "image_tag": image_tag,
                "port": port,
                "internal_port": internal_port,
                "url": f"http://localhost:{port}",
                "project_type": project_type,
                "status": "running"
            }
            
            logger.info(f"Deployment successful: {deployment_info}")
            return True, deployment_info, ""
            
        except BuildError as e:
            error_msg = f"Docker build failed: {str(e)}"
            logger.error(error_msg)
            return False, {}, error_msg
        except APIError as e:
            error_msg = f"Docker API error: {str(e)}"
            logger.error(error_msg)
            return False, {}, error_msg
        except Exception as e:
            error_msg = f"Deployment failed: {str(e)}"
            logger.error(error_msg)
            return False, {}, error_msg
    
    async def stop_deployment(self, container_id: str) -> Tuple[bool, str]:
        """Stop and remove a deployment container"""
        try:
            container = self.docker_client.containers.get(container_id)
            container.stop(timeout=10)
            container.remove()
            logger.info(f"Stopped and removed container {container_id}")
            return True, ""
        except Exception as e:
            error_msg = f"Failed to stop container: {str(e)}"
            logger.error(error_msg)
            return False, error_msg
    
    async def get_container_logs(self, container_id: str, tail: int = 100) -> str:
        """Get logs from a container"""
        try:
            container = self.docker_client.containers.get(container_id)
            logs = container.logs(tail=tail, timestamps=True)
            return logs.decode('utf-8')
        except Exception as e:
            logger.error(f"Failed to get logs: {e}")
            return f"Error getting logs: {str(e)}"
    
    def cleanup_workspace(self, repo_path: str):
        """Clean up cloned repository"""
        try:
            if os.path.exists(repo_path):
                shutil.rmtree(repo_path)
                logger.info(f"Cleaned up workspace: {repo_path}")
        except Exception as e:
            logger.error(f"Failed to cleanup workspace: {e}")
    
    async def deploy_from_github(
        self,
        repo_url: str,
        branch: str,
        deploy_id: str
    ) -> Tuple[bool, Dict, str]:
        """
        Complete deployment flow: clone, build, and deploy
        
        Args:
            repo_url: GitHub repository URL
            branch: Branch to deploy
            deploy_id: Unique deployment ID
            
        Returns:
            Tuple of (success, deployment_info, error_message)
        """
        repo_path = ""
        
        try:
            # Step 1: Clone repository
            success, repo_path, error = await self.clone_repository(repo_url, branch)
            if not success:
                return False, {}, error
            
            # Step 2: Build and deploy
            success, deploy_info, error = await self.build_and_deploy(repo_path, deploy_id)
            
            # Step 3: Cleanup (always run)
            self.cleanup_workspace(repo_path)
            
            return success, deploy_info, error
            
        except Exception as e:
            error_msg = f"Deployment flow failed: {str(e)}"
            logger.error(error_msg)
            
            # Cleanup on error
            if repo_path:
                self.cleanup_workspace(repo_path)
            
            return False, {}, error_msg
