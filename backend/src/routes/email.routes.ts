import express from 'express';
import {
    emailService,
    type CandidateEmailData,
    type CompanyInfo,
} from '../services/EmailService.js';

const router = express.Router();

/**
 * POST /api/email/send-bulk
 * Send bulk emails to candidates
 */
router.post('/send-bulk', async (req, res) => {
    try {
        const {
            candidates,
            emailType,
            companyInfo,
        }: {
            candidates: CandidateEmailData[];
            emailType: 'acceptance' | 'rejection';
            companyInfo: CompanyInfo;
        } = req.body;

        // Validate input
        if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Candidates array is required and must not be empty',
            });
        }

        if (!emailType || !['acceptance', 'rejection'].includes(emailType)) {
            return res.status(400).json({
                success: false,
                message: 'Email type must be either "acceptance" or "rejection"',
            });
        }

        if (!companyInfo || !companyInfo.companyName || !companyInfo.hrName) {
            return res.status(400).json({
                success: false,
                message: 'Company info with companyName and hrName is required',
            });
        }

        // Log email sending start
        console.log(
            `Sending ${emailType} emails to ${candidates.length} candidates...`
        );

        // Send bulk emails
        const results = await emailService.sendBulkEmails(
            candidates,
            emailType,
            companyInfo
        );

        // Log results
        console.log(
            `Email sending completed: ${results.sent} sent, ${results.failed} failed`
        );

        return res.json({
            success: true,
            message: `Sent ${results.sent} email(s) successfully`,
            sent: results.sent,
            failed: results.failed,
            errors: results.errors,
        });
    } catch (error: any) {
        console.error('Error sending bulk emails:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send emails',
            error: error.message,
        });
    }
});

/**
 * POST /api/email/send-acceptance
 * Send acceptance email to a single candidate
 */
router.post('/send-acceptance', async (req, res) => {
    try {
        const {
            candidate,
            companyInfo,
        }: {
            candidate: CandidateEmailData;
            companyInfo: CompanyInfo;
        } = req.body;

        if (!candidate || !candidate.email || !candidate.name) {
            return res.status(400).json({
                success: false,
                message: 'Candidate with email and name is required',
            });
        }

        const result = await emailService.sendAcceptanceEmail(candidate, companyInfo);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send acceptance email',
                error: result.error,
            });
        }

        return res.json({
            success: true,
            message: 'Acceptance email sent successfully',
        });
    } catch (error: any) {
        console.error('Error sending acceptance email:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send acceptance email',
            error: error.message,
        });
    }
});

/**
 * POST /api/email/send-rejection
 * Send rejection email to a single candidate
 */
router.post('/send-rejection', async (req, res) => {
    try {
        const {
            candidate,
            companyInfo,
        }: {
            candidate: CandidateEmailData;
            companyInfo: CompanyInfo;
        } = req.body;

        if (!candidate || !candidate.email || !candidate.name) {
            return res.status(400).json({
                success: false,
                message: 'Candidate with email and name is required',
            });
        }

        const result = await emailService.sendRejectionEmail(candidate, companyInfo);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to send rejection email',
                error: result.error,
            });
        }

        return res.json({
            success: true,
            message: 'Rejection email sent successfully',
        });
    } catch (error: any) {
        console.error('Error sending rejection email:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send rejection email',
            error: error.message,
        });
    }
});

export default router;
