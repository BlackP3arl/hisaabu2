import {
  getClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  clientEmailExists,
} from '../queries/clients.js';
import { successResponse, errorResponse, toCamelCase, toCamelCaseArray } from '../utils/response.js';
import { isValidEmail, isValidClientStatus } from '../utils/validators.js';

/**
 * Get list of clients
 * GET /api/v1/clients
 */
export const listClients = async (req, res) => {
  try {
    const userId = req.user.userId;
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      search: req.query.search || '',
      status: req.query.status || 'all',
      sort: req.query.sort || 'created_at',
      order: req.query.order || 'desc',
    };

    const result = await getClients(userId, filters);

    return successResponse(
      res,
      {
        clients: toCamelCaseArray(result.clients),
        pagination: result.pagination,
      },
      null,
      200
    );
  } catch (error) {
    console.error('List clients error:', error);
    throw error;
  }
};

/**
 * Get client by ID
 * GET /api/v1/clients/:id
 */
export const getClient = async (req, res) => {
  try {
    const userId = req.user.userId;
    const clientId = parseInt(req.params.id);

    if (isNaN(clientId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid client ID',
        null,
        400
      );
    }

    const client = await getClientById(userId, clientId);

    if (!client) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Client not found',
        null,
        404
      );
    }

    return successResponse(
      res,
      {
        client: toCamelCase(client),
      },
      null,
      200
    );
  } catch (error) {
    console.error('Get client error:', error);
    throw error;
  }
};

/**
 * Create new client
 * POST /api/v1/clients
 */
export const create = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      companyName,
      taxId,
      status = 'active',
      notes,
    } = req.body;

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

    if (!email || !isValidEmail(email)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Valid email is required',
        { email: ['Valid email is required'] },
        422
      );
    }

    if (status && !isValidClientStatus(status)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid status value',
        { status: ['Status must be one of: active, inactive, new, overdue'] },
        422
      );
    }

    // Check if email already exists for this user
    const emailExists = await clientEmailExists(userId, email.trim().toLowerCase());
    if (emailExists) {
      return errorResponse(
        res,
        'CONFLICT',
        'Email already exists',
        { email: ['Email already exists'] },
        409
      );
    }

    // Create client
    const client = await createClient(userId, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone,
      address,
      city,
      postalCode,
      country,
      companyName,
      taxId,
      status,
      notes,
    });

    // Get full client with financial summary
    const fullClient = await getClientById(userId, client.id);

    return successResponse(
      res,
      {
        client: toCamelCase(fullClient),
      },
      'Client created successfully',
      201
    );
  } catch (error) {
    console.error('Create client error:', error);
    throw error;
  }
};

/**
 * Update client
 * PUT /api/v1/clients/:id
 */
export const update = async (req, res) => {
  try {
    const userId = req.user.userId;
    const clientId = parseInt(req.params.id);

    if (isNaN(clientId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid client ID',
        null,
        400
      );
    }

    // Check if client exists
    const existingClient = await getClientById(userId, clientId);
    if (!existingClient) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Client not found',
        null,
        404
      );
    }

    const {
      name,
      email,
      phone,
      address,
      city,
      postalCode,
      country,
      companyName,
      taxId,
      status,
      notes,
    } = req.body;

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

    if (email !== undefined && !isValidEmail(email)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Valid email is required',
        { email: ['Valid email is required'] },
        422
      );
    }

    if (status !== undefined && !isValidClientStatus(status)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid status value',
        { status: ['Status must be one of: active, inactive, new, overdue'] },
        422
      );
    }

    // Check email uniqueness if email is being updated
    if (email) {
      const emailExists = await clientEmailExists(userId, email.trim().toLowerCase(), clientId);
      if (emailExists) {
        return errorResponse(
          res,
          'CONFLICT',
          'Email already exists',
          { email: ['Email already exists'] },
          409
        );
      }
    }

    // Update client
    const updatedClient = await updateClient(userId, clientId, {
      name: name?.trim(),
      email: email?.trim().toLowerCase(),
      phone,
      address,
      city,
      postalCode,
      country,
      companyName,
      taxId,
      status,
      notes,
    });

    if (!updatedClient) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Client not found',
        null,
        404
      );
    }

    // Get full client with financial summary
    const fullClient = await getClientById(userId, clientId);

    return successResponse(
      res,
      {
        client: toCamelCase(fullClient),
      },
      'Client updated successfully',
      200
    );
  } catch (error) {
    console.error('Update client error:', error);
    throw error;
  }
};

/**
 * Delete client
 * DELETE /api/v1/clients/:id
 */
export const remove = async (req, res) => {
  try {
    const userId = req.user.userId;
    const clientId = parseInt(req.params.id);

    if (isNaN(clientId)) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Invalid client ID',
        null,
        400
      );
    }

    // Check if client exists
    const existingClient = await getClientById(userId, clientId);
    if (!existingClient) {
      return errorResponse(
        res,
        'NOT_FOUND',
        'Client not found',
        null,
        404
      );
    }

    try {
      await deleteClient(userId, clientId);
    } catch (error) {
      if (error.message === 'CLIENT_HAS_ASSOCIATIONS') {
        return errorResponse(
          res,
          'CONFLICT',
          'Client has associated invoices or quotations',
          null,
          409
        );
      }
      throw error;
    }

    return successResponse(
      res,
      null,
      'Client deleted successfully',
      200
    );
  } catch (error) {
    console.error('Delete client error:', error);
    throw error;
  }
};



