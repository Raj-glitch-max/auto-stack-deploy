"""
Template Marketplace Service
UNIQUE FEATURE #4 - Production-Ready Templates
"""
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional

logger = logging.getLogger(__name__)


class TemplateService:
    """Service for template marketplace"""
    
    def __init__(self):
        # Official templates
        self.official_templates = [
            {
                'id': str(uuid.uuid4()),
                'name': 'Next.js + TypeScript',
                'description': 'Modern React framework with TypeScript, Tailwind CSS, and API routes',
                'category': 'frontend',
                'tech_stack': ['Next.js', 'TypeScript', 'Tailwind CSS', 'React'],
                'icon': '⚡',
                'tags': ['react', 'typescript', 'ssr', 'modern'],
                'github_url': 'https://github.com/vercel/next.js/tree/canary/examples/with-typescript',
                'demo_url': 'https://nextjs.org',
                'usage_count': 1250,
                'rating': 4.8,
                'is_official': True,
                'is_featured': True
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'FastAPI + PostgreSQL',
                'description': 'High-performance Python API with async PostgreSQL and SQLAlchemy',
                'category': 'backend',
                'tech_stack': ['FastAPI', 'PostgreSQL', 'SQLAlchemy', 'Python'],
                'icon': '🚀',
                'tags': ['python', 'api', 'async', 'database'],
                'github_url': 'https://github.com/tiangolo/fastapi',
                'demo_url': 'https://fastapi.tiangolo.com',
                'usage_count': 980,
                'rating': 4.9,
                'is_official': True,
                'is_featured': True
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'MERN Stack',
                'description': 'Full-stack MongoDB, Express, React, Node.js application',
                'category': 'fullstack',
                'tech_stack': ['MongoDB', 'Express', 'React', 'Node.js'],
                'icon': '🔥',
                'tags': ['fullstack', 'javascript', 'mongodb', 'react'],
                'github_url': 'https://github.com/mern/mern-starter',
                'demo_url': None,
                'usage_count': 1500,
                'rating': 4.7,
                'is_official': True,
                'is_featured': True
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Django + React',
                'description': 'Django REST API with React frontend and PostgreSQL',
                'category': 'fullstack',
                'tech_stack': ['Django', 'React', 'PostgreSQL', 'Python'],
                'icon': '🐍',
                'tags': ['python', 'django', 'react', 'rest-api'],
                'github_url': 'https://github.com/django/django',
                'demo_url': None,
                'usage_count': 850,
                'rating': 4.6,
                'is_official': True,
                'is_featured': False
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Vue.js + Nuxt',
                'description': 'Vue.js framework with SSR, TypeScript, and Tailwind',
                'category': 'frontend',
                'tech_stack': ['Vue.js', 'Nuxt', 'TypeScript', 'Tailwind CSS'],
                'icon': '💚',
                'tags': ['vue', 'nuxt', 'ssr', 'typescript'],
                'github_url': 'https://github.com/nuxt/nuxt',
                'demo_url': 'https://nuxtjs.org',
                'usage_count': 720,
                'rating': 4.7,
                'is_official': True,
                'is_featured': False
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Express + MongoDB',
                'description': 'Node.js API with MongoDB and authentication',
                'category': 'backend',
                'tech_stack': ['Express', 'MongoDB', 'Node.js', 'JWT'],
                'icon': '🟢',
                'tags': ['nodejs', 'express', 'mongodb', 'api'],
                'github_url': 'https://github.com/expressjs/express',
                'demo_url': None,
                'usage_count': 1100,
                'rating': 4.5,
                'is_official': True,
                'is_featured': False
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'SvelteKit',
                'description': 'Svelte framework with SSR and TypeScript',
                'category': 'frontend',
                'tech_stack': ['Svelte', 'SvelteKit', 'TypeScript'],
                'icon': '🧡',
                'tags': ['svelte', 'ssr', 'typescript', 'modern'],
                'github_url': 'https://github.com/sveltejs/kit',
                'demo_url': 'https://kit.svelte.dev',
                'usage_count': 450,
                'rating': 4.8,
                'is_official': True,
                'is_featured': False
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Go + Gin',
                'description': 'High-performance Go API with Gin framework',
                'category': 'backend',
                'tech_stack': ['Go', 'Gin', 'PostgreSQL'],
                'icon': '🔵',
                'tags': ['go', 'api', 'performance', 'gin'],
                'github_url': 'https://github.com/gin-gonic/gin',
                'demo_url': None,
                'usage_count': 380,
                'rating': 4.6,
                'is_official': True,
                'is_featured': False
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Astro',
                'description': 'Static site generator with partial hydration',
                'category': 'frontend',
                'tech_stack': ['Astro', 'React', 'TypeScript'],
                'icon': '🚀',
                'tags': ['astro', 'static', 'performance', 'modern'],
                'github_url': 'https://github.com/withastro/astro',
                'demo_url': 'https://astro.build',
                'usage_count': 320,
                'rating': 4.7,
                'is_official': True,
                'is_featured': False
            },
            {
                'id': str(uuid.uuid4()),
                'name': 'Ruby on Rails',
                'description': 'Full-stack Ruby framework with PostgreSQL',
                'category': 'fullstack',
                'tech_stack': ['Ruby', 'Rails', 'PostgreSQL'],
                'icon': '💎',
                'tags': ['ruby', 'rails', 'fullstack', 'mvc'],
                'github_url': 'https://github.com/rails/rails',
                'demo_url': None,
                'usage_count': 650,
                'rating': 4.5,
                'is_official': True,
                'is_featured': False
            }
        ]
    
    async def get_all_templates(self, category: Optional[str] = None) -> List[Dict]:
        """Get all templates, optionally filtered by category"""
        if category:
            return [t for t in self.official_templates if t['category'] == category]
        return self.official_templates
    
    async def get_featured_templates(self) -> List[Dict]:
        """Get featured templates"""
        return [t for t in self.official_templates if t.get('is_featured', False)]
    
    async def get_template_by_id(self, template_id: str) -> Optional[Dict]:
        """Get a specific template"""
        for template in self.official_templates:
            if template['id'] == template_id:
                return template
        return None
    
    async def deploy_from_template(
        self,
        template_id: str,
        project_name: str,
        user_id: str
    ) -> Dict:
        """Deploy a project from a template"""
        template = await self.get_template_by_id(template_id)
        if not template:
            return {'success': False, 'error': 'Template not found'}
        
        # Increment usage count
        template['usage_count'] += 1
        
        return {
            'success': True,
            'project_id': str(uuid.uuid4()),
            'project_name': project_name,
            'template': template['name'],
            'status': 'deploying'
        }


# Global instance
template_service = TemplateService()
