ALTER TABLE "InteractionLog" ADD COLUMN "completedAt" TIMESTAMP(3);
ALTER TABLE "InteractionLog" ADD COLUMN "completedById" TEXT;
ALTER TABLE "InteractionLog" ADD COLUMN "completionNote" TEXT;

CREATE INDEX "InteractionLog_completedAt_idx" ON "InteractionLog"("completedAt");