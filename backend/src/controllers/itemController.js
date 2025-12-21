import {
  getItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  verifyCategoryOwnership,
} from '../queries/items.js';
import { successResponse, errorResponse, toCamelCase, toCamelCaseArray } from '../utils/response.js';
import { isValidItemStatus } from '../utils/validators.js';

/**
 * Get list of items
 * GET /api/v1/items
 */
export const listItems = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search || '',
      categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : null,
      status: req.query.status || 'all',
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc',
    };

    const result = await getItems(userId, filters);

    // Transform items to include category info in camelCase
    const transformedItems = result.items.map(item => {
      const transformed = toCamelCase(item);
      if (item.category_name) {
        transformed.categoryName = item.category_name;
        transformed.categoryColor = item.category_color;
      }
      return transformed;
    });

    return successResponse(
      res,
      {
        items: transformedItems,
        pagination: result.pagination,
      },
      null,
      200
    );
  } catch (error) {
    console.error('List items error:', error);
    throw error;
  }
};

/**
 * Get item by ID
 * GET /api/v1/items/:id
 */
export const getItem = async (req, res) => {
  try {
    const userId = req.user.userId;
    const itemId = parseInt(req.params.id);

    if (isNaN(itemId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid item ID',
        null,
        400
      );
    }

    const item = await getItemById(userId, itemId);

    if (!item) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Item not found',
        null,
        404
      );
    }

    // Transform to include category info
    const transformed = toCamelCase(item);
    if (item.category_name) {
      transformed.categoryName = item.category_name;
      transformed.categoryColor = item.category_color;
    }

    return successResponse(
      res,
      {
        item: transformed,
      },
      null,
      200
    );
  } catch (error) {
    console.error('Get item error:', error);
    throw error;
  }
};

/**
 * Create new item
 * POST /api/v1/items
 */
export const create = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, description, rate, categoryId, status = 'active', gstApplicable = true } = req.body;

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

    // Rate is now optional (nullable) for multi-currency support
    // Prices are entered at document level
    if (rate !== undefined && rate !== null && (isNaN(rate) || rate < 0)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Rate must be >= 0 if provided',
        { rate: ['Rate must be >= 0 if provided'] },
        422
      );
    }

    if (status && !isValidItemStatus(status)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid status value',
        { status: ['Status must be one of: active, inactive'] },
        422
      );
    }

    // Verify category ownership if categoryId is provided
    if (categoryId) {
      const categoryExists = await verifyCategoryOwnership(userId, categoryId);
      if (!categoryExists) {
        return errorResponse(
          res,
          'NOT_FOUND',
          'Category not found',
          null,
          404
        );
      }
    }

    // Create item
    const item = await createItem(userId, {
      name: name.trim(),
      description: description?.trim() || null,
      rate: parseFloat(rate),
      categoryId: categoryId || null,
      status,
      gstApplicable: gstApplicable !== false, // Default to true if not explicitly false
    });

    // Get full item with category info
    const fullItem = await getItemById(userId, item.id);
    const transformed = toCamelCase(fullItem);
    if (fullItem.category_name) {
      transformed.categoryName = fullItem.category_name;
      transformed.categoryColor = fullItem.category_color;
    }

    return successResponse(
      res,
      {
        item: transformed,
      },
      'Item created successfully',
      201
    );
  } catch (error) {
    console.error('Create item error:', error);
    throw error;
  }
};

/**
 * Update item
 * PUT /api/v1/items/:id
 */
export const update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const itemId = parseInt(req.params.id);

    if (isNaN(itemId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid item ID',
        null,
        400
      );
    }

    // Check if item exists
    const existingItem = await getItemById(userId, itemId);
    if (!existingItem) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Item not found',
        null,
        404
      );
    }

    const { name, description, rate, categoryId, status, gstApplicable } = req.body;

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

    if (rate !== undefined && (isNaN(rate) || rate < 0)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Rate must be >= 0',
        { rate: ['Rate must be >= 0'] },
        422
      );
    }

    if (status !== undefined && !isValidItemStatus(status)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid status value',
        { status: ['Status must be one of: active, inactive'] },
        422
      );
    }

    // Verify category ownership if categoryId is being updated
    if (categoryId !== undefined && categoryId !== null) {
      const categoryExists = await verifyCategoryOwnership(userId, categoryId);
      if (!categoryExists) {
        return errorResponse(
          res,
          'NOT_FOUND',
          'Category not found',
          null,
          404
        );
      }
    }

    // Update item
    const updatedItem = await updateItem(userId, itemId, {
      name: name?.trim(),
      description: description?.trim(),
      rate: rate !== undefined ? parseFloat(rate) : undefined,
      categoryId: categoryId !== undefined ? (categoryId || null) : undefined,
      status,
      gstApplicable,
    });

    if (!updatedItem) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Item not found',
        null,
        404
      );
    }

    // Get full item with category info
    const fullItem = await getItemById(userId, itemId);
    const transformed = toCamelCase(fullItem);
    if (fullItem.category_name) {
      transformed.categoryName = fullItem.category_name;
      transformed.categoryColor = fullItem.category_color;
    }

    return successResponse(
      res,
      {
        item: transformed,
      },
      'Item updated successfully',
      200
    );
  } catch (error) {
    console.error('Update item error:', error);
    throw error;
  }
};

/**
 * Delete item
 * DELETE /api/v1/items/:id
 */
export const remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const itemId = parseInt(req.params.id);

    if (isNaN(itemId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid item ID',
        null,
        400
      );
    }

    // Check if item exists
    const existingItem = await getItemById(userId, itemId);
    if (!existingItem) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Item not found',
        null,
        404
      );
    }

    await deleteItem(userId, itemId);

    return successResponse(
      res,
      null,
      'Item deleted successfully',
      200
    );
  } catch (error) {
    console.error('Delete item error:', error);
    throw error;
  }
};


