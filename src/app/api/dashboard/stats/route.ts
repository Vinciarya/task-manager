import { taskService } from "@/lib/container";
import { withHandler } from "@/lib/with-handler";
import { withAuth } from "@/lib/with-auth";
import { ApiResponse } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { getRequiredUserId } from "@/lib/request-context";

export const GET = withHandler(
  withAuth(async (req: NextRequest) => {
    const userId = getRequiredUserId(req.headers);
    const stats = await taskService.getDashboardStats(userId);
    
    return ApiResponse.success(stats, "Dashboard stats fetched successfully");
  })
);
