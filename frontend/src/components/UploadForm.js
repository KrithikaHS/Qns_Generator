// src/components/UploadForm.js

import axios from 'axios';
import React, { useState } from 'react';

const UploadForm = () => {
  const [file, setFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [questions, setQuestions] = useState('');

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a PDF file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file); // MUST match FastAPI param name

    try {
      const response = await axios.post("http://localhost:8000/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Response from backend:", response.data);
      setExtractedText(response.data.extracted_text);
      setQuestions(response.data.questions); // should be string (with \n)

    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Check console for details.");
    }
  };

  return (
    <div className="container mt-5">
      <h2>Upload Subject Notes (PDF)</h2>
      <input type="file" accept=".pdf" onChange={handleFileChange} className="form-control" />
      <button onClick={handleUpload} className="btn btn-primary mt-3">Upload</button>

      {extractedText && (
        <div className="mt-4">
          <h4>Extracted Text:</h4>
          <pre>{extractedText}</pre>
        </div>
      )}

{questions && typeof questions === 'string' && (
  <div className="mt-4">
    <h4>Generated Questions:</h4>
    <ul>
      {questions.split('\n').map((line, idx) => (
        <li key={idx}>{line}</li>
      ))}
    </ul>
  </div>
)}
    </div>
  );
};

export default UploadForm;
