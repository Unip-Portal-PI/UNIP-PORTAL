from fastapi import APIRouter
router = APIRouter(prefix='', tags=['health'])
from app.controllers.users import User

controller = User()

@router.get('/')
def hello():
    return controller.hello()
