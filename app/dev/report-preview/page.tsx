"use client";

// Dev-only fixture preview of the skill report — lets us iterate on the report
// design without taking a real assessment. Returns 404 in production.

import { notFound } from "next/navigation";
import { SkillReportView, type ReportData } from "@/components/SkillReportView";

const FIXTURE: ReportData = {
  reportId: "dev-fixture",
  level: "intermediate",
  score: 62,
  maxScore: 100,
  percentage: 62,
  mcqScore: 18,
  mcqMax: 25,
  shortScore: 22,
  shortMax: 35,
  codeScore: 22,
  codeMax: 40,
  topicMastery: [
    { topic: "fundamentals", correct: 4, total: 5, percentage: 80 },
    { topic: "algorithms", correct: 2, total: 4, percentage: 50 },
    { topic: "statistics", correct: 3, total: 4, percentage: 75 },
    { topic: "supervised-learning", correct: 5, total: 6, percentage: 83 },
    { topic: "classification", correct: 3, total: 5, percentage: 60 },
    { topic: "regression", correct: 4, total: 5, percentage: 80 },
    { topic: "linear-models", correct: 2, total: 4, percentage: 50 },
    { topic: "decision-trees", correct: 1, total: 4, percentage: 25 },
    { topic: "unsupervised", correct: 1, total: 3, percentage: 33 },
    { topic: "clustering", correct: 2, total: 4, percentage: 50 },
    { topic: "feature-engineering", correct: 3, total: 4, percentage: 75 },
    { topic: "data-preprocessing", correct: 4, total: 5, percentage: 80 },
    { topic: "visualisation", correct: 2, total: 3, percentage: 67 },
    { topic: "model-evaluation", correct: 2, total: 5, percentage: 40 },
    { topic: "cross-validation", correct: 1, total: 3, percentage: 33 },
    { topic: "metrics", correct: 3, total: 4, percentage: 75 },
    { topic: "bias-variance", correct: 1, total: 3, percentage: 33 },
    { topic: "optimisation", correct: 2, total: 4, percentage: 50 },
    { topic: "gradient-descent", correct: 3, total: 4, percentage: 75 },
    { topic: "regularisation", correct: 1, total: 4, percentage: 25 },
  ],
  domainMastery: [
    { domain: "ML Foundations", correct: 9, total: 13, percentage: 69, level: "Proficient" },
    { domain: "Supervised Learning", correct: 15, total: 24, percentage: 63, level: "Proficient" },
    { domain: "Unsupervised Learning", correct: 3, total: 7, percentage: 43, level: "Developing" },
    { domain: "Feature Engineering & Data", correct: 9, total: 12, percentage: 75, level: "Advanced" },
    { domain: "Model Evaluation", correct: 7, total: 15, percentage: 47, level: "Developing" },
    { domain: "Optimisation & Regularisation", correct: 6, total: 12, percentage: 50, level: "Developing" },
  ],
  roleReadiness: "Junior ML Engineer (with supervision)",
  cohortPercentile: 68,
  recommendationsMd: [
    "Your foundations are solid — your gaps cluster around how models are *evaluated* and *regularised*, which is exactly what separates working models from trustworthy ones.",
    "",
    "1. Start with Model Evaluation: re-do the cross-validation lesson, then practise choosing metrics for imbalanced datasets.",
    "2. Revisit regularisation — L1 vs L2 and when each matters. Your decision-tree answers suggest overfitting isn't intuitive yet.",
    "3. Keep leaning on your data-wrangling strength: your feature-engineering scores are your fastest route to portfolio-quality projects.",
  ].join("\n"),
  questionResults: [
    {
      id: "q1", number: 1, stem: "Which of the following best describes the bias-variance tradeoff?", type: "mcq",
      topicTag: "bias-variance", marksAwarded: 1, marksTotal: 1, correct: true,
      feedback: null, correctAnswer: "Balancing underfitting and overfitting", studentAnswer: "Balancing underfitting and overfitting",
      improvedCode: null, breakdown: null, topicUnderstanding: null,
    },
    {
      id: "q2", number: 2, stem: "Explain why k-fold cross-validation gives a more reliable estimate of model performance than a single train/test split.", type: "short_answer",
      topicTag: "cross-validation", marksAwarded: 2, marksTotal: 4, correct: false,
      feedback: "You correctly identified that every observation gets used for both training and validation, but missed that averaging across folds reduces the variance of the performance estimate.",
      correctAnswer: "Every sample is used for validation exactly once; averaging across k folds reduces the variance of the estimate and makes better use of limited data.",
      studentAnswer: "Because it tests the model on different parts of the data so you know it works on all of it.",
      improvedCode: null,
      breakdown: [
        { criterion: "Mentions all data used for validation", awarded: 1, reasoning: "Stated clearly" },
        { criterion: "Explains variance reduction from averaging", awarded: 0, reasoning: "Not mentioned" },
        { criterion: "Notes value for small datasets", awarded: 1, reasoning: "Implied" },
        { criterion: "Correct terminology", awarded: 0, reasoning: "Informal phrasing" },
      ],
      topicUnderstanding: null,
    },
    {
      id: "q3", number: 3, stem: "Write a function that standardises the numeric columns of a pandas DataFrame (zero mean, unit variance), leaving non-numeric columns untouched.", type: "code",
      topicTag: "data-preprocessing", marksAwarded: 8, marksTotal: 10, correct: true,
      feedback: "Clean, vectorised solution. You lost marks for not guarding against zero-variance columns, which would produce NaNs.",
      correctAnswer: null,
      studentAnswer: "def standardise(df):\n    num = df.select_dtypes('number').columns\n    df[num] = (df[num] - df[num].mean()) / df[num].std()\n    return df",
      improvedCode: "def standardise(df):\n    num = df.select_dtypes('number').columns\n    std = df[num].std().replace(0, 1)\n    df[num] = (df[num] - df[num].mean()) / std\n    return df",
      breakdown: [
        { criterion: "Selects numeric columns only", awarded: 3, reasoning: "Correct use of select_dtypes" },
        { criterion: "Correct standardisation formula", awarded: 3, reasoning: "Vectorised and correct" },
        { criterion: "Handles edge cases", awarded: 0, reasoning: "Zero-variance columns produce NaN" },
        { criterion: "Readable, idiomatic code", awarded: 2, reasoning: "Clear naming" },
      ],
      topicUnderstanding: null,
    },
    {
      id: "q4", number: 4, stem: "A decision tree achieves 99% accuracy on training data but 71% on held-out data. What is happening and name two remedies.", type: "short_answer",
      topicTag: "decision-trees", marksAwarded: 1, marksTotal: 4, correct: false,
      feedback: "You spotted overfitting but the remedies were vague — 'make it simpler' needs specifics like max_depth, min_samples_leaf, pruning, or ensembling.",
      correctAnswer: "Overfitting. Remedies: limit tree depth / min samples per leaf, prune the tree, or use an ensemble (random forest / gradient boosting).",
      studentAnswer: "The tree memorised the training data. Make it simpler.",
      improvedCode: null,
      breakdown: [
        { criterion: "Identifies overfitting", awarded: 1, reasoning: "Correct" },
        { criterion: "First concrete remedy", awarded: 0, reasoning: "Too vague" },
        { criterion: "Second concrete remedy", awarded: 0, reasoning: "Missing" },
        { criterion: "Links remedy to mechanism", awarded: 0, reasoning: "Missing" },
      ],
      topicUnderstanding: null,
    },
  ],
};

export default function ReportPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <SkillReportView report={FIXTURE} slug="machine-learning" />;
}
