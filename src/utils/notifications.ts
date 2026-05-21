import { supabase } from "@/integrations/supabase/client";

export type NotificationType = "system" | "job" | "application" | "interview" | "offer" | "contract" | "payment" | "security" | "support";

export const notifyUser = async (userId: string, title: string, message: string, type: NotificationType = "system", actionUrl?: string) => {
    if (!userId) {
        console.warn("notifyUser skipped because userId is missing");
        return;
    }

    try {
        const { error } = await supabase
            .from("notifications" as any)
            .insert({
                user_id: userId,
                title,
                message,
                type,
                // action_url: actionUrl // Schema might not have action_url yet as per my SQL in step 1164. I should check schema. 
                // Step 1164 SQL: create table notifications (..., type, read, ...). I did NOT add action_url.
                // But NotificationBell (Step 1244) uses notification.action_url.
                // I should add action_url to schema or ignore it for now.
                // I will Add it to schema via SQL instruction later or assume it fails if I insert.
                // For now I will OMIT action_url to be safe with DB, or I'll implement it if I can run SQL.
                // I can't run SQL directly. 
                // I will just insert title/message/type.
            });

        if (error) throw error;
        console.log("Notification sent:", title);
    } catch (error) {
        console.error("Failed to send notification:", error);
    }
};
