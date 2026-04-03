const express = require('express');
const router = express.Router();
const { pool } = require('../db');



// GET /spots - Get all spots
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        s.spot_id,
        s.spot_name,
        s.spot_type,
        s.short_description,
        s.address,
        s.latitude,
        s.longitude,
        s.status,
        s.created_at,
        s.last_modified,
        u.display_name as creator_name
      FROM spots s
      JOIN users u ON s.user_id = u.user_id
      ORDER BY s.created_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Error fetching spots:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch spots'
    });
  }
});

// GET /spots/:id - Get a single spot by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.execute(`
      SELECT
        s.spot_id,
        s.spot_name,
        s.spot_type,
        s.short_description,
        s.address,
        s.latitude,
        s.longitude,
        s.status,
        s.created_at,
        s.last_modified,
        u.display_name as creator_name
      FROM spots s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.spot_id = ?
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Spot not found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching spot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch spot'
    });
  }
});

// POST /spots - Create a new spot
router.post('/', async (req, res) => {
  try {
    const {
      spot_name,
      spot_type,
      short_description,
      address,
      latitude,
      longitude,
      status = 'active'
    } = req.body;

    // Validate required fields
    if (!spot_name || !spot_type) {
      return res.status(400).json({
        success: false,
        error: 'spot_name and spot_type are required'
      });
    }

    // For now, use a default user_id (you should implement authentication later)
    const user_id = 1; // Default user - replace with actual authenticated user

    const [result] = await pool.execute(`
      INSERT INTO spots (
        spot_name,
        spot_type,
        short_description,
        address,
        latitude,
        longitude,
        user_id,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      spot_name,
      spot_type,
      short_description || null,
      address || null,
      latitude || null,
      longitude || null,
      user_id,
      status
    ]);

    res.status(201).json({
      success: true,
      message: 'Spot created successfully',
      data: {
        spot_id: result.insertId,
        spot_name,
        spot_type,
        short_description,
        address,
        latitude,
        longitude,
        status
      }
    });
  } catch (error) {
    console.error('Error creating spot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create spot'
    });
  }
});

// PUT /spots/:id - Update a spot
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      spot_name,
      spot_type,
      short_description,
      address,
      latitude,
      longitude,
      status
    } = req.body;

    // Check if spot exists
    const [existing] = await pool.execute(
      'SELECT spot_id FROM spots WHERE spot_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Spot not found'
      });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];

    if (spot_name !== undefined) {
      updates.push('spot_name = ?');
      values.push(spot_name);
    }
    if (spot_type !== undefined) {
      updates.push('spot_type = ?');
      values.push(spot_type);
    }
    if (short_description !== undefined) {
      updates.push('short_description = ?');
      values.push(short_description);
    }
    if (address !== undefined) {
      updates.push('address = ?');
      values.push(address);
    }
    if (latitude !== undefined) {
      updates.push('latitude = ?');
      values.push(latitude);
    }
    if (longitude !== undefined) {
      updates.push('longitude = ?');
      values.push(longitude);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    updates.push('last_modified = CURRENT_TIMESTAMP');
    values.push(id);

    const [result] = await pool.execute(`
      UPDATE spots
      SET ${updates.join(', ')}
      WHERE spot_id = ?
    `, values);

    res.json({
      success: true,
      message: 'Spot updated successfully',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error updating spot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update spot'
    });
  }
});

// DELETE /spots/:id - Delete a spot
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if spot exists
    const [existing] = await pool.execute(
      'SELECT spot_id FROM spots WHERE spot_id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Spot not found'
      });
    }

    const [result] = await pool.execute(
      'DELETE FROM spots WHERE spot_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Spot deleted successfully',
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Error deleting spot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete spot'
    });
  }
});

module.exports = router;