'use server';

/**
 * @fileOverview Analyzes the skill gap between a resume and a job description.
 *
 * - skillGapAnalyzer - A function that identifies missing skills and suggests learning resources.
 * - SkillGapAnalyzerInput - The input type for the skillGapAnalyzer function SkillGapAnalyzerInput.
 * - SkillGapAnalyzerOutput - The return type for the skillGapAnalyzer function.
 */

import {z} from 'genkit';
import { Mistral } from '@mistralai/mistralai';
import courses from '@/lib/courses.json';
import dsa from '@/lib/dsa.json';

const apiKey = process.env.MISTRAL_API_KEY;
const client = new Mistral({
  apiKey: apiKey,
  timeoutMs: 120000, // 120 seconds timeout
});


const SkillGapAnalyzerInputSchema = z.object({
  resumeText: z.string().describe('The full text content of the resume.'),
  jobDescriptionText: z
    .string()
    .describe('The full text content of the job description.'),
});
export type SkillGapAnalyzerInput = z.infer<
  typeof SkillGapAnalyzerInputSchema
>;

const CourseSchema = z.object({
  id: z.string(),
  skill: z.string(),
  title: z.string(),
  provider: z.string(),
  url: z.string().url(),
});

const DSASchema = z.object({
  id: z.string(),
  skill: z.string(),
  title: z.string(),
  url: z.string().url(),
});

const MissingSkillSchema = z.object({
  skill: z.string().describe('The name of the missing skill.'),
  recommendedCourse: CourseSchema.optional().describe('A recommended online course for this skill.'),
  recommendedDSAProblem: DSASchema.optional().describe('A recommended DSA problem for this skill.'),
});

const SkillGapAnalyzerOutputSchema = z.object({
  missingHardSkills: z.array(MissingSkillSchema).describe('An array of missing hard skills with recommendations.'),
  missingSoftSkills: z.array(MissingSkillSchema).describe('An array of missing soft skills with recommendations.'),
});
export type SkillGapAnalyzerOutput = z.infer<
  typeof SkillGapAnalyzerOutputSchema
>;

export async function skillGapAnalyzer(
  input: SkillGapAnalyzerInput
): Promise<SkillGapAnalyzerOutput> {
  const prompt = `You are an expert career development coach. Your task is to identify the hard and soft skills that are present in the job description but are missing from the candidate's resume.

For each missing skill you identify, you must search the provided JSON datasets to find a relevant online course and, if applicable, a DSA problem.

- For EVERY missing skill (hard or soft), find the best matching course from the 'Available Courses' JSON.
- For missing HARD skills that are related to programming, algorithms, or data structures, ALSO find the best matching problem from the 'Available DSA Problems' JSON.
- When you find a match, include the entire JSON object for that course or problem in your response. Do not recommend more than one course or one DSA problem per skill.

Present your findings clearly, separating missing hard skills and soft skills. Your entire output must be a single JSON object matching this Zod schema:
${JSON.stringify(SkillGapAnalyzerOutputSchema.shape)}

Job Description:
${input.jobDescriptionText}

Resume:
${input.resumeText}

Available Courses (JSON):
${JSON.stringify(courses)}

Available DSA Problems (JSON):
${JSON.stringify(dsa)}
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

  return SkillGapAnalyzerOutputSchema.parse(parsedOutput);
}
