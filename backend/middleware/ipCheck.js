module.exports = async (req, res, next) => {
    try {
      const { registrationId } = req.params;
      const clientIp = req.clientIp;
      
      const db = require('../config/database');
      
      const [rows] = await db.query(
        'SELECT registration_ip FROM registrations WHERE id = ?',
        [registrationId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Anmeldung nicht gefunden' });
      }
      
      if (rows[0].registration_ip !== clientIp) {
        return res.status(403).json({ 
          message: 'Sie können nur Anmeldungen bearbeiten, die von diesem Computer aus erstellt wurden' 
        });
      }
      
      next();
    } catch (error) {
      console.error('IP-Check Fehler:', error);
      res.status(500).json({ message: 'Server-Fehler bei der IP-Überprüfung' });
    }
  };