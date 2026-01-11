'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/generate-suggested-answers.ts';
import '@/ai/flows/resume-matcher.ts';
import '@/ai/flows/generate-interview-questions.ts';
import '@/ai/flows/skill-gap-analyzer.ts';
import '@/ai/flows/answer-critique.ts';
