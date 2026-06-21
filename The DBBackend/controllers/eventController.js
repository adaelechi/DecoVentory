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
  
  const images = files.map(file => {
    if (file.path && file.path.startsWith('http')) {
      return file.path;
    }
    // If we're in production (Render) and Cloudinary is set, but we got a local path,
    // it's a configuration error. We still save it as a fallback but log a warning.
    if (process.env.CLOUDINARY_CLOUD_NAME) {
      console.warn(`⚠️ Warning: Expected Cloudinary URL for ${file.originalname} but received local path. Check storage config.`);
    }
    return `/uploads/decorations/${file.filename}`;
  });

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

    if (!parsedMaterials || parsedMaterials.length === 0) {
      return res.status(201).json({
        success: true,
        id: result.id,
        message: 'Event created'
      });
    }

    // Reduce available quantities and log activities safely
    const updatePromises = parsedMaterials.map(item => {
      return new Promise((resolve) => {
        Material.getById(item.material_id, (err, material) => {
          if (err || !material) {
            if (err) console.error(`Error fetching material ${item.material_id}:`, err);
            return resolve();
          }

          const newAvailable = Math.max(0, material.available_quantity - item.quantity);
          Material.updateQuantity(item.material_id, newAvailable, (updateErr) => {
            if (updateErr) {
              console.error(`Error updating material ${item.material_id} quantity:`, updateErr);
              return resolve();
            }

            ActivityLog.create(
              item.material_id,
              'EVENT_USE',
              item.quantity,
              result.id,
              `Used for event: ${event_name}`,
              (logErr) => {
                if (logErr) console.error(`Error creating activity log for material ${item.material_id}:`, logErr);
                resolve();
              }
            );
          });
        });
      });
    });

    Promise.all(updatePromises)
      .then(() => {
        res.status(201).json({
          success: true,
          id: result.id,
          message: 'Event created and inventory updated'
        });
      })
      .catch(err => {
        console.error('CRITICAL: Promise.all failed unexpectedly in createEvent:', err);
        res.status(201).json({
          success: true,
          id: result.id,
          message: 'Event created'
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

      if (!materials_used || materials_used.length === 0) {
        return res.json({ success: true, message: 'Event marked as returned' });
      }

      // Restore quantities (minus lost/damaged items) safely
      const updatePromises = materials_used.map(item => {
        return new Promise((resolve) => {
          Material.getById(item.material_id, (err, material) => {
            if (err || !material) {
              if (err) console.error(`Error fetching material ${item.material_id}:`, err);
              return resolve();
            }

            const lostQty = lost_items.find(l => Number(l.material_id) === Number(item.material_id))?.quantity || 0;
            const damagedQty = damaged_items.find(d => Number(d.material_id) === Number(item.material_id))?.quantity || 0;
            const returnedQty = item.quantity - lostQty - damagedQty;

            const newAvailable = material.available_quantity + returnedQty;
            const newTotal = Math.max(0, material.total_quantity - lostQty - damagedQty);

            Material.update(item.material_id, {
              ...material,
              available_quantity: newAvailable,
              total_quantity: newTotal
            }, (updateErr) => {
              if (updateErr) {
                console.error(`Error updating material ${item.material_id} quantities:`, updateErr);
                return resolve();
              }

              ActivityLog.create(
                item.material_id,
                'RETURN',
                returnedQty,
                req.params.id,
                `Returned from event: ${event.event_name}`,
                (logErr) => {
                  if (logErr) console.error(`Error creating activity log for material ${item.material_id}:`, logErr);
                  resolve();
                }
              );
            });
          });
        });
      });

      Promise.all(updatePromises)
        .then(() => {
          res.json({ success: true, message: 'Event marked as returned and inventory updated' });
        })
        .catch(err => {
          console.error('CRITICAL: Promise.all failed unexpectedly in markEventReturned:', err);
          res.json({ success: true, message: 'Event marked as returned' });
        });
    });
  });
};

exports.deleteEvent = (req, res) => {
  const eventId = req.params.id;

  // 1. Fetch the event first to get image URLs for Cloudinary cleanup
  EventDecoration.getById(eventId, (err, event) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to fetch event for deletion' });
    }
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const images = event.images ? JSON.parse(event.images) : [];

    // 2. Delete images from Cloudinary if configured
    if (process.env.CLOUDINARY_CLOUD_NAME && images.length > 0) {
      const cloudinary = require('../config/cloudinary').cloudinary;
      
      images.forEach(imgUrl => {
        if (imgUrl.includes('cloudinary.com')) {
          // Extract public_id from URL
          // Example: https://res.cloudinary.com/dbnuegesq/image/upload/v123/decoventory/decorations/123-456.jpg
          const parts = imgUrl.split('/');
          const filenameWithExt = parts.pop();
          const filename = filenameWithExt.split('.')[0];
          
          // Reconstruct path: decoventory/decorations/filename
          const publicId = `decoventory/decorations/${filename}`;
          
          cloudinary.uploader.destroy(publicId, (error, result) => {
            if (error) console.error(`[Cloudinary] Failed to delete image ${publicId}:`, error);
            else console.log(`[Cloudinary] Deleted image: ${publicId}`);
          });
        }
      });
    }

    // 3. Delete from database
    EventDecoration.delete(eventId, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to delete event from database' });
      }

      res.json({ success: true, message: 'Event and associated images deleted successfully' });
    });
  });
};
