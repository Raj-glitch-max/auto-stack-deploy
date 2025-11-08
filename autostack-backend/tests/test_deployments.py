"""
Tests for deployment endpoints
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_deployment(client: AsyncClient, auth_headers):
    """Test creating a deployment"""
    response = await client.post(
        "/deploy",
        json={
            "repo": "https://github.com/example/repo",
            "branch": "main",
            "environment": "production"
        },
        headers=auth_headers
    )
    assert response.status_code in [200, 201]
    data = response.json()
    assert "id" in data
    assert data["repo"] == "https://github.com/example/repo"


@pytest.mark.asyncio
async def test_get_deployments(client: AsyncClient, auth_headers):
    """Test getting user deployments"""
    response = await client.get("/deployments", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert "deployments" in data
    assert isinstance(data["deployments"], list)


@pytest.mark.asyncio
async def test_get_deployment_by_id(client: AsyncClient, auth_headers):
    """Test getting specific deployment"""
    # First create a deployment
    create_response = await client.post(
        "/deploy",
        json={
            "repo": "https://github.com/example/repo",
            "branch": "main"
        },
        headers=auth_headers
    )
    deploy_id = create_response.json()["id"]
    
    # Then get it
    response = await client.get(f"/deployments/{deploy_id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == deploy_id


@pytest.mark.asyncio
async def test_deployment_unauthorized(client: AsyncClient):
    """Test deployment without authentication"""
    response = await client.post(
        "/deploy",
        json={
            "repo": "https://github.com/example/repo",
            "branch": "main"
        }
    )
    assert response.status_code == 401
