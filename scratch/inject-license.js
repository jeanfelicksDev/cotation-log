const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const license = await prisma.license.create({
      data: {
        key: 'COTA-FREE-ADM0-2026',
        companyName: 'Administration CotaLog',
        contactEmail: 'jeanfelicks@gmail.com',
        maxUsers: 100,
        isActive: false,
        notes: 'Licence Master pour le propriétaire'
      }
    });
    console.log('Licence créée avec succès :', license.key);
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('La licence existe déjà.');
    } else {
      console.error('Erreur lors de la création de la licence :', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
