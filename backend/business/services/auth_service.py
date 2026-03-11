from core.security import hash_password, verify_password, create_access_token
from persistence.repositories.user_repository import UserRepository
from persistence.models.user_model import UserModel

class AuthService:
    def __init__(self, repo: UserRepository):
        self.repo = repo

    def register(self, name: str, email: str, password: str, role: str):
        existing_user = self.repo.get_by_email(email)
        if existing_user:
            return None
        user = UserModel(
            name=name,
            email=email,
            password_hash=hash_password(password),
            role=role
        )
        return self.repo.create(user)

    def login(self, email: str, password: str):
        user = self.repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            return None
        token = create_access_token({"sub": str(user.id), "role": user.role})
        return token

    def list_users(self, skip: int = 0, limit: int = 10):
        return self.repo.list(skip=skip, limit=limit)

    def get_user(self, user_id: int):
        return self.repo.get_by_id(user_id)

    def update_user(self, user_id: int, user_data):
        return self.repo.update(user_id, user_data)

    def delete_user(self, user_id: int):
        return self.repo.delete(user_id)