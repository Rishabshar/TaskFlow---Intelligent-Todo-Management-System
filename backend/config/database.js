import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  'todo',      // database name
  'root',             // username
  'Vinodh',    // your MySQL password
  {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
  }
);

export default sequelize;