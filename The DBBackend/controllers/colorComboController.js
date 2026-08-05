const ColorCombo = require('../models/ColorCombo');

exports.getColorCombos = async (req, res) => {
    try {
        const combos = await ColorCombo.getAll();
        res.json(combos);
    } catch (error) {
        console.error('❌ Error fetching color combos:', error.message);
        res.status(500).json({ error: 'Failed to fetch color combos', details: error.message });
    }
};

exports.createColorCombo = async (req, res) => {
    try {
        const { title, colors } = req.body;
        if (!title || !colors) {
            return res.status(400).json({ error: 'Title and colors are required' });
        }
        const result = await ColorCombo.create({ title, colors });
        res.status(201).json({ success: true, message: 'Color combo created successfully', data: result });
    } catch (error) {
        console.error('❌ Error creating color combo:', error.message);
        res.status(500).json({ error: 'Failed to create color combo', details: error.message });
    }
};

exports.updateColorCombo = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, colors } = req.body;
        if (!title || !colors) {
            return res.status(400).json({ error: 'Title and colors are required' });
        }
        const result = await ColorCombo.update(id, { title, colors });
        res.json({ success: true, message: 'Color combo updated successfully', data: result });
    } catch (error) {
        console.error('❌ Error updating color combo:', error.message);
        res.status(500).json({ error: 'Failed to update color combo', details: error.message });
    }
};

exports.deleteColorCombo = async (req, res) => {
    try {
        const { id } = req.params;
        await ColorCombo.delete(id);
        res.json({ success: true, message: 'Color combo deleted successfully' });
    } catch (error) {
        console.error('❌ Error deleting color combo:', error.message);
        res.status(500).json({ error: 'Failed to delete color combo', details: error.message });
    }
};
