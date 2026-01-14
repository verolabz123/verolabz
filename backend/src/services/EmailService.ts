import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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

class EmailService {
    /**
     * Send acceptance email to a single candidate
     */
    async sendAcceptanceEmail(
        candidate: CandidateEmailData,
        companyInfo: CompanyInfo
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const emailHtml = this.generateAcceptanceEmailHTML(candidate, companyInfo);

            const { data, error } = await resend.emails.send({
                from: `${companyInfo.hrName} <${companyInfo.hrEmail || 'noreply@your-domain.com'}>`,
                to: [candidate.email],
                subject: `Congratulations! Interview Invitation from ${companyInfo.companyName}`,
                html: emailHtml,
            });

            if (error) {
                console.error('Failed to send acceptance email:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error: any) {
            console.error('Error sending acceptance email:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send rejection email to a single candidate
     */
    async sendRejectionEmail(
        candidate: CandidateEmailData,
        companyInfo: CompanyInfo
    ): Promise<{ success: boolean; error?: string }> {
        try {
            const emailHtml = this.generateRejectionEmailHTML(candidate, companyInfo);

            const { data, error } = await resend.emails.send({
                from: `${companyInfo.hrName} <${companyInfo.hrEmail || 'noreply@your-domain.com'}>`,
                to: [candidate.email],
                subject: `Application Update - ${candidate.jobRole} at ${companyInfo.companyName}`,
                html: emailHtml,
            });

            if (error) {
                console.error('Failed to send rejection email:', error);
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (error: any) {
            console.error('Error sending rejection email:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send bulk emails (acceptance or rejection)
     */
    async sendBulkEmails(
        candidates: CandidateEmailData[],
        type: 'acceptance' | 'rejection',
        companyInfo: CompanyInfo
    ): Promise<{ sent: number; failed: number; errors: string[] }> {
        const results = {
            sent: 0,
            failed: 0,
            errors: [] as string[],
        };

        for (const candidate of candidates) {
            const result = type === 'acceptance'
                ? await this.sendAcceptanceEmail(candidate, companyInfo)
                : await this.sendRejectionEmail(candidate, companyInfo);

            if (result.success) {
                results.sent++;
            } else {
                results.failed++;
                results.errors.push(
                    `${candidate.email}: ${result.error || 'Unknown error'}`
                );
            }

            // Add small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        return results;
    }

    /**
     * Generate acceptance email HTML
     */
    private generateAcceptanceEmailHTML(
        candidate: CandidateEmailData,
        companyInfo: CompanyInfo
    ): string {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
   <h1 style="color: white; margin: 0; font-size: 24px;">Congratulations!</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style=" font-size: 16px;">Dear ${candidate.name},</p>
    
    <p style="font-size: 16px;">
      We are pleased to inform you that you have been <strong>shortlisted</strong> for the 
      <strong>${candidate.jobRole}</strong> position at <strong>${companyInfo.companyName}</strong>.
    </p>
    
    <p style="font-size: 16px;">
      Your skills and experience align well with our requirements. We would like to 
      invite you for the next round of interviews.
    </p>
    
    <div style="background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        <strong>Next Steps:</strong> Our HR team will contact you soon with interview details and scheduling information.
      </p>
    </div>
    
    <p style="font-size: 16px;">
      We look forward to speaking with you soon!
    </p>
    
    <p style="font-size: 16px; margin-top: 30px;">
      Best regards,<br>
      <strong>${companyInfo.hrName}</strong><br>
      ${companyInfo.companyName}
      ${companyInfo.companyWebsite ? `<br><a href="${companyInfo.companyWebsite}" style="color: #667eea;">${companyInfo.companyWebsite}</a>` : ''}
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>This is an automated message from ${companyInfo.companyName}</p>
  </div>
</body>
</html>
    `.trim();
    }

    /**
     * Generate rejection email HTML
     */
    private generateRejectionEmailHTML(
        candidate: CandidateEmailData,
        companyInfo: CompanyInfo
    ): string {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #4b5563; padding: 30px; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Application Update</h1>
  </div>
  
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Dear ${candidate.name},</p>
    
    <p style="font-size: 16px;">
      Thank you for your interest in the <strong>${candidate.jobRole}</strong> position at 
      <strong>${companyInfo.companyName}</strong> and for taking the time to apply and interview with our team.
    </p>
    
    <p style="font-size: 16px;">
      After careful review and consideration, we have decided to move forward with other candidates 
      whose qualifications more closely match our current needs for this role.
    </p>
    
    <div style="background: white; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px;">
      <p style="margin: 0; font-size: 14px; color: #666;">
        <strong>Important:</strong> This decision does not reflect on your abilities or potential. 
        We encourage you to apply for future openings that match your skills and experience.
      </p>
    </div>
    
    <p style="font-size: 16px;">
      We appreciate the time and effort you invested in your application and wish you the very 
      best in your job search and career endeavors.
    </p>
    
    <p style="font-size: 16px; margin-top: 30px;">
      Best regards,<br>
      <strong>${companyInfo.hrName}</strong><br>
      ${companyInfo.companyName}
      ${companyInfo.companyWebsite ? `<br><a href="${companyInfo.companyWebsite}" style="color: #4b5563;">${companyInfo.companyWebsite}</a>` : ''}
    </p>
  </div>
  
  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p>This is an automated message from ${companyInfo.companyName}</p>
  </div>
</body>
</html>
    `.trim();
    }
}

export const emailService = new EmailService();
