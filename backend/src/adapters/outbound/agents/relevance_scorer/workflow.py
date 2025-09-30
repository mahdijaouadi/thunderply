from jinja2 import Environment, FileSystemLoader
import os
from langchain_core.messages import AIMessage,HumanMessage,SystemMessage,ToolMessage,RemoveMessage
from backend.src.adapters.outbound.llms import GoogleGenAI
import json
from langchain_community.document_loaders import PyPDFLoader,TextLoader
from backend.src.domain.models import RelevanceScoreCriteria,JobPost
import asyncio

current_dir = os.path.dirname(os.path.abspath(__file__))



class JobPostScorerWorkflow:
    def __init__(self) -> None:
        self.llm_obj = GoogleGenAI()
        self.llm= self.llm_obj.llm
        self.llm_sleep= self.llm_obj.llm_sleep
    async def parse(self, text: str) -> RelevanceScoreCriteria:
        try:
            data = json.loads(text)
            return RelevanceScoreCriteria(
                reasoning=data.get("reasoning",""),
                experience_match=data.get("experience_match",0),
                education_match=data.get("education_match",0),
                technologies_match=data.get("technologies_match",0),
                final_score=(data.get("experience_match",0)+data.get("education_match",0)+data.get("technologies_match",0))/3
            )
        except (json.JSONDecodeError, KeyError) as e:
            raise ValueError(f"Failed to parse LLM output: {e}")
    async def load_prompt(self,template_name, **kwargs):
        env = Environment(loader=FileSystemLoader(os.path.join(current_dir,'prompts', 'templates')))
        template = env.get_template(template_name)
        return template.render(**kwargs)
    
    async def job_post_to_score(self,job_post: JobPost) -> RelevanceScoreCriteria:
        resume=PyPDFLoader(os.path.join(current_dir,'..', '..','..','..','..','user_information','resume.pdf'))
        resume=resume.load()
        system_prompt = await self.load_prompt("scorer_prompt.jinja",
                                               resume=resume)
        messages = [
                SystemMessage(content=system_prompt),
                HumanMessage(content=f"Job post: {job_post}")
            ]

        response= await self.llm.ainvoke(messages)
        if response.content[0]=="`":
            response.content=response.content[7:-4]
        response= await self.parse(response.content)
        await asyncio.sleep(self.llm_sleep)
        return response