INTENT_KEYWORDS = {
    "about": ["about yourself", "who are you", "introduce", "background"],
    "education": ["education", "study", "school", "college", "university"],
    "skills": ["skills", "expertise", "strengths", "what can you do"],
    "project_mediscan": ["mediscan", "medicine app", "ocr", "llm project"],
    "projects_overview": ["projects", "what projects", "things you built", "tell me about your projects"],
    "project_text_summarizer": ["summarizer", "text summarizer", "abstractive"],
    "project_sign_language": ["sign language", "gesture", "video"],
    "experience_overview": ["experience", "work experience", "past experiences", "how many years of work experience"],
    "experience_infosys": ["infosys", "internship", "data analyst"],
    "experience_amazon_ml_school": ["amazon ml", "summer school"],
    "certifications": ["certificate", "courses", "certifications"],
    "contact": ["contact", "email", "phone", "linkedin", "github"]
}

def classify_intent(query: str) -> str | None:

    q = query.lower()
    for intent, keywords in INTENT_KEYWORDS.items():
        for kw in keywords:
            if kw in q:
                return intent
    return None
