const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const categories = await prisma.category.findMany();
  console.log('Categories count:', categories.length);
  if (categories.length === 0) {
    console.log('Seeding categories into Supabase...');
    const defaults = [
      { name: 'Crédito Imobiliário', slug: 'imobiliario', description: 'Financiamento habitacional, Home Equity, repasse bancário e regras de LTV.', icon: 'home' },
      { name: 'Treinamentos e Videoaulas', slug: 'treinamentos', description: 'Vídeos de treinamento, videoaulas, tutoriais e esteiras operacionais.', icon: 'video' },
    ];
    for (const c of defaults) {
      await prisma.category.upsert({ where: { slug: c.slug }, update: { name: c.name, description: c.description, icon: c.icon }, create: c });
    }
    const updated = await prisma.category.findMany();
    console.log('Updated categories count:', updated.length);
  } else {
    // Ensure 'treinamentos' category has updated name
    await prisma.category.updateMany({
      where: { slug: 'treinamentos' },
      data: {
        name: 'Treinamentos e Videoaulas',
        description: 'Vídeos de treinamento, videoaulas, tutoriais e esteiras operacionais.',
        icon: 'video',
      },
    });
    const refreshed = await prisma.category.findMany();
    refreshed.forEach(c => console.log(' -', c.name, '(', c.slug, ')'));
  }

  // Also check heroBanner
  const banner = await prisma.heroBanner.findUnique({ where: { id: 'default-hero' } });
  console.log('Hero banner:', banner ? JSON.stringify(banner, null, 2) : 'null');
  if (!banner) {
    await prisma.heroBanner.create({
      data: {
        id: 'default-hero',
        badgeText: 'Regras & Manuais 2025/2026',
        title: 'Hub de apoio Crédito Imobiliário',
        subtitle: 'Consulte manuais operacionais de bancos, downloads de PDFs com checklist de esteira e regras operacionais atualizadas.',
        primaryButtonText: 'Ver Regras & Manuais',
        primaryButtonUrl: '/categorias/treinamentos',
        secondaryButtonText: '',
        secondaryButtonUrl: '',
      }
    });
    console.log('Created default hero banner');
  } else {
    if (banner.secondaryButtonUrl && (banner.secondaryButtonUrl.includes('admin') || banner.secondaryButtonUrl.includes('comissoes'))) {
      await prisma.heroBanner.update({
        where: { id: 'default-hero' },
        data: { secondaryButtonText: '', secondaryButtonUrl: '' }
      });
      console.log('Cleaned secondary button in hero banner');
    }
  }

  const articles = await prisma.article.findMany({ include: { category: true } });
  console.log('Articles count:', articles.length);
  articles.forEach(a => console.log(' - Article:', a.title, '| Category:', a.category.name));
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
