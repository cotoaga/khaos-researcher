/**
 * Code Generation API Endpoint
 * GET /api/generate - Generate client SDK code for AI models
 */

import Joi from 'joi';
import { ModelDatabase } from '../src/models/ModelDatabase.js';
import { UnifiedCodeGenerator } from '../src/generators/index.js';

// Input validation schema
const querySchema = Joi.object({
  language: Joi.string()
    .valid('javascript', 'js', 'typescript', 'ts', 'python', 'py')
    .default('javascript')
    .insensitive(),
  style: Joi.string()
    .valid('class', 'object', 'dataclass', 'dict')
    .optional()
    .allow(null),
  providers: Joi.string()
    .pattern(/^[a-zA-Z0-9_-]+(,[a-zA-Z0-9_-]+)*$/)
    .max(500)
    .optional()
    .allow(null),
  format: Joi.string()
    .valid('code', 'json')
    .default('code')
});

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use GET.' 
    });
  }

  try {
    // Validate query parameters
    const { error: validationError, value: validatedQuery } = querySchema.validate(req.query, {
      stripUnknown: true,
      abortEarly: false
    });

    if (validationError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validationError.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }

    // Use validated parameters
    const {
      language,
      style,
      providers,
      format
    } = validatedQuery;

    // Load model database
    const database = new ModelDatabase();
    await database.load();
    const allModels = database.getAllModels();

    // Initialize code generator
    const generator = new UnifiedCodeGenerator();

    // Validate language
    const supportedLanguages = generator.getSupportedLanguages();
    if (!supportedLanguages.includes(language.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: `Unsupported language: ${language}. Supported: ${supportedLanguages.join(', ')}`
      });
    }

    // Prepare options with sanitized providers
    const options = {
      language,
      style: style || getDefaultStyle(language),
      providers: providers ? providers.split(',').map(p => p.trim()).filter(p => p.length > 0) : null
    };

    // Validate style if provided
    if (style) {
      const supportedStyles = generator.getSupportedStyles(language);
      if (!supportedStyles.includes(style)) {
        return res.status(400).json({
          success: false,
          error: `Unsupported style '${style}' for ${language}. Supported: ${supportedStyles.join(', ')}`
        });
      }
    }

    // Generate code
    const code = generator.generate(allModels, options);

    // Return based on format
    if (format === 'json') {
      return res.status(200).json({
        success: true,
        language,
        style: options.style,
        providers: options.providers,
        timestamp: new Date().toISOString(),
        code
      });
    } else {
      // Return raw code with appropriate content type
      const contentType = getContentType(language);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="ai-models.${getFileExtension(language)}"`);
      return res.status(200).send(code);
    }

  } catch (error) {
    console.error('Code generation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate code',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get default style for language
 */
function getDefaultStyle(language) {
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
    case 'typescript':
    case 'ts':
      return 'class';
    case 'python':
    case 'py':
      return 'class';
    default:
      return 'class';
  }
}

/**
 * Get content type for language
 */
function getContentType(language) {
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
      return 'application/javascript; charset=utf-8';
    case 'typescript':
    case 'ts':
      return 'application/typescript; charset=utf-8';
    case 'python':
    case 'py':
      return 'text/x-python; charset=utf-8';
    default:
      return 'text/plain; charset=utf-8';
  }
}

/**
 * Get file extension for language
 */
function getFileExtension(language) {
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
      return 'js';
    case 'typescript':
    case 'ts':
      return 'ts';
    case 'python':
    case 'py':
      return 'py';
    default:
      return 'txt';
  }
}