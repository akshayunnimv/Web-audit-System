from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
from crawl_utils import crawl_url, analyze_issues
from datetime import datetime
from uuid import UUID
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Credentials (Use environment variables for security)
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://zdaweyukywitilkezfrx.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkYXdleXVreXdpdGlsa2V6ZnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1NTY3ODUsImV4cCI6MjA1NDEzMjc4NX0.tbX3mLLygGDbjuzjP6cacxHezXDkzt3TL76L7dkA8F0")  # Replace with actual key or set in env

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Pydantic Model
class URLRequest(BaseModel):
    url: str
    browser: str = "firefox"
    user_id: UUID  # Keep as UUID, no need to convert manually

@app.post("/check-url/")
async def check_url(request: URLRequest):
    url = request.url.strip()
    browser = request.browser.lower()
    user_id = str(request.user_id)  # Correct conversion
    timestamp = datetime.now().isoformat()

    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    # Create entry in tbl_crawledurls with status = 'pending'
    try:
        crawl_insert = supabase.table("tbl_crawledurls").insert({
            "user_id": user_id,
            "url": url,
            "submitted_time": timestamp,
            "status": "pending"
        }).execute()

        if not crawl_insert.data or len(crawl_insert.data) == 0:
            raise HTTPException(status_code=500, detail="Failed to create crawl entry")

        url_id = crawl_insert.data[0]["url_id"]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Supabase error: {str(e)}")

    try:
        
        soup, selenium_soup = crawl_url(url, browser)
        issue_ids = analyze_issues(soup, selenium_soup)

        seo_issues, uiux_issues = [], []

        if issue_ids:
            response = supabase.table("tbl_issuepolicy").select("*").in_("issue_id", issue_ids).execute()
            if response.data:
                for issue in response.data:
                    if issue.get("type") == "seo":
                        seo_issues.append(issue["issue_id"])
                    elif issue.get("type") == "ui/ux":
                        uiux_issues.append(issue["issue_id"])

                
                for issue_id in seo_issues:
                    supabase.table("tbl_seoissues").insert({"url_id": url_id, "issue_id": issue_id}).execute()

                for issue_id in uiux_issues:
                    supabase.table("tbl_uiuxissues").insert({"url_id": url_id, "issue_id": issue_id}).execute()

        
        supabase.table("tbl_crawledurls").update({"status": "completed"}).eq("url_id", url_id).execute()

    
        supabase.table("tbl_log").insert({
            "user_id": user_id,
            "url_id": url_id,
            "action": "URL Checked",
            "timestamp": timestamp
        }).execute()

        return {
            "url": url,
            "browser": browser,
            "url_id": url_id,
            "seo_issues": seo_issues,
            "uiux_issues": uiux_issues
        }

    except Exception as e:
        
        supabase.table("tbl_crawledurls").update({"status": "failed"}).eq("url_id", url_id).execute()
        raise HTTPException(status_code=500, detail=f"Error during crawl or issue analysis: {str(e)}")
    
class FeedbackRequest(BaseModel):
    user_id: UUID
    feedback: str

@app.post("/submit-feedback/")
async def submit_feedback(request: FeedbackRequest):
    try:
        response = supabase.table("tbl_feedback").insert({
            "user_id": str(request.user_id),
            "feedback": request.feedback
        }).execute()
        return {"message": "Feedback submitted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit feedback: {str(e)}")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)
