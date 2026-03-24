import pytest
from datetime import date
from pydantic import ValidationError
from schemas.user_schema import (
    UserCreate, UserResponse, UserUpdateSelf, PasswordUpdate,
    UserLogin, UserVerifyOTP
)

# FIXTURES

@pytest.fixture
def valid_user_data():
    return {
        "name": "João Silva",
        "nickname": "joaosilva",
        "registration_number": "2023001",
        "email": "joao@email.com",
        "password": "Senha123",
        "area": "Computação",
        "phone": "11999991234",
        "birth_date": date(2000, 1, 1)
    }

# TESTES USERCREATE

def test_user_create_valid(valid_user_data):
    schema = UserCreate(**valid_user_data)
    assert schema.email == "joao@email.com"

def test_user_create_password_validation(valid_user_data):
    data = valid_user_data.copy()
    data["password"] = "senha123"  # sem maiúscula
    with pytest.raises(ValidationError):
        UserCreate(**data)

def test_user_create_invalid_email(valid_user_data):
    data = valid_user_data.copy()
    data["email"] = "invalido"
    with pytest.raises(ValidationError):
        UserCreate(**data)

def test_user_create_phone_formats(valid_user_data):
    data = valid_user_data.copy()
    data["phone"] = "(11) 99999-1234"
    schema = UserCreate(**data)
    assert schema.phone == "11999991234"

# TESTES USERRESPONSE

def test_user_response_valid(valid_user_data):
    data = {
        "id": 1,
        **valid_user_data,
        "role": "student",
        "is_active": True
    }
    schema = UserResponse(**data)
    assert schema.id == 1

def test_user_response_required_fields():
    with pytest.raises(ValidationError):
        UserResponse(id=1, name="João")

# TESTES USERUPDATESELF

def test_user_update_self_partial():
    schema = UserUpdateSelf(name="Novo Nome")
    assert schema.name == "Novo Nome"

def test_user_update_self_phone_formats():
    schema = UserUpdateSelf(phone="(11) 98888-7777")
    assert schema.phone == "11988887777"

# TESTES PASSWORDUPDATE

def test_password_update_valid():
    schema = PasswordUpdate(
        current_password="Senha123",
        new_password="NovaSenha456"
    )
    assert schema.new_password == "NovaSenha456"

def test_password_update_weak_password():
    with pytest.raises(ValidationError):
        PasswordUpdate(
            current_password="Senha123",
            new_password="nova456"  # sem maiúscula
        )

# TESTES USERLOGIN

def test_user_login_valid():
    schema = UserLogin(
        registration_number="2023001",
        password="Senha123"
    )
    assert schema.registration_number == "2023001"

def test_user_login_missing_fields():
    with pytest.raises(ValidationError):
        UserLogin(registration_number="2023001")

# TESTES USERVERIFYOTP

def test_user_verify_otp_valid():
    schema = UserVerifyOTP(
        email="joao@email.com",
        otp_code="123456"
    )
    assert schema.otp_code == "123456"

def test_user_verify_otp_invalid():
    with pytest.raises(ValidationError):
        UserVerifyOTP(email="joao@email.com", otp_code="123ABC")

# EXECUÇÃO
if __name__ == "__main__":
    pytest.main([__file__, "-v"])