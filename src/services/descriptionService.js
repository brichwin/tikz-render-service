const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateDescription(tikzCode, imageBase64, format) {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const prompt = `You are an accessibility expert helping to generate descriptions for TikZ diagrams following the NWEA Image Description Guidelines for Assessments.

Given the TikZ LaTeX code and the rendered image, generate:
1. A short alt-text (maximum 150 characters) suitable for the HTML alt attribute
2. A longer, detailed HTML description for first year university students with visual impairments using screen readers

NWEA Guidelines - Core Principles:
- Brevity and focus: Be as concise as possible while conveying essential information and data
- Clarity and objectivity: Use clear, objective, factual language. Avoid subjective interpretations
- Data and key elements: Focus on the data, text, and most important visual components. Use drill-down organization starting with the most critical information
- Maintain test integrity: Provide access to visual information without giving away answers or solutions
- Accessibility: Enable equitable access for students using assistive technology

Implementation Requirements:
- Provide context: Start by identifying the image type (e.g., "Bar graph showing...", "Function plot on Cartesian coordinate system with...", "Scatter plot of...")
- Use data tables and lists: When appropriate, use HTML <table>, <ul>, or <ol> tags to present data clearly and semantically
- Summarize text: Include any text from the image without interpretation
- Keep it simple: Use regular sentence structure and casing. Avoid redundancy
- Don't use phrases like "This is a diagram of..." - describe directly and objectively

Alt-text Guidelines:
- Concise but descriptive identification of the diagram type and primary content

Long Description Guidelines:
- Written for first year university STEM students
- Organized with most critical information first
- Use HTML formatting (<p>, <strong>, <table>, <ul>, <ol>) for structure and accessibility
- Focus on what is shown, not what conclusions to draw

Respond in this exact JSON format:
{
  "altText": "short description here",
  "longDescription": "<p>Detailed HTML description here. Can include <strong>emphasis</strong>, <table>, <ul>, and multiple paragraphs.</p>"
}

TikZ Code:
\`\`\`latex
${tikzCode}
\`\`\``;



  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: format === 'png' ? 'image/png' : 'image/svg+xml',
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ],
      },
    ],
  });

  const responseText = message.content[0].text;
  
  // Extract JSON from response (handle markdown code blocks if present)
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse LLM response');
  }

  const descriptions = JSON.parse(jsonMatch[0]);
  
  // Validate and truncate alt-text if needed
  if (descriptions.altText.length > 150) {
    descriptions.altText = descriptions.altText.substring(0, 147) + '...';
  }

  return descriptions;
}

module.exports = { generateDescription };
