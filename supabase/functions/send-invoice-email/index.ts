import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvoiceEmailRequest {
  recipientEmail: string;
  recipientName: string;
  invoiceNumber: string;
  invoiceTotal: string;
  companyName: string;
  companyEmail: string;
  dueDate: string | null;
  pdfBase64?: string;
  documentType?: string; // 'Tax Invoice', 'Proforma Invoice', 'Quotation'
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const resend = new Resend(RESEND_API_KEY);

    const {
      recipientEmail,
      recipientName,
      invoiceNumber,
      invoiceTotal,
      companyName,
      companyEmail,
      dueDate,
      pdfBase64,
      documentType = 'Tax Invoice',
    }: InvoiceEmailRequest = await req.json();

    // Validate required fields
    if (!recipientEmail || !invoiceNumber) {
      throw new Error("Missing required fields: recipientEmail or invoiceNumber");
    }

    // Prepare attachments if PDF is provided
    const attachments = pdfBase64 ? [
      {
        filename: `${invoiceNumber}.pdf`,
        content: Uint8Array.from(atob(pdfBase64), c => c.charCodeAt(0)),
      },
    ] : [];

    const dueDateLabel = documentType === 'Quotation' ? 'Valid Until' : 'Due Date';
    const dueDateText = dueDate 
      ? documentType === 'Quotation'
        ? `This quotation is valid until ${new Date(dueDate).toLocaleDateString('en-GB')}.`
        : `Payment is due by ${new Date(dueDate).toLocaleDateString('en-GB')}.`
      : documentType === 'Quotation'
        ? 'This quotation is valid for 30 days.'
        : 'Please process payment at your earliest convenience.';

    const documentLabel = documentType === 'Quotation' ? 'Quotation No' : 
                          documentType === 'Proforma Invoice' ? 'PI No' : 'Invoice Number';

    // Use Resend's onboarding email for unverified domains
    // To use your own domain, verify it at https://resend.com/domains
    const emailResponse = await resend.emails.send({
      from: `${companyName} <onboarding@resend.dev>`,
      replyTo: companyEmail || undefined,
      to: [recipientEmail],
      subject: `${documentType} ${invoiceNumber} from ${companyName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #2962FF 0%, #1E88E5 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">${companyName}</h1>
          </div>
          
          <div style="background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="margin-bottom: 20px;">Dear ${recipientName || 'Valued Customer'},</p>
            
            <p>Please find attached your ${documentType} <strong>${invoiceNumber}</strong> for the amount of <strong>AED ${invoiceTotal}</strong>.</p>
            
            <p>${dueDateText}</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">${documentLabel}:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold;">${invoiceNumber}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">Total Amount:</td>
                  <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #2962FF;">AED ${invoiceTotal}</td>
                </tr>
                ${dueDate ? `
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;">${dueDateLabel}:</td>
                  <td style="padding: 8px 0; text-align: right;">${new Date(dueDate).toLocaleDateString('en-GB')}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            <p>If you have any questions regarding this ${documentType.toLowerCase()}, please don't hesitate to contact us.</p>
            
            <p style="margin-top: 30px;">
              Best regards,<br>
              <strong>${companyName}</strong>
            </p>
          </div>
          
          <div style="background: #1f2937; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
            <p style="color: #9ca3af; margin: 0; font-size: 12px;">
              This email was sent from ${companyName}. Please do not reply directly to this email.
            </p>
          </div>
        </body>
        </html>
      `,
      attachments,
    });

    console.log("Invoice email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-invoice-email function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
