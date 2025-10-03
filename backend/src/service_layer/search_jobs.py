from backend.src.domain.ports import UnitOfWork, Logger
from typing import List
from backend.src.domain.models import JobPost

class SearchJobs:
    def __init__(self, uow_factory: UnitOfWork,logger:Logger):
        self._uow_factory = uow_factory
        self._logger=logger
        self.top_k=2

    async def run(self) -> List[JobPost]:
        async with self._uow_factory() as uow:
            await uow.job_posts_repository.clear_latest_results()
            job_posts= await uow.job_posts_repository.get_job_posts()
            self._logger.info(f"Size of job posts: {len(job_posts)}")
            job_posts= await uow.job_posts_repository.get_relevance_score(job_posts,self.top_k)
            job_posts= await uow.job_posts_repository.get_cover_letter(job_posts)
            await uow.job_posts_repository.save_job_posts(job_posts)
        return job_posts

class GetLatestResults:
    def __init__(self, uow_factory: UnitOfWork,logger:Logger):
        self._uow_factory = uow_factory
        self._logger=logger

    async def run(self) -> List[JobPost]:
        async with self._uow_factory() as uow:
            job_posts= await uow.job_posts_repository.get_latest_results()
        return job_posts


class ClearLatestResults:
    def __init__(self, uow_factory: UnitOfWork,logger:Logger):
        self._uow_factory = uow_factory
        self._logger=logger

    async def run(self) -> List[JobPost]:
        async with self._uow_factory() as uow:
            await uow.job_posts_repository.clear_latest_results()
        return {"status":"Cleared"}
