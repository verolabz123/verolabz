/**
 * Frontend API Client for Email Operations
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://verolabz.onrender.com';

export interface CandidateEmailData {
    name: string;
    email: string;
    jobRole: string;
}

export interface CompanyInfo {
    companyName: string;
    hrName: string;
    hrEmail: string;
    companyWebsite?: string;
}

export interface BulkEmailResponse {
    success: boolean;
    message: string;
    sent: number;
    failed: number;
    errors: string[];
}

/**
 * Send bulk emails to candidates
 */
export async function sendBulkEmails(
    candidates: CandidateEmailData[],
    emailType: 'acceptance' | 'rejection',
    companyInfo: CompanyInfo
): Promise<BulkEmailResponse> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/email/send-bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                candidates,
                emailType,
                companyInfo,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to send emails');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending bulk emails:', error);
        throw error;
    }
}

/**
 * Send acceptance email to a single candidate
 */
export async function sendAcceptanceEmail(
    candidate: CandidateEmailData,
    companyInfo: CompanyInfo
): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/email/send-acceptance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                candidate,
                companyInfo,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to send acceptance email');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending acceptance email:', error);
        throw error;
    }
}

/**
 * Send rejection email to a single candidate
 */
export async function sendRejectionEmail(
    candidate: CandidateEmailData,
    companyInfo: CompanyInfo
): Promise<{ success: boolean; message: string }> {
    try {
        const response = await fetch(`${BACKEND_URL}/api/v1/email/send-rejection`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                candidate,
                companyInfo,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to send rejection email');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error sending rejection email:', error);
        throw error;
    }
}
