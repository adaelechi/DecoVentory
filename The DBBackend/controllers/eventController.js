const EventDecoration = require('../models/EventDecoration');
const Material = require('../models/Material');
const ActivityLog = require('../models/ActivityLog');

exports.getAllEvents = (req, res) => {
  EventDecoration.getAll((err, events) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch events' });
    }
    
    const parsedEvents = events.map(event => ({
      ...event,
      materials_used: JSON.parse(event.materials_used),
      lost_items: event.lost_items ? JSON.parse(event.lost_items) : [],
      damaged_items: event.damaged_items ? JSON.parse(event.damaged_items) : [],
      images: event.images ? JSON.parse(event.images) : []
    }));
    
    res.json(parsedEvents);
  });
};

exports.getEventById = (req, res) => {
  EventDecoration.getById(req.params.id, (err, event) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch event' });
    }
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({
      ...event,
      materials_used: JSON.parse(event.materials_used),
      lost_items: event.lost_items ? JSON.parse(event.lost_items) : [],
      damaged_items: event.damaged_items ? JSON.parse(event.damaged_items) : [],
      images: event.images ? JSON.parse(event.images) : []
    });
  });
};

exports.createEvent = (req, res) => {
  const { event_name, venue, event_date, materials_used, instagram_link, notes } = req.body;
  const files = req.files || [];
  
  const images = files.map(file => `/uploads/decorations/${file.filename}`);

  if (!event_name || !venue || !event_date || !materials_used) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  const parsedMaterials = typeof materials_used === 'string' ? JSON.parse(materials_used) : materials_used;

  const eventData = {
    event_name,
    venue,
    event_date,
    materials_used: parsedMaterials,
    images,
    instagram_link,
    notes
  };

  EventDecoration.create(eventData, (err, result) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to create event' });
    }

    // Reduce available quantities and log activities
    let completed = 0;
    if (!parsedMaterials || parsedMaterials.length === 0) {
      return res.status(201).json({
        success: true,
        id: result.id,
        message: 'Event created'
      });
    }

    parsedMaterials.forEach(item => {
      Material.getById(item.material_id, (err, material) => {
        if (!err && material) {
          const newAvailable = material.available_quantity - item.quantity;
          Material.updateQuantity(item.material_id, newAvailable, () => {
            ActivityLog.create(
              item.material_id,
              'EVENT_USE',
              item.quantity,
              result.id,
              `Used for event: ${event_name}`,
              () => {}
            );
          });
        }
        
        completed++;
        if (completed === parsedMaterials.length) {
          res.status(201).json({
            success: true,
            id: result.id,
            message: 'Event created and inventory updated'
          });
        }
      });
    });
  });
};

exports.markEventReturned = (req, res) => {
  const { lost_items = [], damaged_items = [] } = req.body;

  EventDecoration.getById(req.params.id, (err, event) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch event' });
    }
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const materials_used = JSON.parse(event.materials_used);

    // Mark as returned
    EventDecoration.markReturned(req.params.id, lost_items, damaged_items, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to mark event as returned' });
      }

      // Restore quantities (minus lost/damaged items)
      materials_used.forEach(item => {
        Material.getById(item.material_id, (err, material) => {
          if (!err && material) {
            const lostQty = lost_items.find(l => l.material_id === item.material_id)?.quantity || 0;
            const damagedQty = damaged_items.find(d => d.material_id === item.material_id)?.quantity || 0;
            const returnedQty = item.quantity - lostQty - damagedQty;

            const newAvailable = material.available_quantity + returnedQty;
            const newTotal = material.total_quantity - lostQty - damagedQty;

            Material.update(item.material_id, {
              ...material,
              available_quantity: newAvailable,
              total_quantity: newTotal
            }, () => {
              ActivityLog.create(
                item.material_id,
                'RETURN',
                returnedQty,
                req.params.id,
                `Returned from event: ${event.event_name}`,
                () => {}
              );
            });
          }
        });
      });

      res.json({ success: true, message: 'Event marked as returned and inventory updated' });
    });
  });
};

exports.deleteEvent = (req, res) => {
  EventDecoration.delete(req.params.id, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete event' });
    }

    res.json({ success: true, message: 'Event deleted successfully' });
  });
};
