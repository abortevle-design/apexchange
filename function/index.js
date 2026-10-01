const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { Resend } = require("resend");

admin.initializeApp();
const db = admin.firestore();
const resend = new Resend(process.env.RESEND_API_KEY);

// Helper to format currency
function formatMoney(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
}

// Helper to send email via Resend
async function sendEmail({ to, subject, html, text }) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('Missing RESEND_API_KEY environment variable. Set RESEND_API_KEY in Firebase Functions config.');
  }

  const fromAddress = process.env.RESEND_FROM || 'Apex exchange bank <noreply@apexexchangebank.com>';
  return resend.emails.send({
    from: fromAddress,
    to,
    subject,
    html,
    text,
  });
}

// HTML email template builder
function getEmailTemplate(title, description, details) {
  const detailRows = Object.entries(details)
    .map(([key, val]) => `
      <tr>
        <td style="padding: 8px 0; color: #64748b; font-weight: 500; border-bottom: 1px solid #f1f5f9;">${key}</td>
        <td style="padding: 8px 0; color: #0B1F3A; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${val}</td>
      </tr>
    `)
    .join('');

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0B1F3A; background-color: #f8fafc; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
        <h2 style="color: #0B1F3A; font-size: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 16px; margin-top: 0; text-transform: uppercase; letter-spacing: 0.5px;">Apex exchange bank</h2>
        <h3 style="color: #c19a4f; margin-top: 24px; font-size: 18px; font-weight: 600;">${title}</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 24px;">${description}</p>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tbody>
            ${detailRows}
          </tbody>
        </table>
        <div style="margin-top: 40px; border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5;">
          Apex exchange bank AG · Berlin, Germany<br>Private banking, engineered for trust.
        </div>
      </div>
    </div>
  `;
}

// 1. Trigger when a transaction is first submitted
exports.onTransactionCreated = onDocumentCreated("transactions/{transactionId}", async (event) => {
  const tx = event.data.data();
  if (!tx || tx.status !== "Pending") return;

  console.log(`Processing onTransactionCreated trigger for Pending transfer ${event.params.transactionId}`);

  try {
    // Look up sender's email from the users collection
    const userDoc = await db.collection("users").doc(tx.userId).get();
    if (!userDoc.exists) {
      console.error(`User document not found for userId: ${tx.userId}`);
      return;
    }

    const userData = userDoc.data();
    const recipientEmail = userData.email;
    if (!recipientEmail) {
      console.warn(`No email address recorded for user: ${tx.userId}`);
      return;
    }

    const amountStr = formatMoney(Math.abs(tx.amount), tx.currency);

    const emailHtml = getEmailTemplate(
      "Transfer Request Received",
      "Your transfer request has been received successfully and is currently pending administrator approval.",
      {
        "Reference Number": tx.reference || tx.referenceNumber,
        "Amount": amountStr,
        "Recipient": tx.beneficiaryName,
        "Current Status": "Pending"
      }
    );

    await sendEmail({
      to: recipientEmail,
      subject: "Transfer Request Received",
      text: `Your transfer request has been received successfully.\n\nCurrent Status: Pending\nReference Number: ${tx.reference || tx.referenceNumber}\nAmount: ${amountStr}\nRecipient: ${tx.beneficiaryName}`,
      html: emailHtml
    });

    console.log(`Transfer received notification email queued for ${recipientEmail}`);
  } catch (error) {
    console.error("Error sending transfer received notification email:", error);
  }
});

// 2. Trigger when a transaction is approved or rejected
exports.onTransactionUpdated = onDocumentUpdated("transactions/{transactionId}", async (event) => {
  const prevTx = event.data.before.data();
  const nextTx = event.data.after.data();

  if (!prevTx || !nextTx) return;

  // Only trigger when the status changes from Pending to Successful or Rejected
  if (prevTx.status === "Pending" && (nextTx.status === "Successful" || nextTx.status === "Rejected")) {
    console.log(`Processing onTransactionUpdated status transition from Pending to ${nextTx.status} for transaction ${event.params.transactionId}`);

    try {
      // Look up customer email
      const userDoc = await db.collection("users").doc(nextTx.userId).get();
      if (!userDoc.exists) {
        console.error(`User document not found for userId: ${nextTx.userId}`);
        return;
      }

      const userData = userDoc.data();
      const recipientEmail = userData.email;
      if (!recipientEmail) {
        console.warn(`No email address recorded for user: ${nextTx.userId}`);
        return;
      }

      const amountStr = formatMoney(Math.abs(nextTx.amount), nextTx.currency);

      let subject = "";
      let title = "";
      let description = "";
      let details = {};

      if (nextTx.status === "Successful") {
        subject = "Transfer Approved";
        title = "Transfer Approved";
        description = "Your transfer has been approved and processed successfully.";
        details = {
          "Reference Number": nextTx.reference || nextTx.referenceNumber,
          "Amount": amountStr,
          "Recipient": nextTx.beneficiaryName,
          "Completion Date": nextTx.approvedAt ? new Date(nextTx.approvedAt).toLocaleDateString('en-IE') : new Date().toLocaleDateString('en-IE'),
          "Status": "Successful"
        };
      } else {
        subject = "Transfer Rejected";
        title = "Transfer Rejected";
        description = "Unfortunately your transfer request was rejected.";
        details = {
          "Reference Number": nextTx.reference || nextTx.referenceNumber,
          "Amount": amountStr,
          "Recipient": nextTx.beneficiaryName,
          "Status": "Rejected",
          "Reason": nextTx.rejectionReason || "Declined by Administrator"
        };
      }

      const emailHtml = getEmailTemplate(title, description, details);

      await sendEmail({
        to: recipientEmail,
        subject,
        text: `${description}\n\nStatus: ${nextTx.status}\nReference Number: ${nextTx.reference || nextTx.referenceNumber}\nAmount: ${amountStr}\nRecipient: ${nextTx.beneficiaryName}${nextTx.status === 'Rejected' ? `\nReason: ${nextTx.rejectionReason || 'Declined by Administrator'}` : ''}`,
        html: emailHtml
      });

      console.log(`Transfer ${nextTx.status.toLowerCase()} notification email queued for ${recipientEmail}`);
    } catch (error) {
      console.error("Error sending transaction transition email:", error);
    }
  }
});
