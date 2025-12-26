import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../queries/categories.js';
import { successResponse, errorResponse, toCamelCase, toCamelCaseArray } from '../utils/response.js';
import { isValidHexColor } from '../utils/validators.js';

/**
 * Get list of categories
 * GET /api/v1/categories
 */
export const listCategories = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search || '',
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc',
    };

    const result = await getCategories(userId, filters);

    return successResponse(
      res,
      {
        categories: toCamelCaseArray(result.categories),
        pagination: result.pagination,
      },
      null,
      200
    );
  } catch (error) {
    console.error('List categories error:', error);
    throw error;
  }
};

/**
 * Get category by ID
 * GET /api/v1/categories/:id
 */
export const getCategory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const categoryId = parseInt(req.params.id);

    if (isNaN(categoryId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid category ID',
        null,
        400
      );
    }

    const category = await getCategoryById(userId, categoryId);

    if (!category) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Category not found',
        null,
        404
      );
    }

    return successResponse(
      res,
      {
        category: toCamelCase(category),
      },
      null,
      200
    );
  } catch (error) {
    console.error('Get category error:', error);
    throw error;
  }
};

/**
 * Create new category
 * POST /api/v1/categories
 */
export const create = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, color } = req.body;

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

    if (!color || !isValidHexColor(color)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Valid hex color is required (e.g., #3B82F6)',
        { color: ['Valid hex color is required'] },
        422
      );
    }

    // Create category
    const category = await createCategory(userId, {
      name: name.trim(),
      description: description?.trim() || null,
      color: color.trim(),
    });

    return successResponse(
      res,
      {
        category: toCamelCase(category),
      },
      'Category created successfully',
      201
    );
  } catch (error) {
    console.error('Create category error:', error);
    throw error;
  }
};

/**
 * Update category
 * PUT /api/v1/categories/:id
 */
export const update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const categoryId = parseInt(req.params.id);

    if (isNaN(categoryId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid category ID',
        null,
        400
      );
    }

    // Check if category exists
    const existingCategory = await getCategoryById(userId, categoryId);
    if (!existingCategory) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Category not found',
        null,
        404
      );
    }

    const { name, description, color } = req.body;

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

    if (color !== undefined && !isValidHexColor(color)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Valid hex color is required (e.g., #3B82F6)',
        { color: ['Valid hex color is required'] },
        422
      );
    }

    // Update category
    const updatedCategory = await updateCategory(userId, categoryId, {
      name: name?.trim(),
      description: description?.trim(),
      color: color?.trim(),
    });

    if (!updatedCategory) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Category not found',
        null,
        404
      );
    }

    return successResponse(
      res,
      {
        category: toCamelCase(updatedCategory),
      },
      'Category updated successfully',
      200
    );
  } catch (error) {
    console.error('Update category error:', error);
    throw error;
  }
};

/**
 * Delete category
 * DELETE /api/v1/categories/:id
 */
export const remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const categoryId = parseInt(req.params.id);

    if (isNaN(categoryId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid category ID',
        null,
        400
      );
    }

    // Check if category exists
    const existingCategory = await getCategoryById(userId, categoryId);
    if (!existingCategory) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Category not found',
        null,
        404
      );
    }

    await deleteCategory(userId, categoryId);

    return successResponse(
      res,
      null,
      'Category deleted successfully',
      200
    );
  } catch (error) {
    console.error('Delete category error:', error);
    throw error;
  }
};



