import { formatMoney } from '../components/common';

export function printReceipt(tx) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) {
    alert('Please allow popups to view and print the receipt.');
    return;
  }

  // Helper to ensure any legacy Nova Bank reference is transformed to Apex exchange bank
  const cleanBankName = (val) => {
    if (!val || typeof val !== 'string') return 'Apex exchange bank';
    return val
      .replace(/\bNova\s*Bank\b/gi, 'Apex exchange bank')
      .replace(/\bNova\b/gi, 'Apex exchange bank');
  };

  // Format dates nicely
  const dateObj = new Date(tx.createdAt || `${tx.date}T${tx.time}`);
  const displayDate = isNaN(dateObj.getTime()) ? tx.date : dateObj.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
  const displayTime = tx.time || (isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  const amountFormatted = formatMoney(Math.abs(tx.amount), tx.currency || 'USD');
  const feeFormatted = formatMoney(tx.transferFee || tx.fee || 0, tx.currency || 'USD');
  const totalFormatted = formatMoney(Math.abs(tx.amount) + (tx.transferFee || tx.fee || 0), tx.currency || 'USD');
  const receiptStatus = tx.status || 'Pending';
  const statusColor = receiptStatus === 'Successful' ? '#1e8a5f' : receiptStatus === 'Rejected' ? '#dc2626' : '#c19a4f';

  const beneficiaryBank = cleanBankName(tx.beneficiaryBank || tx.bank || 'Apex exchange bank');
  const senderName = cleanBankName(tx.senderName || tx.sender?.replace(/ \(Checking Account\)/, '') || 'Sandra Bullock');
  const beneficiaryName = cleanBankName(tx.beneficiaryName || tx.receiver || '');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Apex exchange bank - Transaction Receipt - ${tx.transactionId || tx.id}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0B1F3A;
            margin: 0;
            padding: 40px;
            background-color: #f8fafc;
          }
          .receipt-card {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 10px 25px rgba(11, 31, 58, 0.05);
            padding: 40px;
            border: 1px solid #e2e8f0;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #f1f5f9;
            padding-bottom: 25px;
          }
          .logo {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.5px;
            color: #0B1F3A;
            margin: 0 0 5px 0;
            text-transform: uppercase;
          }
          .tagline {
            font-size: 11px;
            color: #c19a4f;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin: 0;
            font-weight: 600;
          }
          .receipt-title {
            font-size: 16px;
            color: #64748b;
            margin: 20px 0 0 0;
            font-weight: 500;
          }
          .amount-section {
            text-align: center;
            margin-bottom: 30px;
          }
          .amount-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .amount-val {
            font-size: 32px;
            font-weight: 700;
            color: #0B1F3A;
            margin: 0;
          }
          .status-badge {
            display: inline-block;
            background-color: ${receiptStatus === 'Successful' ? 'rgba(30, 138, 95, 0.1)' : receiptStatus === 'Rejected' ? 'rgba(220, 38, 38, 0.1)' : 'rgba(193, 154, 79, 0.12)'};
            color: ${statusColor};
            padding: 6px 14px;
            border-radius: 50px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .details-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 16px;
            margin-bottom: 30px;
          }
          .details-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            padding-bottom: 12px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
          }
          .details-row:last-child {
            border-bottom: none;
            margin-top: 5px;
            padding-top: 10px;
            border-top: 2px dashed #e2e8f0;
          }
          .label {
            color: #64748b;
            font-weight: 500;
          }
          .value {
            color: #0B1F3A;
            font-weight: 600;
            text-align: right;
            max-width: 60%;
            word-break: break-all;
          }
          .total-label {
            font-size: 15px;
            font-weight: 700;
            color: #0B1F3A;
          }
          .total-value {
            font-size: 18px;
            font-weight: 700;
            color: #c19a4f;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            border-top: 1px solid #f1f5f9;
            padding-top: 25px;
          }
          .support-title {
            font-size: 13px;
            font-weight: 600;
            color: #0B1F3A;
            margin: 0 0 5px 0;
          }
          .support-text {
            font-size: 12px;
            color: #64748b;
            margin: 0;
            line-height: 1.5;
          }
          .btn-container {
            display: flex;
            gap: 12px;
            justify-content: center;
            margin-top: 30px;
          }
          .btn {
            background-color: #0B1F3A;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .btn:hover {
            opacity: 0.9;
          }
          .btn-secondary {
            background-color: transparent;
            color: #0B1F3A;
            border: 1px solid #e2e8f0;
          }
          .btn-secondary:hover {
            background-color: #f1f5f9;
          }
          @media print {
            body {
              background-color: white;
              padding: 0;
            }
            .receipt-card {
              box-shadow: none;
              padding: 0;
              border: none;
            }
            .btn-container {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt-card">
          <div class="header">
            <h1 class="logo">Apex exchange bank</h1>
            <p class="tagline">Private banking, engineered for trust.</p>
            <h2 class="receipt-title">Transaction Receipt</h2>
          </div>

          <div class="amount-section">
            <p class="amount-label">Amount Transferred</p>
            <p class="amount-val">${amountFormatted}</p>
            <span class="status-badge">${receiptStatus}</span>
          </div>

          <div class="details-grid">
            <div class="details-row">
              <span class="label">Bank Name</span>
              <span class="value">Apex exchange bank</span>
            </div>
            <div class="details-row">
              <span class="label">Transaction ID</span>
              <span class="value">${tx.transactionId || tx.id}</span>
            </div>
            <div class="details-row">
              <span class="label">Reference Number</span>
              <span class="value">${tx.reference || tx.referenceNumber}</span>
            </div>
            <div class="details-row">
              <span class="label">Sender Name</span>
              <span class="value">${senderName}</span>
            </div>
            <div class="details-row">
              <span class="label">Sender Account Number</span>
              <span class="value">DE${tx.senderAccount || tx.senderAccountNumber || '5320130'}</span>
            </div>
            <div class="details-row">
              <span class="label">Beneficiary Name</span>
              <span class="value">${beneficiaryName}</span>
            </div>
            <div class="details-row">
              <span class="label">Beneficiary Account</span>
              <span class="value">${tx.beneficiaryAccount || tx.iban || ''}</span>
            </div>
            <div class="details-row">
              <span class="label">Beneficiary Bank</span>
              <span class="value">${beneficiaryBank}</span>
            </div>
            <div class="details-row">
              <span class="label">Transfer Date</span>
              <span class="value">${displayDate}</span>
            </div>
            <div class="details-row">
              <span class="label">Transfer Time</span>
              <span class="value">${displayTime}</span>
            </div>
            <div class="details-row">
              <span class="label">Transfer Fee</span>
              <span class="value">${feeFormatted}</span>
            </div>
            <div class="details-row">
              <span class="label total-label">Total Debited</span>
              <span class="value total-value">${totalFormatted}</span>
            </div>
          </div>

          <div class="footer">
            <h4 class="support-title">Apex exchange bank Support</h4>
            <p class="support-text">
              If you have any questions regarding this transfer, please contact support via the Help Center or call +49 (0) 30 2004-0.
            </p>
          </div>

          <div class="btn-container">
            <button class="btn" onclick="window.print()">Print / Save PDF</button>
            <button class="btn btn-secondary" onclick="window.close()">Close</button>
          </div>
        </div>
      </body>
    </html>
  `;
  
  // Guarantee that no occurrence of Nova Bank can appear anywhere in the rendered receipt
  const sanitizedHtml = html
    .replace(/\bNova\s*Bank\b/gi, 'Apex exchange bank')
    .replace(/\bNova\b/gi, 'Apex exchange bank');

  printWindow.document.write(sanitizedHtml);
  printWindow.document.close();
}
