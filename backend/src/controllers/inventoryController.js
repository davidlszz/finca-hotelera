const { Op } = require('sequelize');
const { InventoryCategory, InventoryProduct, InventoryMovement, sequelize } = require('../models');

// ── Categorías ────────────────────────────────────────────────────
exports.getCategories = async (_req, res) => {
  try {
    const cats = await InventoryCategory.findAll({ order: [['nombre', 'ASC']] });
    res.json(cats);
  } catch { res.status(500).json({ error: 'Error al obtener categorías.' }); }
};

exports.createCategory = async (req, res) => {
  try {
    const cat = await InventoryCategory.create(req.body);
    res.status(201).json(cat);
  } catch { res.status(500).json({ error: 'Error al crear categoría.' }); }
};

// ── Productos ─────────────────────────────────────────────────────
exports.getProducts = async (req, res) => {
  try {
    const { stock_bajo } = req.query;
    const where = { activo: true };
    if (stock_bajo === 'true') {
      where[Op.and] = [{ stock_actual: { [Op.lte]: sequelize.col('stock_minimo') } }];
    }
    const products = await InventoryProduct.findAll({
      where,
      include: [{ model: InventoryCategory, as: 'categoria' }],
      order: [['nombre', 'ASC']],
    });
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos.' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const product = await InventoryProduct.create(req.body);
    res.status(201).json(product);
  } catch { res.status(500).json({ error: 'Error al crear producto.' }); }
};

exports.updateProduct = async (req, res) => {
  try {
    const product = await InventoryProduct.findByPk(req.params.id);
    if (!product) return res.status(404).json({ error: 'Producto no encontrado.' });
    await product.update(req.body);
    res.json(product);
  } catch { res.status(500).json({ error: 'Error al actualizar producto.' }); }
};

// ── Movimientos (Entrada / Salida) ────────────────────────────────
exports.registerMovement = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { producto_id, tipo, cantidad, motivo } = req.body;
    const product = await InventoryProduct.findByPk(producto_id, { transaction: t });
    if (!product) { await t.rollback(); return res.status(404).json({ error: 'Producto no encontrado.' }); }

    const cant = parseFloat(cantidad);
    if (tipo === 'Salida' && product.stock_actual < cant) {
      await t.rollback();
      return res.status(400).json({ error: 'Stock insuficiente para realizar la salida.' });
    }

    const stock_anterior = parseFloat(product.stock_actual);
    const stock_posterior = tipo === 'Entrada' ? stock_anterior + cant : stock_anterior - cant;

    await InventoryMovement.create(
      { producto_id, usuario_id: req.user.id, tipo, cantidad: cant, motivo, stock_anterior, stock_posterior },
      { transaction: t }
    );
    await product.update({ stock_actual: stock_posterior }, { transaction: t });
    await t.commit();

    res.status(201).json({ message: `${tipo} registrada.`, stock_actual: stock_posterior });
  } catch (err) {
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al registrar movimiento.' });
  }
};

exports.getMovements = async (req, res) => {
  try {
    const { producto_id } = req.query;
    const where = producto_id ? { producto_id } : {};
    const movements = await InventoryMovement.findAll({
      where,
      include: [
        { model: InventoryProduct, as: 'producto', attributes: ['nombre'] },
        { model: require('../models').User, as: 'usuario', attributes: ['nombre'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: 100,
    });
    res.json(movements);
  } catch { res.status(500).json({ error: 'Error al obtener movimientos.' }); }
};

// ── Alertas de stock mínimo (Dashboard) ──────────────────────────
exports.getLowStockAlerts = async (_req, res) => {
  try {
    const products = await InventoryProduct.findAll({
      include: [{ model: InventoryCategory, as: 'categoria' }],
      order: [['stock_actual', 'ASC']],
    });
    // Filtrar en JS para compatibilidad con SQLite (col comparison)
    const alerts = products.filter(p => parseFloat(p.stock_actual) <= parseFloat(p.stock_minimo));
    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener alertas.' });
  }
};
