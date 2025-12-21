import { getOrCreateSettings, updateSettings } from '../queries/settings.js';
import { successResponse, errorResponse, toCamelCase } from '../utils/response.js';

/**
 * Get company settings
 * GET /api/v1/settings
 */
export const getSettings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const settings = await getOrCreateSettings(userId);

    // Transform to camelCase
    const transformed = toCamelCase(settings);

    return successResponse(
      res,
      {
        settings: transformed,
      },
      null,
      200
    );
  } catch (error) {
    console.error('Get settings error:', error);
    throw error;
  }
};

/**
 * Update company settings
 * PUT /api/v1/settings
 */
export const update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const settingsData = req.body;

    // Validate required fields if provided
    if (settingsData.companyName !== undefined && (!settingsData.companyName || settingsData.companyName.trim().length === 0)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Company name cannot be empty',
        { companyName: ['Company name cannot be empty'] },
        422
      );
    }

    if (settingsData.defaultTaxRate !== undefined) {
      const taxRate = parseFloat(settingsData.defaultTaxRate);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'Default tax rate must be between 0 and 100',
          { defaultTaxRate: ['Default tax rate must be between 0 and 100'] },
          422
        );
      }
    }

    if (settingsData.email !== undefined && settingsData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settingsData.email)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid email format',
        { email: ['Invalid email format'] },
        422
      );
    }

    if (settingsData.invoicePrefix !== undefined) {
      if (!settingsData.invoicePrefix || settingsData.invoicePrefix.trim().length === 0 || settingsData.invoicePrefix.length > 20) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'Invoice prefix must be between 1 and 20 characters',
          { invoicePrefix: ['Invoice prefix must be between 1 and 20 characters'] },
          422
        );
      }
    }

    if (settingsData.quotationPrefix !== undefined) {
      if (!settingsData.quotationPrefix || settingsData.quotationPrefix.trim().length === 0 || settingsData.quotationPrefix.length > 20) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'Quotation prefix must be between 1 and 20 characters',
          { quotationPrefix: ['Quotation prefix must be between 1 and 20 characters'] },
          422
        );
      }
    }

    const updatedSettings = await updateSettings(userId, settingsData);

    // Transform to camelCase
    const transformed = toCamelCase(updatedSettings);

    return successResponse(
      res,
      {
        settings: transformed,
      },
      'Settings updated successfully',
      200
    );
  } catch (error) {
    console.error('Update settings error:', error);
    throw error;
  }
};

/**
 * Upload company logo
 * POST /api/v1/settings/logo
 */
export const uploadLogo = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (!req.file) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Logo file is required',
        { logo: ['Logo file is required'] },
        422
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid file type. Only JPEG, PNG, and GIF are allowed',
        { logo: ['Invalid file type'] },
        422
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (req.file.size > maxSize) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'File size exceeds 5MB limit',
        { logo: ['File size must be <= 5MB'] },
        422
      );
    }

    // Generate file URL (in production, upload to cloud storage)
    // For now, use local path
    const logoUrl = `/uploads/logos/${req.file.filename}`;

    // Update settings with logo URL
    const updatedSettings = await updateSettings(userId, { logoUrl });

    // Transform to camelCase
    const transformed = toCamelCase(updatedSettings);

    return successResponse(
      res,
      {
        logoUrl: transformed.logoUrl,
      },
      'Logo uploaded successfully',
      200
    );
  } catch (error) {
    console.error('Upload logo error:', error);
    throw error;
  }
};


