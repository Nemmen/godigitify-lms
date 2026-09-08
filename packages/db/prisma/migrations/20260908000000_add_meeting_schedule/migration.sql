ALTER TABLE "InteractionLog" ADD COLUMN "scheduledAt" TIMESTAMP(3);

CREATE INDEX "InteractionLog_scheduledAt_idx" ON "InteractionLog"("scheduledAt");