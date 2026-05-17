ALTER TABLE "SavedTrail" RENAME TO "SavedActivity";
ALTER TABLE "SavedActivity" ADD COLUMN "activityType" TEXT NOT NULL DEFAULT 'trail';
