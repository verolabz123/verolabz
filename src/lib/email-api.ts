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
    console.log('[EMAIL API] 🚀 sendBulkEmails called');
    console.log('[EMAIL API] Candidates:', candidates.length);
    console.log('[EMAIL API] Email type:', emailType);
    console.log('[EMAIL API] Company:', companyInfo.companyName);
    console.log('[EMAIL API] Backend URL:', BACKEND_URL);

    try {
        const requestBody = {
            candidates,
            emailType,
            companyInfo,
        };

        console.log('[EMAIL API] Request body:', JSON.stringify(requestBody, null, 2));
        console.log('[EMAIL API] Making fetch request to:', `${BACKEND_URL}/api/v1/email/send-bulk`);

        const response = await fetch(`${BACKEND_URL}/api/v1/email/send-bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        console.log('[EMAIL API] Response status:', response.status);
        console.log('[EMAIL API] Response OK:', response.ok);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[EMAIL API] ❌ Error response:', errorText);

            let error;
            try {
                error = JSON.parse(errorText);
            } catch {
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            throw new Error(error.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        console.log('[EMAIL API] ✅ Success response:', data);

        return data;
    } catch (error: any) {
        console.error('[EMAIL API] ❌ Exception caught:', error);
        console.error('[EMAIL API] Error name:', error?.name);
        console.error('[EMAIL API] Error message:', error?.message);
        console.error('[EMAIL API] Error stack:', error?.stack);
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
