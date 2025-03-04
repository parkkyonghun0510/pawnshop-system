from fastapi.testclient import TestClient
from app.models.users import User, Role
from app.seed import get_password_hash
import datetime

def test_login_success(client, db_session):
    # Create test data
    now = datetime.datetime.now()
    
    # Create role
    role = Role(
        name="admin",
        description="Administrator",
        created_at=now,
        updated_at=now
    )
    db_session.add(role)
    db_session.commit()
    
    # Create user
    user = User(
        username="testadmin",
        email="testadmin@example.com",
        password_hash=get_password_hash("testpass123"),
        role_id=role.id,
        is_active=True,
        created_at=now,
        updated_at=now
    )
    db_session.add(user)
    db_session.commit()
    
    # Test login
    response = client.post(
        "/auth/login",
        data={
            "username": "testadmin",
            "password": "testpass123"
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(client):
    response = client.post(
        "/auth/login",
        data={
            "username": "wronguser",
            "password": "wrongpass"
        }
    )
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect username or password" 