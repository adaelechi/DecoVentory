const ExternalBorrower = require('../models/ExternalBorrower');
const ExternalBorrowItem = require('../models/ExternalBorrowItem');
const Material = require('../models/Material');
const ActivityLog = require('../models/ActivityLog');

exports.getAllBorrowers = (req, res) => {
  ExternalBorrower.getAll((err, borrowers) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch borrowers' });
    }
    res.json(borrowers);
  });
};

exports.getBorrowerById = (req, res) => {
  ExternalBorrower.getById(req.params.id, (err, borrower) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch borrower' });
    }
    if (!borrower) {
      return res.status(404).json({ error: 'Borrower not found' });
    }

    // Get items for this borrower
    ExternalBorrowItem.getByBorrowId(req.params.id, (err, items) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to fetch borrow items' });
      }

      res.json({
        ...borrower,
        items
      });
    });
  });
};

exports.createBorrower = (req, res) => {
  const { borrower_name, borrower_contact, purpose, borrow_date, expected_return_date, items } = req.body;

  if (!borrower_name || !borrower_contact || !purpose || !borrow_date || !expected_return_date || !items) {
    return res.status(400).json({ error: 'All fields including items array are required' });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items must be a non-empty array' });
  }

  const borrowerData = {
    borrower_name,
    borrower_contact,
    purpose,
    borrow_date,
    expected_return_date
  };

  ExternalBorrower.create(borrowerData, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create borrower' });
    }

    const borrowId = result.id;
    let completed = 0;

    // Create borrow items and update inventory
    items.forEach(item => {
      ExternalBorrowItem.create(borrowId, item.material_id, item.quantity, (err) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to create borrow item' });
        }

        // Reduce available quantity
        Material.getById(item.material_id, (err, material) => {
          if (!err && material) {
            const newAvailable = material.available_quantity - item.quantity;
            Material.updateQuantity(item.material_id, newAvailable, () => {
              ActivityLog.create(
                item.material_id,
                'BORROW',
                item.quantity,
                borrowId,
                `Borrowed by ${borrower_name}`,
                () => {}
              );
            });
          }

          completed++;
          if (completed === items.length) {
            res.status(201).json({
              success: true,
              id: borrowId,
              message: 'Borrower created and inventory updated'
            });
          }
        });
      });
    });
  });
};

exports.markBorrowerReturned = (req, res) => {
  const { items } = req.body; // Array of { id, returned_quantity, lost_quantity, damaged_quantity }

  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Items array is required' });
  }

  ExternalBorrower.getById(req.params.id, (err, borrower) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch borrower' });
    }
    if (!borrower) {
      return res.status(404).json({ error: 'Borrower not found' });
    }

    // Mark borrower as returned
    ExternalBorrower.markReturned(req.params.id, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to mark as returned' });
      }

      let completed = 0;

      // Update each item and adjust inventory
      items.forEach(item => {
        ExternalBorrowItem.updateReturn(
          item.id,
          item.returned_quantity,
          item.lost_quantity || 0,
          item.damaged_quantity || 0,
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Failed to update borrow item' });
            }

            // Get material to update quantities
            ExternalBorrowItem.getByBorrowId(req.params.id, (err, borrowItems) => {
              if (!err && borrowItems) {
                const borrowItem = borrowItems.find(bi => bi.id === item.id);
                if (borrowItem) {
                  Material.getById(borrowItem.material_id, (err, material) => {
                    if (!err && material) {
                      const newAvailable = material.available_quantity + item.returned_quantity;
                      const lostDamaged = (item.lost_quantity || 0) + (item.damaged_quantity || 0);
                      const newTotal = material.total_quantity - lostDamaged;

                      Material.update(borrowItem.material_id, {
                        ...material,
                        available_quantity: newAvailable,
                        total_quantity: newTotal
                      }, () => {
                        ActivityLog.create(
                          borrowItem.material_id,
                          'RETURN',
                          item.returned_quantity,
                          req.params.id,
                          `Returned by ${borrower.borrower_name}`,
                          () => {}
                        );
                      });
                    }
                  });
                }
              }

              completed++;
              if (completed === items.length) {
                res.json({ success: true, message: 'Items returned and inventory updated' });
              }
            });
          }
        );
      });
    });
  });
};

exports.deleteBorrower = (req, res) => {
  // First delete associated items
  ExternalBorrowItem.deleteByBorrowId(req.params.id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete borrow items' });
    }

    // Then delete borrower
    ExternalBorrower.delete(req.params.id, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete borrower' });
      }

      res.json({ success: true, message: 'Borrower deleted successfully' });
    });
  });
};
