/**
 * Enhanced Prompt Builder - Constructs AI prompts with diversity requirements
 */

export interface PromptOptions {
  includeAnimations: boolean;
  diversityLevel: 'standard' | 'high' | 'maximum';
  previousThemes?: ThemeColorSummary[];
  sessionId?: string;
}

export interface ThemeColorSummary {
  studyPrimary: string;
  studySecondary: string;
  breakPrimary: string;
  breakSecondary: string;
  animationType?: string;
}

export interface EnhancedPrompt {
  systemPrompt: string;
  userPrompt: string;
  diversityContext: string;
  randomizationSeed: string;
}

export interface SemanticContextMap {
  [keyword: string]: {
    suggestedColors: string[];
    suggestedAnimations: string[];
    visualMetaphors: string[];
    moodDescriptors: string[];
  };
}

export class EnhancedPromptBuilder {
  private static readonly SEMANTIC_CONTEXT_MAP: SemanticContextMap = {
    ocean: {
      suggestedColors: ['#0077BE', '#4A90E2', '#87CEEB', '#20B2AA', '#008B8B'],
      suggestedAnimations: ['flowing', 'wave', 'ripple'],
      visualMetaphors: ['waves', 'currents', 'depths', 'tides'],
      moodDescriptors: ['calm', 'flowing', 'deep', 'refreshing']
    },
    sunset: {
      suggestedColors: ['#FF6B35', '#F7931E', '#FFD23F', '#FF8C42', '#E74C3C'],
      suggestedAnimations: ['fade', 'glow', 'gradient-shift'],
      visualMetaphors: ['horizon', 'golden hour', 'warm glow', 'evening sky'],
      moodDescriptors: ['warm', 'peaceful', 'golden', 'serene']
    },
    forest: {
      suggestedColors: ['#228B22', '#32CD32', '#90EE90', '#006400', '#8FBC8F'],
      suggestedAnimations: ['gentle-sway', 'organic', 'natural'],
      visualMetaphors: ['leaves', 'branches', 'canopy', 'growth'],
      moodDescriptors: ['natural', 'grounded', 'fresh', 'alive']
    },
    mountain: {
      suggestedColors: ['#708090', '#2F4F4F', '#B0C4DE', '#4682B4', '#5F9EA0'],
      suggestedAnimations: ['steady', 'solid', 'majestic'],
      visualMetaphors: ['peaks', 'stone', 'elevation', 'strength'],
      moodDescriptors: ['strong', 'stable', 'elevated', 'enduring']
    },
    fire: {
      suggestedColors: ['#FF4500', '#DC143C', '#FF6347', '#B22222', '#CD5C5C'],
      suggestedAnimations: ['flicker', 'dance', 'intensity'],
      visualMetaphors: ['flames', 'ember', 'heat', 'energy'],
      moodDescriptors: ['energetic', 'passionate', 'dynamic', 'intense']
    },
    space: {
      suggestedColors: ['#191970', '#4B0082', '#483D8B', '#6A5ACD', '#9370DB'],
      suggestedAnimations: ['drift', 'cosmic', 'stellar'],
      visualMetaphors: ['stars', 'nebula', 'cosmos', 'infinity'],
      moodDescriptors: ['mysterious', 'vast', 'contemplative', 'infinite']
    },
    spring: {
      suggestedColors: ['#98FB98', '#FFB6C1', '#F0E68C', '#DDA0DD', '#87CEFA'],
      suggestedAnimations: ['bloom', 'gentle', 'fresh'],
      visualMetaphors: ['blossoms', 'renewal', 'growth', 'awakening'],
      moodDescriptors: ['fresh', 'hopeful', 'vibrant', 'renewing']
    },
    winter: {
      suggestedColors: ['#B0E0E6', '#E0FFFF', '#F0F8FF', '#DCDCDC', '#C0C0C0'],
      suggestedAnimations: ['crystalline', 'crisp', 'serene'],
      visualMetaphors: ['snow', 'ice', 'frost', 'clarity'],
      moodDescriptors: ['crisp', 'clean', 'peaceful', 'pure']
    }
  };

  private static readonly RANDOMIZATION_PATTERNS = [
    'unique variation',
    'creative interpretation',
    'distinctive approach',
    'original perspective',
    'fresh take',
    'innovative style',
    'novel combination',
    'artistic flair'
  ];

  /**
   * Builds an enhanced prompt with diversity requirements
   */
  static buildPrompt(userInput: string, options: PromptOptions = { includeAnimations: true, diversityLevel: 'standard' }): EnhancedPrompt {
    const randomizationSeed = this.generateRandomizationSeed();
    const semanticContext = this.addSemanticContext(userInput);
    const diversityContext = this.buildDiversityContext(options);
    
    const systemPrompt = this.buildEnhancedSystemPrompt(options, diversityContext);
    const userPrompt = this.buildEnhancedUserPrompt(userInput, semanticContext, randomizationSeed, options);

    return {
      systemPrompt,
      userPrompt,
      diversityContext,
      randomizationSeed
    };
  }

  /**
   * Builds enhanced system prompt with explicit diversity requirements
   */
  private static buildEnhancedSystemPrompt(options: PromptOptions, diversityContext: string): string {
    const basePrompt = `You are an expert UI/UX designer specializing in creating beautiful, unique, and accessible color themes for a Pomodoro timer app.

CRITICAL DIVERSITY REQUIREMENTS:
- Generate UNIQUE color palettes that are visually distinct from common defaults
- AVOID generic blue/green combinations unless specifically requested
- Each theme MUST be contextually appropriate to the user's prompt
- Colors MUST differ significantly from previous themes in this session
- Ensure visual diversity in both color choice and animation style

ACCESSIBILITY STANDARDS:
- All colors must meet WCAG 2.1 AA standards (4.5:1 contrast ratio minimum)
- Ensure sufficient contrast between text and background colors
- Consider color blindness accessibility in color choices

THEME REQUIREMENTS:
- Study phase colors should promote focus and concentration
- Break phase colors should promote relaxation and rest
- Include appropriate visual elements and animations
- Ensure colors work harmoniously together

${diversityContext}

RESPONSE FORMAT:
Return ONLY valid JSON in the exact format specified. No additional text or explanations.`;

    return basePrompt;
  }

  /**
   * Builds enhanced user prompt with semantic context and randomization
   */
  private static buildEnhancedUserPrompt(
    userInput: string, 
    semanticContext: string, 
    randomizationSeed: string,
    options: PromptOptions
  ): string {
    const previousThemeContext = this.buildPreviousThemeContext(options.previousThemes);
    
    return `Create a ${randomizationSeed} theme for: "${userInput}"

${semanticContext}

${previousThemeContext}

DIVERSITY EMPHASIS:
- Generate colors that are DISTINCTLY DIFFERENT from typical blue/green defaults
- Ensure this theme is VISUALLY UNIQUE and contextually appropriate
- Use creative color combinations that reflect the prompt's meaning
- Make animations match the theme's mood and context

Return JSON in this exact format:
{
  "studyColors": {
    "primary": "#hexcolor",
    "secondary": "#hexcolor", 
    "accent": "#hexcolor",
    "description": "brief description focusing on uniqueness"
  },
  "breakColors": {
    "primary": "#hexcolor",
    "secondary": "#hexcolor",
    "accent": "#hexcolor", 
    "description": "brief description focusing on uniqueness"
  },
  "visualElements": {
    "backgroundType": "pattern|particles|gradient",
    "elements": ["element1", "element2"],
    "animations": [{"type": "animation_type", "duration": 3000, "properties": {}}]
  },
  "themeName": "Unique Theme Name",
  "confidence": 0.95
}`;
  }

  /**
   * Adds semantic context based on prompt analysis
   */
  private static addSemanticContext(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase();
    let context = '';

    // Find matching semantic contexts
    for (const [keyword, contextData] of Object.entries(this.SEMANTIC_CONTEXT_MAP)) {
      if (lowerPrompt.includes(keyword)) {
        context += `SEMANTIC CONTEXT for "${keyword}":
- Suggested color palette: ${contextData.suggestedColors.join(', ')}
- Visual mood: ${contextData.moodDescriptors.join(', ')}
- Animation style: ${contextData.suggestedAnimations.join(', ')}
- Visual metaphors: ${contextData.visualMetaphors.join(', ')}

CONTEXTUAL REQUIREMENTS:
- Colors MUST reflect the ${keyword} theme appropriately
- Animations MUST match the expected mood: ${contextData.moodDescriptors.join(', ')}
- Visual elements should evoke: ${contextData.visualMetaphors.join(', ')}

`;
        break; // Use first match to avoid overwhelming the prompt
      }
    }

    // If no specific context found, provide general guidance
    if (!context) {
      context = `CREATIVE INTERPRETATION GUIDANCE:
- Analyze the prompt for color associations, mood, and visual elements
- Consider what colors and animations would best represent this concept
- Think beyond literal interpretations to create unique, artistic themes
- Ensure the theme captures the essence and feeling of the prompt

CONTEXTUAL VALIDATION:
- Colors should be semantically appropriate for the prompt
- Animations should match the implied mood and energy level
- Overall theme should feel cohesive with the prompt's meaning

`;
    }

    return context;
  }

  /**
   * Builds diversity context based on options and previous themes
   */
  private static buildDiversityContext(options: PromptOptions): string {
    let context = '';

    switch (options.diversityLevel) {
      case 'maximum':
        context = `MAXIMUM DIVERSITY MODE:
- Generate extremely unique color combinations
- Avoid any common or predictable color schemes
- Push creative boundaries while maintaining usability
- Ensure maximum visual distinction from defaults`;
        break;
      case 'high':
        context = `HIGH DIVERSITY MODE:
- Prioritize unique and distinctive color choices
- Avoid standard color combinations
- Emphasize creative and contextual appropriateness`;
        break;
      default:
        context = `STANDARD DIVERSITY MODE:
- Generate visually distinct themes
- Ensure contextual appropriateness
- Avoid repetitive color patterns`;
    }

    return context;
  }

  /**
   * Builds context about previous themes to avoid repetition
   */
  private static buildPreviousThemeContext(previousThemes?: ThemeColorSummary[]): string {
    if (!previousThemes || previousThemes.length === 0) {
      return 'FIRST THEME: Create a unique baseline theme.';
    }

    const usedColors = previousThemes.flatMap(theme => [
      theme.studyPrimary,
      theme.studySecondary,
      theme.breakPrimary,
      theme.breakSecondary
    ]);

    return `AVOID THESE RECENTLY USED COLORS:
${usedColors.join(', ')}

ENSURE NEW THEME IS VISUALLY DISTINCT from previous themes in this session.`;
  }

  /**
   * Generates a randomization seed for prompt variation
   */
  private static generateRandomizationSeed(): string {
    const patterns = this.RANDOMIZATION_PATTERNS;
    const randomIndex = Math.floor(Math.random() * patterns.length);
    return patterns[randomIndex];
  }

  /**
   * Adds randomization elements to prevent identical responses
   */
  static addRandomizationElements(prompt: string): string {
    const timestamp = Date.now();
    const randomElement = Math.floor(Math.random() * 1000);
    const variation = this.RANDOMIZATION_PATTERNS[Math.floor(Math.random() * this.RANDOMIZATION_PATTERNS.length)];
    
    return `${prompt}

RANDOMIZATION CONTEXT:
- Session ID: ${timestamp}
- Variation seed: ${randomElement}
- Creative direction: ${variation}
- Generate a completely unique interpretation`;
  }

  /**
   * Adds explicit diversity requirements to the prompt
   */
  static addDiversityRequirements(prompt: string): string {
    return `${prompt}

MANDATORY DIVERSITY REQUIREMENTS:
1. Colors MUST be visually distinct from common blue/green defaults
2. Theme MUST reflect the semantic meaning of the user's prompt
3. Animation style MUST match the theme's contextual mood
4. Overall design MUST be unique and memorable
5. Avoid any repetitive or generic color combinations

VALIDATION CRITERIA:
- Would this theme be immediately recognizable as different from defaults?
- Do the colors appropriately represent the prompt's meaning?
- Is the animation style contextually appropriate?
- Would users find this theme visually interesting and unique?`;
  }
}