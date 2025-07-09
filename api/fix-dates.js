import { ModelDatabase } from '../src/models/ModelDatabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const database = new ModelDatabase();
    await database.load();
    
    console.log('Starting date migration...');
    await database.fixDateMigration();
    
    res.status(200).json({
      success: true,
      message: 'Date migration completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Date migration failed:', error);
    res.status(500).json({
      success: false,
      error: 'Date migration failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}