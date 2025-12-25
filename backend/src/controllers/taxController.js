import { 
  getTaxes, 
  getTax, 
  createTax, 
  updateTax, 
  deleteTax,
  initializeDefaultGST 
} from '../queries/taxes.js';
import { successResponse, errorResponse, toCamelCase } from '../utils/response.js';

/**
 * Get all taxes for the authenticated user
 * GET /api/v1/taxes
 */
export const getAllTaxes = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taxes = await getTaxes(userId);
    const transformed = taxes.map(tax => toCamelCase(tax));
    
    return successResponse(
      res,
      { taxes: transformed },
      null,
      200
    );
  } catch (error) {
    console.error('Get taxes error:', error);
    throw error;
  }
};

/**
 * Get a single tax by ID
 * GET /api/v1/taxes/:id
 */
export const getTaxById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taxId = parseInt(req.params.id);
    
    if (isNaN(taxId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid tax ID',
        { id: ['Tax ID must be a valid number'] },
        400
      );
    }
    
    const tax = await getTax(taxId, userId);
    
    if (!tax) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Tax not found',
        null,
        404
      );
    }
    
    return successResponse(
      res,
      { tax: toCamelCase(tax) },
      null,
      200
    );
  } catch (error) {
    console.error('Get tax error:', error);
    throw error;
  }
};

/**
 * Create a new tax
 * POST /api/v1/taxes
 */
export const create = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, rate, isDefault } = req.body;
    
    // Validation
    if (!name || name.trim().length === 0) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Tax name is required',
        { name: ['Tax name is required'] },
        422
      );
    }
    
    if (name.length > 100) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Tax name must be 100 characters or less',
        { name: ['Tax name must be 100 characters or less'] },
        422
      );
    }
    
    if (rate === undefined || rate === null) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Tax rate is required',
        { rate: ['Tax rate is required'] },
        422
      );
    }
    
    const taxRate = parseFloat(rate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Tax rate must be between 0 and 100',
        { rate: ['Tax rate must be between 0 and 100'] },
        422
      );
    }
    
    const tax = await createTax(userId, {
      name: name.trim(),
      rate: taxRate,
      isDefault: isDefault || false
    });
    
    return successResponse(
      res,
      { tax: toCamelCase(tax) },
      'Tax created successfully',
      201
    );
  } catch (error) {
    console.error('Create tax error:', error);
    // If it's a database constraint error, provide a more user-friendly message
    if (error.code === '23505') { // Unique violation
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'A default tax already exists. Please unset the existing default tax first.',
        { isDefault: ['A default tax already exists'] },
        422
      );
    }
    throw error;
  }
};

/**
 * Update a tax
 * PUT /api/v1/taxes/:id
 */
export const update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taxId = parseInt(req.params.id);
    const { name, rate, isDefault } = req.body;
    
    if (isNaN(taxId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid tax ID',
        { id: ['Tax ID must be a valid number'] },
        400
      );
    }
    
    // Check if tax exists
    const existingTax = await getTax(taxId, userId);
    if (!existingTax) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Tax not found',
        null,
        404
      );
    }
    
    // Validation
    if (name !== undefined) {
      if (!name || name.trim().length === 0) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'Tax name cannot be empty',
          { name: ['Tax name cannot be empty'] },
          422
        );
      }
      if (name.length > 100) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'Tax name must be 100 characters or less',
          { name: ['Tax name must be 100 characters or less'] },
          422
        );
      }
    }
    
    if (rate !== undefined) {
      const taxRate = parseFloat(rate);
      if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'Tax rate must be between 0 and 100',
          { rate: ['Tax rate must be between 0 and 100'] },
          422
        );
      }
    }
    
    const tax = await updateTax(taxId, userId, {
      name: name !== undefined ? name.trim() : undefined,
      rate: rate !== undefined ? parseFloat(rate) : undefined,
      isDefault
    });
    
    if (!tax) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Tax not found',
        null,
        404
      );
    }
    
    return successResponse(
      res,
      { tax: toCamelCase(tax) },
      'Tax updated successfully',
      200
    );
  } catch (error) {
    console.error('Update tax error:', error);
    throw error;
  }
};

/**
 * Delete a tax
 * DELETE /api/v1/taxes/:id
 */
export const remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const taxId = parseInt(req.params.id);
    
    if (isNaN(taxId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid tax ID',
        { id: ['Tax ID must be a valid number'] },
        400
      );
    }
    
    const tax = await deleteTax(taxId, userId);
    
    if (!tax) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Tax not found',
        null,
        404
      );
    }
    
    return successResponse(
      res,
      { tax: toCamelCase(tax) },
      'Tax deleted successfully',
      200
    );
  } catch (error) {
    console.error('Delete tax error:', error);
    throw error;
  }
};

/**
 * Initialize default GST tax
 * POST /api/v1/taxes/initialize-gst
 */
export const initializeGST = async (req, res) => {
  try {
    const userId = req.user.userId;
    const gstTax = await initializeDefaultGST(userId);
    
    if (gstTax) {
      return successResponse(
        res,
        { tax: toCamelCase(gstTax) },
        'Default GST tax initialized',
        201
      );
    } else {
      return successResponse(
        res,
        { message: 'Taxes already exist' },
        'No initialization needed',
        200
      );
    }
  } catch (error) {
    console.error('Initialize GST error:', error);
    throw error;
  }
};

