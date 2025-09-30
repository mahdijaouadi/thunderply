from dataclasses import dataclass



@dataclass
class JobPost:
    job_information: str
    apply_url:str
    company_name: str
    score: int
    cover_letter: str

@dataclass(frozen=True)
class RelevanceScoreCriteria:
    reasoning: str
    experience_match: int   # 0.6
    education_match: int    # 0.1
    technologies_match: int # 0.3
    final_score: float