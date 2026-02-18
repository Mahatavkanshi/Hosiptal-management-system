import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth';
import { query } from '../config/database';
import { AppError, asyncHandler } from '../middleware/errorHandler';

const router = Router();

// Get all medicines (public)
router.get('/', asyncHandler(async (req, res) => {
  const { search, category, low_stock, page = 1, limit = 20 } = req.query;
  
  let sql = `
    SELECT *, 
           CASE 
             WHEN stock_quantity <= reorder_level THEN true 
             ELSE false 
           END as is_low_stock,
           CASE 
             WHEN expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN true 
             ELSE false 
           END as is_expiring_soon
    FROM medicines
    WHERE 1=1
  `;
  const params: any[] = [];
  let paramIndex = 1;
  
  if (search) {
    sql += ` AND (name ILIKE $${paramIndex} OR generic_name ILIKE $${paramIndex} OR manufacturer ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }
  
  if (category) {
    sql += ` AND category = $${paramIndex}`;
    params.push(category);
    paramIndex++;
  }
  
  if (low_stock === 'true') {
    sql += ` AND stock_quantity <= reorder_level`;
  }
  
  sql += ` ORDER BY name ASC`;
  
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
  sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);
  
  const result = await query(sql, params);
  
  res.json({
    success: true,
    data: result.rows
  });
}));

// Get medicine by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const result = await query('SELECT * FROM medicines WHERE id = $1', [id]);
  
  if (result.rows.length === 0) {
    throw new AppError('Medicine not found', 404);
  }
  
  res.json({
    success: true,
    data: result.rows[0]
  });
}));

// Get medicine categories
router.get('/categories/all', asyncHandler(async (req, res) => {
  const result = await query('SELECT DISTINCT category FROM medicines WHERE category IS NOT NULL ORDER BY category');
  
  res.json({
    success: true,
    data: result.rows.map(row => row.category)
  });
}));

// Create medicine (pharmacist, admin)
router.post('/',
  authenticate,
  authorize('pharmacist', 'admin'),
  [
    body('name').notEmpty().withMessage('Medicine name is required'),
    body('unit_price').isDecimal().withMessage('Valid unit price is required')
  ],
  asyncHandler(async (req, res) => {
    const {
      name, generic_name, manufacturer, category, description,
      dosage_form, strength, stock_quantity, unit_price, cost_price,
      expiry_date, batch_number, reorder_level, storage_conditions
    } = req.body;
    
    const result = await query(
      `INSERT INTO medicines (name, generic_name, manufacturer, category, description,
       dosage_form, strength, stock_quantity, unit_price, cost_price,
       expiry_date, batch_number, reorder_level, storage_conditions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [name, generic_name, manufacturer, category, description,
       dosage_form, strength, stock_quantity || 0, unit_price, cost_price || unit_price,
       expiry_date, batch_number, reorder_level || 10, storage_conditions]
    );
    
    res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      data: result.rows[0]
    });
  })
);

// Update medicine stock (pharmacist, admin)
router.put('/:id/stock',
  authenticate,
  authorize('pharmacist', 'admin'),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { stock_quantity, operation = 'set' } = req.body;
    
    let updateQuery;
    if (operation === 'add') {
      updateQuery = `UPDATE medicines SET stock_quantity = stock_quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`;
    } else if (operation === 'subtract') {
      updateQuery = `UPDATE medicines SET stock_quantity = GREATEST(0, stock_quantity - $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`;
    } else {
      updateQuery = `UPDATE medicines SET stock_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`;
    }
    
    const result = await query(updateQuery, [stock_quantity, id]);
    
    if (result.rows.length === 0) {
      throw new AppError('Medicine not found', 404);
    }
    
    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: result.rows[0]
    });
  })
);

// Get low stock medicines (pharmacist, admin)
router.get('/inventory/low-stock',
  authenticate,
  authorize('pharmacist', 'admin'),
  asyncHandler(async (req, res) => {
    const result = await query(`
      SELECT *, 
             (reorder_level - stock_quantity) as shortage
      FROM medicines
      WHERE stock_quantity <= reorder_level
      ORDER BY (reorder_level - stock_quantity) DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  })
);

// Get expiring medicines (pharmacist, admin)
router.get('/inventory/expiring',
  authenticate,
  authorize('pharmacist', 'admin'),
  asyncHandler(async (req, res) => {
    const { days = 30 } = req.query;
    
    const result = await query(`
      SELECT *
      FROM medicines
      WHERE expiry_date <= CURRENT_DATE + INTERVAL '${days} days'
        AND expiry_date >= CURRENT_DATE
      ORDER BY expiry_date ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  })
);

// Get inventory statistics
router.get('/inventory/stats',
  authenticate,
  authorize('pharmacist', 'admin'),
  asyncHandler(async (req, res) => {
    const result = await query(`
      SELECT 
        COUNT(*) as total_medicines,
        COUNT(*) FILTER (WHERE stock_quantity = 0) as out_of_stock,
        COUNT(*) FILTER (WHERE stock_quantity <= reorder_level AND stock_quantity > 0) as low_stock,
        COUNT(*) FILTER (WHERE expiry_date <= CURRENT_DATE + INTERVAL '30 days') as expiring_soon,
        SUM(stock_quantity * unit_price) as total_inventory_value
      FROM medicines
    `);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  })
);

export default router;
