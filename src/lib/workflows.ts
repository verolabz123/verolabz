/**
 * N8N Workflow Integration Service
 * 
 * This file contains placeholder functions for n8n workflow automation.
 * All functions are currently mock implementations that log to console.
 * 
 * TODO: Replace these mock implementations with actual n8n webhook calls
 * when integrating with the n8n automation platform.
 */

export interface WorkflowStatus {
    name: string;
    status: "connected" | "pending" | "not_configured";
    lastRun?: Date;
}

/**
 * Triggers the resume parsing workflow in n8n
 * 
 * TODO: Integrate with n8n workflow here
 * - Call n8n webhook endpoint: POST /webhook/resume-parse
 * - Pass resumeId and file URL
 * - Handle response with parsed data
 * 
 * @param resumeId - The ID of the resume to process
 */
export async function triggerResumeWorkflow(resumeId: string): Promise<{ success: boolean; message: string }> {
    console.log(`[N8N Placeholder] Triggering resume workflow for: ${resumeId}`);

    // TODO: Replace with actual n8n webhook call
    // const response = await fetch(process.env.N8N_WEBHOOK_URL + '/resume-parse', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ resumeId })
    // });

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
        success: true,
        message: "Resume queued for processing (demo mode)",
    };
}

/**
 * Notifies recruiter about a candidate update
 * 
 * TODO: Integrate with n8n workflow here
 * - Call n8n webhook endpoint: POST /webhook/notify-recruiter
 * - Pass resumeId, candidate info, and notification type
 * - Trigger email/Slack notification via n8n
 * 
 * @param resumeId - The ID of the resume
 * @param notificationType - Type of notification (shortlisted, rejected, etc.)
 */
export async function notifyRecruiter(
    resumeId: string,
    notificationType: "shortlisted" | "rejected" | "new_upload"
): Promise<{ success: boolean; message: string }> {
    console.log(`[N8N Placeholder] Notifying recruiter for resume: ${resumeId}, type: ${notificationType}`);

    // TODO: Replace with actual n8n webhook call
    // const response = await fetch(process.env.N8N_WEBHOOK_URL + '/notify-recruiter', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ resumeId, notificationType })
    // });

    return {
        success: true,
        message: "Notification queued (demo mode)",
    };
}

/**
 * Sends email to candidate
 * 
 * TODO: Integrate with n8n workflow here
 * - Call n8n webhook endpoint: POST /webhook/send-candidate-email
 * - Pass candidate email, template type, and custom data
 * - Trigger email via SendGrid/Mailgun through n8n
 * 
 * @param resumeId - The ID of the resume
 * @param emailType - Type of email to send
 */
export async function sendCandidateEmail(
    resumeId: string,
    emailType: "received" | "shortlisted" | "rejected" | "interview"
): Promise<{ success: boolean; message: string }> {
    console.log(`[N8N Placeholder] Sending email for resume: ${resumeId}, type: ${emailType}`);

    // TODO: Replace with actual n8n webhook call

    return {
        success: true,
        message: "Email queued for sending (demo mode)",
    };
}

/**
 * Get the status of all configured workflows
 * 
 * TODO: Fetch actual workflow status from n8n API
 * - Call n8n API to get workflow execution status
 * - Return real-time status of each workflow
 */
export function getWorkflowStatuses(): WorkflowStatus[] {
    // TODO: Replace with actual n8n API call to get workflow statuses

    return [
        {
            name: "Resume Parsing Workflow",
            status: "pending",
            lastRun: undefined,
        },
        {
            name: "Recruiter Notification Workflow",
            status: "not_configured",
            lastRun: undefined,
        },
        {
            name: "Candidate Email Workflow",
            status: "not_configured",
            lastRun: undefined,
        },
        {
            name: "Dashboard Sync Workflow",
            status: "not_configured",
            lastRun: undefined,
        },
    ];
}
