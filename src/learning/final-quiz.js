/**
 * src/learning/final-quiz.js
 * Final quiz generation and scoring.
 *
 * TODO (Final-quiz block): implement generateFinalQuiz(course, engine)
 *      which picks 1-2 questions per section, generates missing ones with
 *      a progress message, and assembles the full quiz.
 */

/** Score a completed final quiz attempt. */
export function scoreFinalQuiz(questions, answers) {
  let correct = 0;
  for (let i = 0; i < questions.length; i++) {
    if (questions[i].answer === answers[i]) correct++;
  }
  return { correct, total: questions.length };
}

// TODO: generateFinalQuiz(course, engine, onProgress) → quiz[]
