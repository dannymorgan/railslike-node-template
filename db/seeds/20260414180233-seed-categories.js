'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */
    await queryInterface.bulkInsert('Categories', [
      { name: 'General', slug: 'general', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Technology', slug: 'technology', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Philosophy', slug: 'philosophy', createdAt: new Date(), updatedAt: new Date() },
      { name: 'Poetry', slug: 'poetry', createdAt: new Date(), updatedAt: new Date() }
    ])
  },

  async down(queryInterface, Sequelize) {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
    await queryInterface.bulkDelete('Categories', null, {})
  }
};