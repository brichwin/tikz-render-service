const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function generateDescription(tikzCode, imageBase64, format, outputFormat = 'html', customInstructions = '') {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Determine the format-specific instructions
  const formatInstructions = outputFormat === 'md' 
    ? `⚠️ CRITICAL REQUIREMENT - Mathematical Content in the longDescription MUST Use LaTeX:
ALL mathematical expressions, variables, numbers paired with variables, coordinates, equations, inequalities, formulas, Greek letters, and any symbolic math notation MUST be written in LaTeX using \\(...\\) for inline math or \\[...\\] for displayed block equations. Screen readers cannot properly interpret plain text math - this is MANDATORY for accessibility.

The long description must be formatted in **Markdown** with proper headings, lists, and emphasis. Use Markdown syntax for structure.

Examples of CORRECT LaTeX usage in Markdown long descriptions:
✓ "starts at the origin \\((0, 0)\\)" NOT "starts at the origin (0, 0)"
✓ "maximum y-value of approximately \\(2\\) at \\(x \\approx 1.5\\)" NOT "maximum y-value of approximately 2 at x ≈ 1.5"  
✓ "decreases back through \\(y = 0\\) at approximately \\(x = 3.1\\)" NOT "decreases back through y = 0 at approximately x = 3.1"
✓ "continues to approximately \\(y = -1.5\\) at \\(x = 4\\)" NOT "continues to approximately y = -1.5 at x = 4"
✓ "curve \\(f(x) = \\sin(x)\\)" NOT "curve f(x) = sin(x)"

Use \\[...\\] only for displayed block equations that should be centered on their own line.

Markdown formatting examples:
- Use **bold** for emphasis
- Use \`code\` for literal text
- Use ## for section headings
- Use - or 1. for lists
- Use > for blockquotes if needed`
    : `⚠️ CRITICAL REQUIREMENT - Mathematical Content in the longDescription MUST Use LaTeX:
ALL mathematical expressions, variables, numbers paired with variables, coordinates, equations, inequalities, formulas, Greek letters, and any symbolic math notation MUST be written in LaTeX using \\(...\\) for inline math. Screen readers cannot properly interpret plain text math - this is MANDATORY for accessibility.

The long description must be formatted in **HTML** with semantic elements for accessibility.

Examples of CORRECT LaTeX usage in HTML long descriptions:
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
✓ "Solve for \\(y\\)" needs LaTeX because of the variable.

Use \\[...\\] only for displayed block equations that should be centered on their own line.

HTML formatting: Use HTML semantic elements (<p>, <strong>, <table>, <ul>, <ol>) for structure and accessibility.`;

  // Add custom instructions section if provided
  const customInstructionsSection = customInstructions 
    ? `\n\n⚠️ ADDITIONAL CUSTOM INSTRUCTIONS FROM EDUCATOR:
${customInstructions}

Please incorporate these custom instructions when generating both the alt-text and long description.`
    : '';

  const prompt = `You are an accessibility expert helping to generate descriptions for TikZ diagrams following the NWEA Image Description Guidelines for Assessments.

Given the TikZ LaTeX code and the rendered image, generate:
1. A short alt-text (maximum 175 characters) suitable for the HTML alt attribute with mathematical expressions as speech text. Mathematical expressions should be kept to a minimum in the alt-text, focusing on key elements only.
2. A longer, detailed ${outputFormat.toUpperCase()} description for first year university students with visual impairments using screen readers with mathematical expressions in LaTeX format
3. Note: Students do not see the TikZ code, only the rendered image. If the image does not contain the formula(s) represented in the TikZ code, base your descriptions solely on the image content.

⚠️ CRITICAL REQUIREMENT - Mathematical Content in the altText MUST Be Speech Text:
In the alt-text, all symbols, Greek letters, operators, and mathematical relationships must be linearized into speech text suitable for screen readers. This is MANDATORY for accessibility. Keep mathematical expressions to a minimum in the alt-text, focusing on key elements only.

Examples of CORRECT speech text usage in the altText:
✓ "f of x equals x squared" NOT "f(x) = x^2"
✓ "alpha" NOT "α"
✓ "theta" NOT "θ"
✓ "f of x is equal to a x squared plus b x plus c" NOT "f(x) = ax^2 + bx + c"
✓ "x is approximately equal to 2.5" NOT "x ≈ 2.5"
✓ "f of x is equal to sine of x" NOT "f(x) = sin(x)"
✓ "f of x is equal to, e raised to the negative x power" NOT "f(x) = e^{-x}"
✓ "angle of 45 degrees" NOT "angle of 45°"
✓ "the fraction with numerator; a minus b; and denominator c; end fraction" NOT "(a - b) / c"
✓ "f of x is equal to, the cube root of x, end root; plus 5" NOT "f(x) = ∛x + 5"
✓ "f of x is equal to x times the absolute value of x end absolute value" NOT "f(x) = x |x|"
✓ "complement of A intersect B" NOT "Ā ∩ B"

${formatInstructions}

NWEA Guidelines - Core Principles:
- Brevity and focus: Be as concise as possible while conveying essential information and data
- Clarity and objectivity: Use clear, objective, factual language. Avoid subjective interpretations
- Data and key elements: Focus on the data, text, and most important visual components. Use drill-down organization starting with the most critical information
- Maintain test integrity: Provide access to visual information without giving away answers or solutions
- Accessibility: Enable equitable access for students using assistive technology

Implementation Requirements:
- Provide context: Start by identifying the image type (e.g., "Bar graph showing...", "Function plot on Cartesian coordinate system with...", "Scatter plot of...")
${outputFormat === 'html' ? '- Use HTML semantic elements: Use HTML <table>, <ul>, or <ol> tags to present tabular data or lists clearly and semantically' : '- Use Markdown formatting: Use proper Markdown syntax for headings (##), lists (- or 1.), emphasis (**bold**), and code blocks'}
- MANDATORY LaTeX for math: Every single mathematical expression, variable, coordinate, number in a mathematical context, equation, inequality, or formula must be wrapped in \\(...\\). This includes axis labels, coordinates, function values, angles, etc.
- Summarize text: Include any text from the image without interpretation
- Keep it simple: Use regular sentence structure and casing. Avoid redundancy
- Don't use phrases like "This is a diagram of..." - describe directly and objectively

Alt-text Guidelines:
- Concise but descriptive identification of the diagram type and primary content
- Keep to a maximum of 175 characters

Long Description Guidelines:
- Written for first year university STEM students
- Organized with most critical information first
${outputFormat === 'html' ? '- Use HTML formatting (<p>, <strong>, <table>, <ul>, <ol>) for structure and accessibility' : '- Use Markdown formatting (##, -, **, etc.) for structure and readability'}
- ⚠️ MANDATORY: All mathematical expressions must use LaTeX \\(...\\) notation for screen reader compatibility
- Focus on what is shown, not what conclusions to draw
${customInstructionsSection}

RESPONSE FORMAT:
Return your response in this exact format:
- First line: The alt-text (plain text, no special formatting)
- Second line: Completely blank
- Third line onwards: The ${outputFormat.toUpperCase()} long description (can span multiple lines)

DO NOT use JSON. DO NOT wrap in code blocks. Just output:
[alt text here]

[${outputFormat.toUpperCase()} long description here, with LaTeX like \\(x = 0\\) using single backslashes]

${outputFormat === 'html' ? `Example HTML response:
Five Venn diagrams showing different set operations between two overlapping circles labeled A and B

<p>Five Venn diagrams arranged horizontally, each showing different set operations between two overlapping circles labeled \\(A\\) and \\(B\\). Each diagram has a title above indicating the set operation being illustrated.</p>
<p><strong>First diagram:</strong> Titled \\(A \\cap B\\). Shows two overlapping circles where only the intersection region is shaded blue.</p>` : `Example Markdown response:
Five Venn diagrams showing different set operations between two overlapping circles labeled A and B

Five Venn diagrams arranged horizontally, each showing different set operations between two overlapping circles labeled \\(A\\) and \\(B\\). Each diagram has a title above indicating the set operation being illustrated.

**First diagram:** Titled \\(A \\cap B\\). Shows two overlapping circles where only the intersection region is shaded blue.`}

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

  const responseText = message.content[0].text.trim();
  
  // Split on the first blank line only
  const firstBlankLineMatch = responseText.match(/\n\s*\n/);

  if (!firstBlankLineMatch) {
    throw new Error('Invalid response format - expected alt-text, blank line, then long description');
  }

  const splitIndex = firstBlankLineMatch.index + firstBlankLineMatch[0].length;

  let altText = responseText.substring(0, firstBlankLineMatch.index).trim();
  let longDescription = responseText.substring(splitIndex).trim();
  
  // Validate and truncate alt-text if needed, trying to break at a space
  if (altText.length > 200) {
    const searchStart = 180;
    const searchEnd = 200;
    const substring = altText.substring(searchStart, searchEnd);
    const lastSpaceInRange = substring.lastIndexOf(' ');
    
    if (lastSpaceInRange !== -1) {
      const truncateAt = searchStart + lastSpaceInRange;
      altText = altText.substring(0, truncateAt) + '...';
    } else {
      altText = altText.substring(0, 197) + '...';
    }
  }

  return {
    altText,
    longDescription
  };
}

module.exports = { generateDescription };