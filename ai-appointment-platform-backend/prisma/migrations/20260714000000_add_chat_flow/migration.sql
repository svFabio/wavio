-- AlterTable: Add chatFlow JSON field to Configuracion for bot message customization
ALTER TABLE "Configuracion" ADD COLUMN "chatFlow" JSONB NOT NULL DEFAULT '{}';
