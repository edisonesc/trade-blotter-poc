/*
  Warnings:

  - You are about to drop the column `tradeDate` on the `Trade` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tradeSeq]` on the table `Trade` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `book` to the `Trade` table without a default value. This is not possible if the table is not empty.
  - Added the required column `counterparty` to the `Trade` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Trade" DROP COLUMN "tradeDate",
ADD COLUMN     "book" TEXT NOT NULL,
ADD COLUMN     "counterparty" TEXT NOT NULL,
ADD COLUMN     "tradeSeq" SERIAL NOT NULL,
ADD COLUMN     "tradeTimestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Trade_tradeSeq_key" ON "Trade"("tradeSeq");
