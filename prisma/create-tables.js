const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Criando tabelas StoredFile e UploadChunk no Supabase...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "StoredFile" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL DEFAULT 'application/pdf',
      "size" INTEGER NOT NULL DEFAULT 0,
      "data" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "UploadChunk" (
      "id" TEXT PRIMARY KEY,
      "uploadId" TEXT NOT NULL,
      "chunkIndex" INTEGER NOT NULL,
      "totalChunks" INTEGER NOT NULL,
      "data" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "UploadChunk_uploadId_chunkIndex_idx" ON "UploadChunk"("uploadId", "chunkIndex");
  `);

  console.log('Tabelas criadas com sucesso no banco!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
