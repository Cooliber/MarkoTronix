from fastapi import APIRouter
from .mail import router as mail_router
from .offers import router as offers_router
from .links import router as links_router

router = APIRouter(prefix="/gateway")

router.include_router(mail_router)
router.include_router(offers_router)
router.include_router(links_router)