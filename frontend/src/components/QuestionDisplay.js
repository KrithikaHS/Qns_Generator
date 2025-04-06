import React from 'react';

function QuestionsDisplay({ questions }) {
  return (
    <div>
      <h2>Generated Questions:</h2>
      <ul>
        {questions.map((q, index) => (
          <li key={index}>{q}</li>
        ))}
      </ul>
    </div>
  );
}

export default QuestionsDisplay;
