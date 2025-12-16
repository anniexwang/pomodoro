# Implementation Plan

- [x] 1. Fix AI prompt construction for immediate diversity improvement
  - Enhance OpenAI system prompt with explicit diversity requirements and contextual examples
  - Add randomization seed and variation instructions to prevent identical responses
  - Include semantic context mapping for common prompts (ocean→blues, sunset→oranges, forest→greens)
  - Modify user prompt template to emphasize unique color generation
  - Test with sample prompts to verify immediate diversity improvements
  - _Requirements: 2.1, 2.2, 2.4, 2.5_

- [x] 2. Implement basic color diversity validation
  - Create simple color distance calculation using RGB difference
  - Add validation to check generated colors differ from fallback theme
  - Implement basic uniqueness check against previous theme in session
  - Update theme processing to reject themes that are too similar to defaults
  - _Requirements: 1.2, 1.5, 2.3_

- [x] 3. Add contextual color appropriateness validation
  - Create semantic color mapping for common prompt types
  - Validate that generated themes match expected color families for prompts
  - Add contextual validation for nature prompts (ocean, sunset, forest, etc.)
  - Ensure animations match the theme context (flowing for water, gentle for sunset)
  - _Requirements: 1.3_

- [x] 4. Integrate diversity system with existing AI theme generator
  - Update AIThemeGenerator to use enhanced prompts and validation
  - Add retry logic when diversity validation fails (max 2 attempts)
  - Modify theme generation workflow to include diversity checking
  - Ensure generated themes are visually distinct and contextually appropriate
  - _Requirements: 1.1, 1.4, 2.1_

- [x] 5. Test and verify theme diversity improvements
  - Generate themes with different prompts and verify visual diversity
  - Test contextual appropriateness for nature-based prompts
  - Verify no identical themes are generated in sequence
  - Confirm animations and visual elements match theme context
  - Document diversity improvements and user-visible changes
  - _Requirements: 1.1, 1.2, 1.3, 3.5_

- [ ]* 5.1 Write property test for theme diversity validation
  - **Property 1: Theme diversity across different prompts**
  - **Validates: Requirements 1.1, 1.2, 1.4**

- [ ]* 5.2 Write property test for contextual color appropriateness
  - **Property 2: Contextual color appropriateness**
  - **Validates: Requirements 1.3**