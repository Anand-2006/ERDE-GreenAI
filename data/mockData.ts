import { PromptTemplate } from '../types';

export const TEMPLATE_DATABASE: PromptTemplate[] = [
    // --- GEMINI 3.0 PRO (High Reasoning) ---
    {
        id: 'pro-1',
        title: 'Legacy Code Refactor',
        description: 'Analyzes legacy COBOL/Fortran snippets and rewrites them in modern Rust with memory safety annotations.',
        category: 'Development',
        rating: 'B',
        tokens: 3200,
        savings: 12,
        models: ['gemini-3-pro'],
        prompt: 'Analyze legacy COBOL/Fortran code. Rewrite in Rust with memory safety annotations. Preserve logic, add error handling.'
    },
    {
        id: 'pro-2',
        title: 'Legal Contract Audit',
        description: 'Scans NDA documents for specific clauses related to IP assignment and liability caps, flagging risks.',
        category: 'Analysis',
        rating: 'B',
        tokens: 4500,
        savings: 15,
        models: ['gemini-3-pro'],
        prompt: 'Audit NDA for IP assignment clauses, liability caps, confidentiality scope. Flag risks, summarize findings.'
    },
    {
        id: 'pro-3',
        title: 'Quantum Physics Explainer',
        description: 'Generates university-level explanations of quantum entanglement with mathematical proofs.',
        category: 'Research',
        rating: 'B',
        tokens: 2100,
        savings: 18,
        models: ['gemini-3-pro'],
        prompt: 'Explain quantum entanglement at university level. Include mathematical proofs, Bell inequalities, experimental verification.'
    },

    // --- GEMINI 3.0 FLASH (Speed/Efficiency) ---
    {
        id: 'flash3-1',
        title: 'React Component Generator',
        description: 'Creates functional React components with Tailwind classes based on visual descriptions.',
        category: 'Development',
        rating: 'A',
        tokens: 650,
        savings: 45,
        models: ['gemini-3-flash'],
        prompt: 'Create React functional component with Tailwind CSS. Include props, TypeScript types, responsive design.'
    },
    {
        id: 'flash3-2',
        title: 'Invoice Data Extractor',
        description: 'Extracts line items, dates, and tax amounts from messy OCR text into clean JSON.',
        category: 'Extraction',
        rating: 'A+',
        tokens: 400,
        savings: 68,
        models: ['gemini-3-flash'],
        prompt: 'Extract invoice data: line items, dates, tax amounts, totals. Output clean JSON. Handle OCR errors.'
    },
    {
        id: 'flash3-3',
        title: 'Technical Blog Outliner',
        description: 'Drafts comprehensive outlines for technical articles including SEO keywords and headings.',
        category: 'Drafting',
        rating: 'A+',
        tokens: 300,
        savings: 55,
        models: ['gemini-3-flash'],
        prompt: 'Create technical blog outline: title, headings, subheadings, SEO keywords, meta description.'
    },

    // --- GEMINI 2.5 FLASH (Legacy/Stable) ---
    {
        id: 'flash2-1',
        title: 'Regex Generator',
        description: 'Constructs complex Regular Expressions for email validation and phone number formatting.',
        category: 'Development',
        rating: 'A+',
        tokens: 150,
        savings: 72,
        models: ['gemini-2.5-flash'],
        prompt: 'Generate regex for email validation and phone number formatting. Include test cases.'
    },
    {
        id: 'flash2-2',
        title: 'Sentiment Analyzer',
        description: 'Classifies customer support tickets into Positive, Neutral, or Negative buckets.',
        category: 'Analysis',
        rating: 'A+',
        tokens: 120,
        savings: 80,
        models: ['gemini-2.5-flash'],
        prompt: 'Classify support ticket sentiment: Positive, Neutral, or Negative. Provide confidence score.'
    },
    {
        id: 'flash2-3',
        title: 'Viral Tweet Drafter',
        description: 'Generates 5 variations of a product launch announcement optimized for engagement.',
        category: 'Drafting',
        rating: 'A+',
        tokens: 200,
        savings: 65,
        models: ['gemini-2.5-flash'],
        prompt: 'Generate 5 tweet variations for product launch. Optimize for engagement, include hashtags, emojis.'
    },

    // --- OTHERS for Variety ---
    {
        id: 'mix-1',
        title: 'SQL Query Optimizer',
        description: 'Rewrites inefficient subqueries into optimized JOINs for Postgres.',
        category: 'Development',
        rating: 'A',
        tokens: 340,
        savings: 71,
        models: ['gemini-3-flash', 'gemini-3-pro'],
        prompt: 'Optimize SQL query: convert subqueries to JOINs, add indexes, improve performance for Postgres.'
    },
    {
        id: 'mix-2',
        title: 'Resume Parser',
        description: 'Converts PDF resume text into structured candidate profiles.',
        category: 'Extraction',
        rating: 'A',
        tokens: 900,
        savings: 50,
        models: ['gemini-3-flash'],
        prompt: 'Parse resume PDF. Extract: name, contact, education, experience, skills. Output structured JSON.'
    },
    {
        id: 'mix-3',
        title: 'Competitor Analysis Synth',
        description: 'Summarizes 10 different competitor landing pages into a strategy matrix.',
        category: 'Research',
        rating: 'B',
        tokens: 5200,
        savings: 22,
        models: ['gemini-3-pro'],
        prompt: 'Analyze 10 competitor landing pages. Create strategy matrix: features, pricing, messaging, positioning.'
    },
    {
        id: 'mix-4',
        title: 'JSON Logic Validator',
        description: 'Ensures JSON output strictly adheres to a provided schema without hallucination.',
        category: 'Logic',
        rating: 'A+',
        tokens: 90,
        savings: 74,
        models: ['gemini-3-flash'],
        prompt: 'Validate JSON against schema. Check types, required fields, constraints. Return validation errors.'
    }
];

export const EXAMPLE_PROMPTS = [
    {
        title: 'SQL Query Cleanup',
        desc: 'Simplify complex joins for better readability.',
        text: 'Optimize this SQL query which joins 5 tables (users, orders, items, inventory, shipping) to find the top 10 spending customers in California who ordered in the last 30 days. Remove redundant subqueries.'
    },
    {
        title: 'Customer Apology',
        desc: 'Professional tone for service outages.',
        text: 'Draft a polite and professional email to customers explaining a 2-hour service outage due to a database migration. Emphasize that no data was lost and offer a 5% discount on the next bill.'
    },
    {
        title: 'Python Data Parser',
        desc: 'Efficient CSV extraction logic.',
        text: 'Write a Python script using pandas to read a large CSV file (5GB), filter for rows where the "status" column is "active", and export the "email" and "name" columns to a new JSON file.'
    }
];

export const SAVINGS_DATA = [
    { month: 'Jan', savings: 2.4 },
    { month: 'Feb', savings: 3.8 },
    { month: 'Mar', savings: 5.1 },
    { month: 'Apr', savings: 8.4 },
    { month: 'May', savings: 11.2 },
    { month: 'Jun', savings: 14.2 },
];
