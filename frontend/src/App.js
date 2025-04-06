import axios from 'axios';
import React, { useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import './App.css'; // 👈 make sure to import your CSS
function App() {
  const [file, setFile] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showText, setShowText] = useState(false);
  const [topic, setTopic] = useState('');
  const [summary, setSummary] = useState('');

  const handleDownload = () => {
    const content = questions.map((q, i) => `Question ${i + 1} (${q.marks} Marks):\n${q.question}\n`).join('\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${topic || "questions"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data.error) {
        toast.error(response.data.error);
        setQuestions([]);
        setTopic("");
        setSummary("");
        setExtractedText(response.data.extracted_text || "");
        return;
      }
      console.log("Full backend response:", response.data);
      setExtractedText(response.data.extracted_text);
      const receivedQuestions = response.data.questions;

      if (typeof receivedQuestions === 'string') {
        const parsed = receivedQuestions.split('\n').map((q) => {
          const match = q.match(/^(.*) - (\d+) marks$/);
          if (match) {
            return { question: match[1], marks: parseInt(match[2]) };
          } else {
            return { question: q, marks: 0 };
          }
        });
        setQuestions(parsed);
      } else {
        setQuestions(receivedQuestions);
      }

      setTopic(response.data.topic);
      setSummary(response.data.summary);
    } catch (error) {
      console.error("Upload failed:", error);
      if (error?.response?.status === 429 || error?.message?.includes("429")) {
        toast.error("⚠️ Rate limit hit. Try again later.");
      } else {
        toast.error("Upload failed. Check console for details.");
      }
    }
     finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="App container">
  <Toaster position="top-right" />
  <div className="hero">
    <h1>📄 AI Exam Question Generator</h1>
    <p>Upload your subject notes and let AI generate exam-style questions with marks and hints.</p>
  </div>

  <label className="file-upload">
    <input type="file" onChange={(e) => setFile(e.target.files[0])} />
    {file ? file.name : '📂 Choose a PDF File'}
  </label>

  <div className="button-wrapper">
  <input
    type="file"
    id="fileUpload"
    className="hidden"
    onChange={(e) => setFile(e.target.files[0])}
  />
  

  <button onClick={handleUpload} className="custom-btn generate-btn">
    ⚙️ Upload & Generate
  </button>
  {extractedText && (
    <button className="custom-btn generate-btn" onClick={() => setShowText(!showText)}>
      {showText ? '🙈 Hide Extracted Text' : '📖 Show Extracted Text'}
    </button>
  )}
  {questions.length > 0 && (
    <button onClick={handleDownload} className="custom-btn download-btn">
      ⬇️ Download Questions
    </button>
  )}
</div>

  {loading && <p className="loading">⏳ Generating questions... Please wait</p>}

  

  {showText && (
    <div className="text-box">
      <h3>📝 Extracted Text:</h3>
      <p>{extractedText}... (truncated)</p>
    </div>
  )}

  {topic && summary && (
    <div className="summary-box">
      <h3>📘 Topic: {topic}</h3>
      <p><strong>🧠 Summary:</strong> {summary}</p>
    </div>
  )}

{questions.length > 0 ? (
  <>
    <h3>🧾 Generated Questions:</h3>
    <div className="question-list">
      {questions.map((q, idx) => (
        <div className="question-card" key={idx}>
          <p className="q-title">Q{idx + 1} ({q.marks} Marks)</p>
          <p>{q.question}</p>
          {q.hint && <p className="hint">💡 Hint: {q.hint}</p>}
        </div>
      ))}
    </div>
    <div className="btn-group">
      <button className="download-btn" onClick={handleDownload}>
        ⬇️ Download Questions
      </button>
    </div>
  </>
) : !loading && extractedText && (
  <p className="no-questions">⚠️ No valid questions generated. Please try again later.</p>
)}
</div>

  );
}

export default App;
