'use server';

/**
 * @fileOverview A flow to generate interview questions based on a resume and job description.
 *
 * - generateInterviewQuestions - A function that generates interview questions.
 * - GenerateInterviewQuestionsInput - The input type for the generateInterviewQuestions function.
 * - GenerateInterviewQuestionsOutput - The return type for the generateInterviewQuestions function.
 */

import {z} from 'genkit';
import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({
  apiKey: apiKey,
  timeoutMs: 120000, // 120 seconds timeout
});

const GenerateInterviewQuestionsInputSchema = z.object({
  resumeText: z
    .string()
    .describe('The text content of the user\'s resume.'),
  jobDescriptionText: z
    .string()
    .describe('The text content of the job description.'),
});
export type GenerateInterviewQuestionsInput = z.infer<
  typeof GenerateInterviewQuestionsInputSchema
>;

const GenerateInterviewQuestionsOutputSchema = z.object({
  interviewQuestion: z
    .string()
    .describe('A single interview question tailored to the job description and resume.'),
});
export type GenerateInterviewQuestionsOutput = z.infer<
  typeof GenerateInterviewQuestionsOutputSchema
>;

export async function generateInterviewQuestions(
  input: GenerateInterviewQuestionsInput
): Promise<GenerateInterviewQuestionsOutput> {
  const prompt = `You are an expert career coach specializing in helping candidates prepare for job interviews.

You will generate a single, relevant interview question tailored to the job description and the candidate's resume. The goal is to assess the candidate's suitability for the role based on their skills and experience.

The question should be insightful and drawn from the intersection of the resume and the job description.

Resume:
${input.resumeText}

Job Description:
${input.jobDescriptionText}

Generate the question in JSON format:
{
  "interviewQuestion": "Your generated question here."
}
`;

  const chatResponse = await client.chat.complete({
    model: 'mistral-small-latest', // Using faster model for better performance
    responseFormat: { type: 'json_object' },
    messages: [{role: 'user', content: prompt}],
  });

  const rawOutput = chatResponse.choices?.[0]?.message?.content;
  if (!rawOutput) {
    throw new Error('No response from Mistral AI');
  }
  const parsedOutput = JSON.parse(rawOutput);

  // Handle cases where interviewQuestion might be nested or in different formats
  let interviewQuestion = parsedOutput.interviewQuestion;
  if (typeof interviewQuestion === 'object' && interviewQuestion !== null) {
    interviewQuestion = interviewQuestion.text || interviewQuestion.content || interviewQuestion.question || JSON.stringify(interviewQuestion);
  }

  return GenerateInterviewQuestionsOutputSchema.parse({ interviewQuestion });
}
