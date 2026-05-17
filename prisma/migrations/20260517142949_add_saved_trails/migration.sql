-- CreateTable
CREATE TABLE "SavedTrail" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "npsId" TEXT NOT NULL,
    "parkNpsId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT,
    "url" TEXT,

    CONSTRAINT "SavedTrail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedTrail_userId_npsId_key" ON "SavedTrail"("userId", "npsId");

-- AddForeignKey
ALTER TABLE "SavedTrail" ADD CONSTRAINT "SavedTrail_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
