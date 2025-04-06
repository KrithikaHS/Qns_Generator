import google.generativeai as genai

genai.configure(api_key="YOUR_GEMINI_API_KEY")  # Replace this

def generate_questions(text):
    prompt = (
        "You're an examiner. Based on the following notes, generate as many relevant exam-style questions as possible. "
        "Mention the mark for each question in brackets.\n\n"
        f"NOTES:\n{text}\n\n"
        "FORMAT:\nQ1. What is ...? (2 marks)\nQ2. Explain ... (5 marks)"
    )

    model = genai.GenerativeModel("gemini-pro")
    response = model.generate_content(prompt)
    return response.text
