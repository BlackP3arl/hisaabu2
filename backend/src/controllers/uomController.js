import {
  getUoms,
  getUomById,
  createUom,
  updateUom,
  deleteUom,
  getUomByCode,
} from '../queries/uoms.js';
import { successResponse, errorResponse, toCamelCase, toCamelCaseArray } from '../utils/response.js';

/**
 * Get list of UOMs
 * GET /api/v1/uoms
 */
export const listUoms = async (req, res) => {
  try {
    const uoms = await getUoms();

    return successResponse(
      res,
      {
        uoms: toCamelCaseArray(uoms),
      },
      null,
      200
    );
  } catch (error) {
    console.error('List UOMs error:', error);
    throw error;
  }
};

/**
 * Get UOM by ID
 * GET /api/v1/uoms/:id
 */
export const getUom = async (req, res) => {
  try {
    const uomId = parseInt(req.params.id);

    if (isNaN(uomId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid UOM ID',
        null,
        400
      );
    }

    const uom = await getUomById(uomId);

    if (!uom) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'UOM not found',
        null,
        404
      );
    }

    return successResponse(
      res,
      {
        uom: toCamelCase(uom),
      },
      null,
      200
    );
  } catch (error) {
    console.error('Get UOM error:', error);
    throw error;
  }
};

/**
 * Create new UOM
 * POST /api/v1/uoms
 */
export const create = async (req, res) => {
  try {
    const { name, code } = req.body;

    // Validation
    if (!name || name.trim().length < 1 || name.trim().length > 255) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Name is required and must be between 1 and 255 characters',
        { name: ['Name is required and must be between 1 and 255 characters'] },
        422
      );
    }

    if (!code || code.trim().length < 1 || code.trim().length > 50) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Code is required and must be between 1 and 50 characters',
        { code: ['Code is required and must be between 1 and 50 characters'] },
        422
      );
    }

    // Check if code already exists
    const existingUom = await getUomByCode(code.trim().toUpperCase());
    if (existingUom) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'UOM code already exists',
        { code: ['UOM code must be unique'] },
        422
      );
    }

    // Create UOM
    const uom = await createUom({
      name: name.trim(),
      code: code.trim().toUpperCase(),
    });

    return successResponse(
      res,
      {
        uom: toCamelCase(uom),
      },
      'UOM created successfully',
      201
    );
  } catch (error) {
    console.error('Create UOM error:', error);
    // Handle unique constraint violation
    if (error.code === '23505') {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'UOM code already exists',
        { code: ['UOM code must be unique'] },
        422
      );
    }
    throw error;
  }
};

/**
 * Update UOM
 * PUT /api/v1/uoms/:id
 */
export const update = async (req, res) => {
  try {
    const uomId = parseInt(req.params.id);

    if (isNaN(uomId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid UOM ID',
        null,
        400
      );
    }

    // Check if UOM exists
    const existingUom = await getUomById(uomId);
    if (!existingUom) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'UOM not found',
        null,
        404
      );
    }

    const { name, code } = req.body;

    // Validation
    if (name !== undefined && (name.trim().length < 1 || name.trim().length > 255)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Name must be between 1 and 255 characters',
        { name: ['Name must be between 1 and 255 characters'] },
        422
      );
    }

    if (code !== undefined && (code.trim().length < 1 || code.trim().length > 50)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Code must be between 1 and 50 characters',
        { code: ['Code must be between 1 and 50 characters'] },
        422
      );
    }

    // Check if code already exists (if being updated)
    if (code !== undefined) {
      const codeUom = await getUomByCode(code.trim().toUpperCase());
      if (codeUom && codeUom.id !== uomId) {
        return errorResponse(
          res,
          'VALIDATION_ERROR',
          'UOM code already exists',
          { code: ['UOM code must be unique'] },
          422
        );
      }
    }

    // Update UOM
    const updatedUom = await updateUom(uomId, {
      name: name?.trim(),
      code: code?.trim().toUpperCase(),
    });

    if (!updatedUom) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'UOM not found',
        null,
        404
      );
    }

    return successResponse(
      res,
      {
        uom: toCamelCase(updatedUom),
      },
      'UOM updated successfully',
      200
    );
  } catch (error) {
    console.error('Update UOM error:', error);
    // Handle unique constraint violation
    if (error.code === '23505') {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'UOM code already exists',
        { code: ['UOM code must be unique'] },
        422
      );
    }
    throw error;
  }
};

/**
 * Delete UOM
 * DELETE /api/v1/uoms/:id
 */
export const remove = async (req, res) => {
  try {
    const uomId = parseInt(req.params.id);

    if (isNaN(uomId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid UOM ID',
        null,
        400
      );
    }

    // Check if UOM exists
    const existingUom = await getUomById(uomId);
    if (!existingUom) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'UOM not found',
        null,
        404
      );
    }

    // Prevent deletion of default UOM (Pieces/PC with ID 1)
    if (uomId === 1) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Cannot delete the default UOM (Pieces)',
        null,
        422
      );
    }

    await deleteUom(uomId);

    return successResponse(
      res,
      null,
      'UOM deleted successfully',
      200
    );
  } catch (error) {
    console.error('Delete UOM error:', error);
    throw error;
  }
};

