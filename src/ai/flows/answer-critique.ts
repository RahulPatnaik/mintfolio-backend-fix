'use server';
/**
 * @fileOverview Provides AI-driven critique for a user's answer to an interview question.
 *
 * - answerCritique - A function that analyzes a user's answer and provides feedback.
 * - AnswerCritiqueInput - The input type for the answerCritique function.
 * - AnswerCritiqueOutput - The return type for the answerCritique function.
 */

import {z} from 'genkit';
import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({
  apiKey: apiKey,
  timeoutMs: 120000, // 120 seconds timeout
});

const AnswerCritiqueInputSchema = z.object({
  jobDescriptionText: z
    .string()
    .describe('The text content of the job description.'),
  interviewQuestion: z.string().describe('The interview question being answered.'),
  userAnswer: z.string().describe("The user's answer to the question."),
});
export type AnswerCritiqueInput = z.infer<typeof AnswerCritiqueInputSchema>;

const AnswerCritiqueOutputSchema = z.object({
  critique: z
    .string()
    .describe('Constructive feedback and suggestions for improving the user\'s answer.'),
});
export type AnswerCritiqueOutput = z.infer<typeof AnswerCritiqueOutputSchema>;

export async function answerCritique(
  input: AnswerCritiqueInput
): Promise<AnswerCritiqueOutput> {
  const prompt = `You are an expert career coach and technical interviewer. Your task is to provide constructive feedback on a candidate's answer to an interview question.

Analyze the user's answer in the context of the provided job description and the question asked.

Format your feedback as well-structured markdown with the following sections:
1. **Strengths** - What was good about the answer (bullet points)
2. **Areas for Improvement** - Specific, actionable suggestions (numbered list with sub-bullets for details)
3. **Overall Assessment** - Brief summary

Use proper markdown formatting: headers (##), bold (**text**), bullet points (-), and numbered lists (1.).

Job Description:
${input.jobDescriptionText}

Interview Question:
${input.interviewQuestion}

User's Answer:
${input.userAnswer}

Return ONLY the critique text formatted in markdown inside a JSON object:
{
  "critique": "## Strengths\n\n- Point 1\n- Point 2\n\n## Areas for Improvement\n\n1. Suggestion 1\n   - Detail about suggestion 1\n\n## Overall Assessment\n\nYour summary here."
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

  // Handle cases where critique might be nested or in different formats
  let critique = parsedOutput.critique;
  if (typeof critique === 'object' && critique !== null) {
    // If critique is an object, try to extract text from common fields
    critique = critique.text || critique.content || critique.feedback || JSON.stringify(critique);
  }

  return AnswerCritiqueOutputSchema.parse({ critique });
}
