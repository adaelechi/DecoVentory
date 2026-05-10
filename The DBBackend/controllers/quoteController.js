const QuoteRequest = require('../models/QuoteRequest');
const Material = require('../models/Material');
const MaterialLocation = require('../models/MaterialLocation');

exports.createQuote = async (req, res) => {
    try {
        const result = await QuoteRequest.create(req.body);
        res.status(201).json({ success: true, message: 'Quote request submitted', id: result.id });
    } catch (error) {
        console.error('❌ Error creating quote request:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to create quote request', details: error.message });
    }
};

exports.getQuotes = async (req, res) => {
    try {
        const quotes = await QuoteRequest.getAll();
        res.json(quotes);
    } catch (error) {
        console.error('❌ Error fetching quotes:', error.message, error.stack);
        res.status(500).json({ error: 'Failed to fetch quote requests', details: error.message });
    }
};

exports.approveQuote = async (req, res) => {
    try {
        const quoteId = req.params.id;
        const quote = await QuoteRequest.getById(quoteId);
        
        if (!quote) {
            return res.status(404).json({ error: 'Quote request not found' });
        }
        
        if (quote.status === 'approved') {
            return res.status(400).json({ error: 'Quote is already approved' });
        }

        // Deduct quantities from 'available_quantity' in materials table
        if (quote.items && Array.isArray(quote.items)) {
            for (const item of quote.items) {
                const materialId = item.materialId;
                const qty = parseInt(item.quantity);
                
                if (materialId && qty > 0) {
                    const material = await Material.getByIdPromise(materialId);
                    if (material) {
                        const newAvailable = Math.max(0, material.available_quantity - qty);
                        await Material.updateAvailableQuantityPromise(materialId, newAvailable);
                        
                        // Also automatically log that they were rented
                        // But wait, the Material Location table would need an update to reflect it moved to 'Rented Out'.
                        // For simplicity right now, we just deduct available quantity.
                    }
                }
            }
        }
        
        await QuoteRequest.updateStatus(quoteId, 'approved');
        res.json({ success: true, message: 'Quote request approved and inventory deducted' });
    } catch (error) {
        console.error('Error approving quote:', error);
        res.status(500).json({ error: 'Failed to approve quote request' });
    }
};

exports.rejectQuote = async (req, res) => {
    try {
        const quoteId = req.params.id;
        await QuoteRequest.updateStatus(quoteId, 'rejected');
        res.json({ success: true, message: 'Quote request rejected' });
    } catch (error) {
        console.error('Error rejecting quote:', error);
        res.status(500).json({ error: 'Failed to reject quote request' });
    }
};
