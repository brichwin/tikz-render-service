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
3. Note: Students do not see the TikZ code, only the rendered image. If the image does not contain the formula(s) represented in the TikZ code, base your descriptions solely on the image content.

⚠️ CRITICAL REQUIREMENT - Mathematical Content MUST Use LaTeX:
ALL mathematical expressions, variables, numbers paired with variables, coordinates, equations, inequalities, formulas, Greek letters, and any symbolic math notation MUST be written in LaTeX using \\(...\\) for inline math. Screen readers cannot properly interpret plain text math - this is MANDATORY for accessibility.

Examples of CORRECT LaTeX usage in long descriptions:
✓ "starts at the origin \\((0, 0)\\)" NOT "starts at the origin (0, 0)"
✓ "maximum y-value of approximately \\(2\\) at \\(x \\approx 1.5\\)" NOT "maximum y-value of approximately 2 at x ≈ 1.5"  
✓ "decreases back through \\(y = 0\\) at approximately \\(x = 3.1\\)" NOT "decreases back through y = 0 at approximately x = 3.1"
✓ "continues to approximately \\(y = -1.5\\) at \\(x = 4\\)" NOT "continues to approximately y = -1.5 at x = 4"
✓ "curve \\(f(x) = \\sin(x)\\)" NOT "curve f(x) = sin(x)"
✓ "angle of \\(45°\\)" NOT "angle of 45°"
✓ "from \\(x = 0\\) to \\(x = 4\\)" NOT "from x = 0 to x = 4"
✓ "x-axis labeled from \\(0\\) to \\(4\\)" NOT "x-axis labeled from 0 to 4"
✓ "y-axis labeled from \\(-2\\) to \\(2\\)" NOT "y-axis labeled from -2 to 2"
✓ "y-axis" does not need LaTeX, as it is just a label not a mathematical expression
✓ "Solve for \(y\)" needs LaTeX because of the variable.

Use \\[...\\] only for displayed block equations that should be centered on their own line.

NWEA Guidelines - Core Principles:
- Brevity and focus: Be as concise as possible while conveying essential information and data
- Clarity and objectivity: Use clear, objective, factual language. Avoid subjective interpretations
- Data and key elements: Focus on the data, text, and most important visual components. Use drill-down organization starting with the most critical information
- Maintain test integrity: Provide access to visual information without giving away answers or solutions
- Accessibility: Enable equitable access for students using assistive technology

Implementation Requirements:
- Provide context: Start by identifying the image type (e.g., "Bar graph showing...", "Function plot on Cartesian coordinate system with...", "Scatter plot of...")
- Use HTML semantic elements: Use HTML <table>, <ul>, or <ol> tags to present tabular data or lists clearly and semantically
- MANDATORY LaTeX for math: Every single mathematical expression, variable, coordinate, number in a mathematical context, equation, inequality, or formula must be wrapped in \\(...\\). This includes axis labels, coordinates, function values, angles, etc.
- Summarize text: Include any text from the image without interpretation
- Keep it simple: Use regular sentence structure and casing. Avoid redundancy
- Don't use phrases like "This is a diagram of..." - describe directly and objectively

Alt-text Guidelines:
- Concise but descriptive identification of the diagram type and primary content
- Plain text is acceptable in alt-text (LaTeX requirement applies to long description only)

Long Description Guidelines:
- Written for first year university STEM students
- Organized with most critical information first
- Use HTML formatting (<p>, <strong>, <table>, <ul>, <ol>) for structure and accessibility
- ⚠️ MANDATORY: All mathematical expressions must use LaTeX \\(...\\) notation for screen reader compatibility
- Focus on what is shown, not what conclusions to draw

Respond in this exact JSON format (don't worry about escaping backslashes - that will be handled automatically):
{
  "altText": "short description here",
  "longDescription": "<p>Detailed HTML description here with LaTeX like \\(x = 0\\). Use normal backslashes.</p>"
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
  let jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to parse LLM response');
  }

  let jsonString = jsonMatch[0];
  
  // Pre-process to properly escape backslashes for JSON parsing
  // This handles LaTeX notation like \( which needs to become \\( in JSON
  // We need to be careful not to break existing escape sequences like \", \n, etc.
  
  // Strategy: Replace all backslashes with double backslashes, but only if they're not
  // already part of a valid JSON escape sequence
  // Valid JSON escape sequences: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
  
  // First, temporarily replace valid escape sequences with placeholders
  const escapeMap = new Map();
  let escapeIndex = 0;
  
  // Match valid JSON escape sequences
  jsonString = jsonString.replace(/\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4})/g, (match) => {
    const placeholder = `__ESCAPE_${escapeIndex}__`;
    escapeMap.set(placeholder, match);
    escapeIndex++;
    return placeholder;
  });
  
  // Now escape all remaining backslashes (these are the LaTeX ones)
  jsonString = jsonString.replace(/\\/g, '\\\\');
  
  // Restore the original escape sequences
  escapeMap.forEach((original, placeholder) => {
    jsonString = jsonString.replace(placeholder, original);
  });

  const descriptions = JSON.parse(jsonString);
  
  // Validate and truncate alt-text if needed
  if (descriptions.altText.length > 150) {
    descriptions.altText = descriptions.altText.substring(0, 147) + '...';
  }

  return descriptions;
}

module.exports = { generateDescription };