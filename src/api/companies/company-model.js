const { DataTypes } = require('sequelize');
const CompanySize = require('../../constants/company-size');

module.exports = (sequelize) => {
  const Company = sequelize.define(
    'Company',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      corporateName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      tradeName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      cnpj: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sector: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      size: {
        type: DataTypes.ENUM(...Object.values(CompanySize)),
        allowNull: false,
        defaultValue: CompanySize.SMALL,
      },
      foundedYear: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      websiteUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      linkedinUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      logoUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bannerUrl: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      contactEmail: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contactPhone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      locationCity: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      locationState: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      locationNumber: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      locationNeighborhood: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      locationZipcode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      locationComplement: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'companies',
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ['cnpj'],
        },
        {
          fields: ['trade_name'],
        },
      ],
    }
  );

  return Company;
};
