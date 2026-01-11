'use server';
/**
 * @fileOverview Generates suggested answers to interview questions using AI.
 *
 * - generateSuggestedAnswers - A function that generates suggested answers to interview questions.
 * - GenerateSuggestedAnswersInput - The input type for the generateSuggestedAnswers function.
 * - GenerateSuggestedAnswersOutput - The return type for the generateSuggestedAnswers function.
 */

import {z} from 'genkit';
import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({
  apiKey: apiKey,
  timeoutMs: 120000, // 120 seconds timeout
});

const GenerateSuggestedAnswersInputSchema = z.object({
  jobDescription: z
    .string()
    .describe('The job description for the role the user is interviewing for.'),
  interviewQuestion: z.string().describe('The interview question to generate an answer for.'),
});
export type GenerateSuggestedAnswersInput = z.infer<
  typeof GenerateSuggestedAnswersInputSchema
>;

const GenerateSuggestedAnswersOutputSchema = z.object({
  suggestedAnswer: z
    .string()
    .describe('The suggested answer to the interview question.'),
});
export type GenerateSuggestedAnswersOutput = z.infer<
  typeof GenerateSuggestedAnswersOutputSchema
>;

export async function generateSuggestedAnswers(
  input: GenerateSuggestedAnswersInput
): Promise<GenerateSuggestedAnswersOutput> {
  const prompt = `You are an expert career coach helping candidates prepare for interviews.

You will be given a job description and an interview question. Your task is to generate a suggested answer to the interview question based on the job description.

Provide the answer as clean, unformatted text. Do not use any markdown formatting (like **, *, or #).

Job Description: ${input.jobDescription}
Interview Question: ${input.interviewQuestion}

Suggested Answer in JSON format:
{
  "suggestedAnswer": "Your detailed suggested answer here."
}
`;

  const chatResponse = await client.chat.complete({
    model: 'mistral-large-latest',
    responseFormat: { type: 'json_object' },
    messages: [{role: 'user', content: prompt}],
  });

  const rawOutput = chatResponse.choices?.[0]?.message?.content;
  if (!rawOutput) {
    throw new Error('No response from Mistral AI');
  }
  const parsedOutput = JSON.parse(rawOutput);

  // Handle cases where suggestedAnswer might be nested or in different formats
  let suggestedAnswer = parsedOutput.suggestedAnswer;
  if (typeof suggestedAnswer === 'object' && suggestedAnswer !== null) {
    suggestedAnswer = suggestedAnswer.text || suggestedAnswer.content || suggestedAnswer.answer || JSON.stringify(suggestedAnswer);
  }

  return GenerateSuggestedAnswersOutputSchema.parse({ suggestedAnswer });
}
