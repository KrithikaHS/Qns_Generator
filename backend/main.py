from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pytesseract
from pdf2image import convert_from_bytes
from PIL import Image
import os
import pdfplumber
import json
import re

genai.configure(api_key="YOUR_API_KEY")
app = FastAPI()

# Allow frontend to access backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import re

def clean_response(text):
    # Remove all standalone "- 0 marks" lines
    cleaned = re.sub(r'- 0 marks\n?', '', text)
    return cleaned.strip()

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        return {"error": "Please upload a PDF file"}

    contents = await file.read()
    with open("uploaded.pdf", "wb") as f:
        f.write(contents)

    # Step 1: Extract text from PDF
    text = ""
    with pdfplumber.open("uploaded.pdf") as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    if not text.strip():
        return {
            "extracted_text": "",
            "questions": "❌ No text found in PDF.",
            "topic": "",
            "summary": ""
        }

    model = genai.GenerativeModel("gemini-1.5-pro-latest")

    try:
        # Step 2: Generate Questions
        question_prompt = f"""
You are an AI exam generator. Based on the subject notes below, generate as many detailed exam-style questions as possible**. 
Each question should include:

- `question` (string)
- `marks` (number)
- `hint` (optional string)

Return ONLY a valid JSON list like this:
[
  {{
    "question": "Your question here",
    "marks": 10,
    "hint": "Optional hint"
  }},
  ...
]

Subject Notes:
{text[:3000]}
"""
        questions_response = model.generate_content(question_prompt)
        cleaned_q = questions_response.text.strip()
        if cleaned_q.startswith("```json"):
            cleaned_q = cleaned_q.strip("```json").strip("```").strip()
        elif cleaned_q.startswith("```"):
            cleaned_q = cleaned_q.strip("```").strip()
        try:
            cleaned_questions = json.loads(cleaned_q)
        except Exception as e:
            print("⚠️ Error parsing questions:", e)
            cleaned_questions = [{"question": "❌ Failed to parse AI output.", "marks": 0}]
        
        # Step 3: Generate Topic and Summary
        summary_prompt = f"""
Analyze the following subject notes and return a response in **valid JSON** format like this:

{{
  "topic": "Short Descriptive Title",
  "summary": "detailed summary of the content"
}}

Subject Notes:
{text[:3000]}
        """
        summary_response = model.generate_content(summary_prompt)
        print("Raw summary response:\n", summary_response.text)

        # Sometimes Gemini includes markdown/code blocks – clean them
        cleaned_response = summary_response.text.strip()
        if cleaned_response.startswith("```json"):
            cleaned_response = cleaned_response.strip("```json").strip("```").strip()
        elif cleaned_response.startswith("```"):
            cleaned_response = cleaned_response.strip("```").strip()
        try:
            result_json = json.loads(cleaned_response)
            topic = result_json.get("topic", "")
            summary = result_json.get("summary", "")
        except Exception as parse_error:
            print("⚠️ JSON parsing error:", parse_error)
            topic = ""
            summary = "❌ Failed to generate summary properly. Please try again."

        return {
            "extracted_text": text[:1000],
            "questions": cleaned_questions,
            "topic": topic,
            "summary": summary
        }

    except Exception as e:
        return {
            "extracted_text": text[:1000],
            "questions": f"Error while calling AI: {str(e)}",
            "topic": "",
            "summary": "",
            "error": f"Error while calling AI: {str(e)}"
        }

