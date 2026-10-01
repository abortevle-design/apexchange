const fs = require('node:fs');
const path = require('node:path');

const accountName = 'Sandra Bullock (Checking Account)';
const locations = [
  'Austin, TX', 'Dallas, TX', 'Houston, TX', 'Denver, CO',
  'Chicago, IL', 'Atlanta, GA', 'Phoenix, AZ', 'Raleigh, NC'
];
const everyday = [
  { description: 'Grocery purchase', merchant: 'H-E-B', category: 'Groceries', min: 24, max: 188 },
  { description: 'Fuel purchase', merchant: 'Shell', category: 'Transport', min: 28, max: 76 },
  { description: 'Restaurant purchase', merchant: 'Chili\'s Grill & Bar', category: 'Dining', min: 18, max: 112 },
  { description: 'Pharmacy purchase', merchant: 'CVS Pharmacy', category: 'Healthcare', min: 8, max: 94 },
  { description: 'Online purchase', merchant: 'Target', category: 'Shopping', min: 14, max: 220 },
  { description: 'Coffee shop purchase', merchant: 'Starbucks', category: 'Dining', min: 5, max: 28 },
  { description: 'Rideshare trip', merchant: 'Lyft', category: 'Transport', min: 9, max: 58 },
  { description: 'Home improvement purchase', merchant: 'The Home Depot', category: 'Shopping', min: 16, max: 340 }
];
const monthlyBills = {
  1: { description: 'Payroll deposit', merchant: 'Lone Star Software LLC', category: 'Income', min: 4200, max: 4650, type: 'credit' },
  3: { description: 'Monthly rent payment', merchant: 'Cedar Ridge Property Group', category: 'Housing', min: 1850, max: 1850 },
  5: { description: 'Electric utility bill', merchant: 'Austin Energy', category: 'Utilities', min: 82, max: 168 },
  7: { description: 'Water and waste bill', merchant: 'Austin Water', category: 'Utilities', min: 48, max: 76 },
  9: { description: 'Home internet bill', merchant: 'AT&T Fiber', category: 'Internet', min: 65, max: 85 },
  11: { description: 'Mobile phone bill', merchant: 'T-Mobile', category: 'Phone', min: 72, max: 96 },
  13: { description: 'Auto loan payment', merchant: 'Capital One Auto Finance', category: 'Loan Payment', min: 385, max: 385 },
  15: { description: 'Payroll deposit', merchant: 'Lone Star Software LLC', category: 'Income', min: 4200, max: 4650, type: 'credit' },
  17: { description: 'Grocery purchase', merchant: 'HEB Grocery', category: 'Groceries', min: 64, max: 205 },
  19: { description: 'Auto insurance premium', merchant: 'State Farm', category: 'Insurance', min: 138, max: 182 },
  21: { description: 'Natural gas utility bill', merchant: 'Texas Gas Service', category: 'Utilities', min: 32, max: 91 },
  23: { description: 'Streaming subscription', merchant: 'Netflix', category: 'Subscriptions', min: 15.49, max: 22.99 },
  25: { description: 'Health insurance premium', merchant: 'Blue Cross Blue Shield of Texas', category: 'Insurance', min: 245, max: 310 },
  27: { description: 'Grocery purchase', merchant: 'Walmart Supercenter', category: 'Groceries', min: 38, max: 162 }
};

function amountFor(item, seed) {
  const cents = Math.round((item.min + ((seed * 37) % 1000) / 1000 * (item.max - item.min)) * 100);
  return cents / 100;
}

function makeTransaction(date, index, item) {
  const type = item.type || 'debit';
  const amount = amountFor(item, index + date.getUTCDate());
  const dateText = date.toISOString().slice(0, 10);
  const location = item.category === 'Income' ? 'Austin, TX' : locations[index % locations.length];
  return {
    id: `TXN2026${String(index + 1).padStart(6, '0')}`,
    date: dateText,
    time: `${String(8 + (index % 12)).padStart(2, '0')}:${String((index * 17) % 60).padStart(2, '0')}`,
    description: item.description,
    merchant: item.merchant,
    sender: type === 'credit' ? item.merchant : accountName,
    receiver: type === 'credit' ? accountName : item.merchant,
    category: item.category,
    amount,
    type,
    paymentMethod: type === 'credit' ? 'ACH Direct Deposit' : (item.category === 'Housing' || item.category === 'Utilities' || item.category === 'Internet' || item.category === 'Phone' || item.category === 'Insurance' || item.category === 'Loan Payment' || item.category === 'Subscriptions' ? 'ACH Bill Pay' : 'Visa Debit'),
    status: 'Completed',
    referenceNumber: `US${dateText.replaceAll('-', '')}${String(index + 1).padStart(5, '0')}`,
    currency: 'USD',
    balanceAfter: 0,
    location
  };
}

const transactions = [];
let index = 0;
for (let month = 0; month < 9; month += 1) {
  const daysInMonth = new Date(Date.UTC(2026, month + 1, 0)).getUTCDate();
  const lastDay = month === 8 ? 29 : daysInMonth;
  for (let day = 1; day <= lastDay; day += 1) {
    const date = new Date(Date.UTC(2026, month, day));
    const bill = monthlyBills[day];
    if (bill) {
      transactions.push(makeTransaction(date, index++, bill));
    } else if (day % 3 === 0 || day % 5 === 0 || (month === 8 && day === 29)) {
      const purchase = everyday[(month * 31 + day) % everyday.length];
      transactions.push(makeTransaction(date, index++, purchase));
    }
  }
}

const netActivity = transactions.reduce((total, tx) => total + (tx.type === 'credit' ? tx.amount : -tx.amount), 0);
let balance = Number((2800000 - netActivity).toFixed(2));
transactions.forEach((tx) => {
  balance = Number((balance + (tx.type === 'credit' ? tx.amount : -tx.amount)).toFixed(2));
  tx.balanceAfter = balance;
});
transactions.sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));

fs.writeFileSync(
  path.join(__dirname, 'src', 'data', 'transactions.json'),
  `${JSON.stringify(transactions, null, 2)}\n`
);
