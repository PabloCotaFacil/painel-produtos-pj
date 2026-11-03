const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for Crédito Imobiliário...');

  // Clean existing tables
  await prisma.attachment.deleteMany({});
  await prisma.article.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.triggerTier.deleteMany({});
  await prisma.institutionProduct.deleteMany({});
  await prisma.heroBanner.deleteMany({});

  // 1. Create Default Hero Banner (Editable by Admin)
  await prisma.heroBanner.create({
    data: {
      id: 'default-hero',
      badgeText: 'Regras & Manuais 2025/2026',
      title: 'Hub de apoio Crédito Imobiliário',
      subtitle: 'Consulte manuais operacionais de bancos, downloads de PDFs com checklist de esteira e regras operacionais atualizadas.',
      primaryButtonText: 'Ver Regras & Manuais',
      primaryButtonUrl: '/categorias/treinamentos',
      secondaryButtonText: 'Área do Gestor',
      secondaryButtonUrl: '/admin/login',
    },
  });

  // 2. Create Categories
  const catImob = await prisma.category.create({
    data: {
      name: 'Crédito Imobiliário',
      slug: 'imobiliario',
      description: 'Financiamento habitacional, Home Equity e repasse bancário.',
      icon: 'home',
    },
  });

  await prisma.category.create({
    data: {
      name: 'Treinamentos e Videoaulas',
      slug: 'treinamentos',
      description: 'Vídeos de treinamento, videoaulas e tutoriais operacionais.',
      icon: 'video',
    },
  });

  // 3. Create Articles & Attachments
  await prisma.article.create({
    data: {
      title: 'Regras de Financiamento Habitação Caixa - LTV & Documentação',
      summary: 'Confira as tabelas atualizadas de LTV máximo (SBPE e Minha Casa Minha Vida) e lista completa de certidões necessárias.',
      content: `### Resumo da Operação
- **Financiamento SBPE**: Até 80% de LTV no sistema SAC e 70% no PRICE.
- **Taxas de Juros**: A partir de 9.99% a.a. + TR.
- **Documentos Obrigatórios**: RG/CPF, Comprovante de Renda (3 últimos holerites ou IR), Matrícula Atualizada do Imóvel (com certidão de ônus e ações).

### Regra Importante
Operações com LTV acima de 75% exigem análise prévia do comitê de crédito habitacional.`,
      categoryId: catImob.id,
      attachments: {
        create: [
          {
            name: 'Manual_Operacional_Caixa_Habitacao_2026.pdf',
            fileUrl: '/uploads/manual_caixa_2026.pdf',
            fileType: 'pdf',
          },
        ],
      },
    },
  });

  // 4. Create Institution Products & Production Trigger Tiers (Restricted to Gestores)
  const itauImob = await prisma.institutionProduct.create({
    data: {
      bankName: 'Itaú Imobiliário',
      segment: 'Crédito Imobiliário',
      description: 'Financiamento residencial e comercial SBPE com gatilhos por volume mensal para Gestores.',
    },
  });

  await prisma.triggerTier.createMany({
    data: [
      {
        institutionProductId: itauImob.id,
        minVolume: 0,
        maxVolume: 499999.99,
        commissionRate: 1.2,
      },
      {
        institutionProductId: itauImob.id,
        minVolume: 500000,
        maxVolume: 999999.99,
        commissionRate: 1.5,
      },
      {
        institutionProductId: itauImob.id,
        minVolume: 1000000,
        maxVolume: null,
        commissionRate: 2.0,
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
