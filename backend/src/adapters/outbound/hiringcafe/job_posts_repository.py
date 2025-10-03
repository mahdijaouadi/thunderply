from backend.src.domain.models import JobPost
from typing import List
import requests
import os
import json
from backend.src.adapters.outbound.agents.relevance_scorer.workflow import JobPostScorerWorkflow
from backend.src.adapters.outbound.agents.cover_letter_writer.workflow import JobPostCoverLetterWorkflow
from backend.src.config.settings import settings
from pymongo import MongoClient
from dataclasses import asdict
current_dir = os.path.dirname(os.path.abspath(__file__))

class HiringCafeJobPostsRepository:
    async def get_job_posts(self) -> List[JobPost]:

        URL = "https://hiring.cafe/api/search-jobs"
        payload_path=os.path.join(current_dir, '..', '..','..','..', 'user_information', 'search_param.json')
        with open(payload_path, 'r', encoding='utf-8') as f:
            payload = json.load(f)

        headers = {
            "User-Agent": "Mozilla/5.0",
            "Accept": "/",
            "Content-Type": "application/json",
            "Referer": "https://hiring.cafe/"
        }

        r = requests.post(URL, json=payload, headers=headers)
        r.raise_for_status()
        j = r.json()

        jobs = None
        for k in ("results", "hits", "jobs", "items"):
            if isinstance(j.get(k), list):
                jobs = j[k]
                break
        if jobs is None and isinstance(j.get("data"), dict):
            for k in ("results", "hits", "jobs", "items"):
                if isinstance(j["data"].get(k), list):
                    jobs = j["data"][k]
                    break

        if not jobs:
            raise RuntimeError("Could not find jobs array in response; print j to inspect shape.")

        job_posts = []
        for job in jobs:
            apply_url = job.get("apply_url") or job.get("applyUrl")
            job_information=job.get("job_information") or {}
            company_name=job.get("v5_processed_company_data",{}).get("name","Unknown Company")
            job_posts.append(JobPost(
                job_information= job_information,
                apply_url= apply_url,
                company_name= company_name,
                score=0,
                cover_letter=""
            ))

        return job_posts
    async def get_relevance_score(self,job_posts:List[JobPost], top_k: int) -> List[JobPost]:
        job_posts=job_posts[:1]
        workflow=JobPostScorerWorkflow()
        for i in range(len(job_posts)):
            relevance_score= await workflow.job_post_to_score(job_post=job_posts[i])
            print(f"Relevance score of this job is\n {relevance_score}\n\n")
            job_posts[i].score=relevance_score.final_score
        job_posts.sort(key=lambda job: job.score, reverse=True)
        return job_posts[:top_k]



    async def get_cover_letter(self, job_posts:List[JobPost]) -> List[JobPost]:
        workflow=JobPostCoverLetterWorkflow()
        for i in range(len(job_posts)):
            job_posts[i].cover_letter= await workflow.job_post_to_coverletter(job_post=job_posts[i])
        return job_posts
    
    async def get_latest_results(self) -> List[JobPost]:
        mongo_db_uri=settings.mongo_db_uri
        client=MongoClient(mongo_db_uri)
        db=client["appdb"]
        collection=db["searchresults"]
        cursor=collection.find()
        job_posts_docs=list(cursor)
        client.close()
        job_posts: List[JobPost] = []
        for doc in job_posts_docs:
            job_posts.append(JobPost(
                job_information=doc.get("job_information", {}),
                apply_url=doc.get("apply_url") or doc.get("applyUrl"),
                company_name=doc.get("company_name", "Unknown Company"),
                score=doc.get("score", 0),
                cover_letter=doc.get("cover_letter", "")
            ))
        return job_posts
    
    async def save_job_posts(self,job_posts:List[JobPost]) -> str:
        mongo_db_uri=settings.mongo_db_uri
        client=MongoClient(mongo_db_uri)
        db=client["appdb"]
        collection=db["searchresults"]
        collection.insert_many([asdict(job_post) for job_post in job_posts])
        client.close()
        return "saved"
    async def clear_latest_results(self) -> str:
            mongo_db_uri = settings.mongo_db_uri
            client = MongoClient(mongo_db_uri)
            db = client["appdb"]
            collection = db["searchresults"]

            collection.delete_many({})

            client.close()
            return "cleared"