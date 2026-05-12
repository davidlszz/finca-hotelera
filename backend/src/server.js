// Arranque local — usado por npm run dev / npm start
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3001;

sequelize.authenticate()
  .then(() => sequelize.sync())
  .then(() => {
    console.log('✅ Base de datos sincronizada.');
    app.listen(PORT, () => console.log(`🚀 API corriendo en http://localhost:${PORT}`));
  })
  .catch(err => { console.error('❌ Error al iniciar:', err); process.exit(1); });
