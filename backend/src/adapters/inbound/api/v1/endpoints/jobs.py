from fastapi import APIRouter
from backend.src.adapters.outbound.hiringcafe.uow import HiringCafeUnitOfWork
from backend.src.service_layer.search_jobs import SearchJobs, GetLatestResults,ClearLatestResults,SaveApplication,LoadApplication
from backend.src.adapters.outbound.logging.std_logger import StdLogger
router = APIRouter()


def uow_factory():
    return HiringCafeUnitOfWork()

@router.post("/launch_search_jobs")
async def launch_search_jobs():
    service = SearchJobs(uow_factory=uow_factory, logger=StdLogger())
    result = await service.run()
    return result



@router.get("/latest_results")
async def latest_results():
    service = GetLatestResults(uow_factory=uow_factory, logger=StdLogger())
    result = await service.run()
    return result

@router.post("/clear_latest_results")
async def clear_latest_results():
    service = ClearLatestResults(uow_factory=uow_factory, logger=StdLogger())
    result = await service.run()
    return result


@router.post("/save_application")
async def save_application(application: dict):
    service = SaveApplication(uow_factory=uow_factory, logger=StdLogger())
    result = await service.run(application)
    return result


@router.get("/load_application")
async def load_application():
    service = LoadApplication(uow_factory=uow_factory, logger=StdLogger())
    result = await service.run()
    return result