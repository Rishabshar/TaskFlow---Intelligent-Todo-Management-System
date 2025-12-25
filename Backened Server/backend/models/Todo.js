import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";

const Todo = sequelize.define(
  "Todo",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    completed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
  },
  {
    timestamps: true,
  }
);

// Relationship
User.hasMany(Todo, { foreignKey: "userId", onDelete: "CASCADE" });
Todo.belongsTo(User, { foreignKey: "userId" });

export default Todo;
