import { computeGrid, formatMoney, hasPackingCharge, resolvePackingPrice, resolveTravelLabel, type EstimatePayload } from '@/lib/adminEstimate';

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const renderEstimateHtml = (estimate: EstimatePayload) => {
  const showPacking = hasPackingCharge(estimate);
  const showTravel = (estimate.travelFee ?? 0) > 0;
  const packing = resolvePackingPrice(estimate);
  const travelLabel = resolveTravelLabel(estimate);
  const packingHeader = showPacking ? '<th>Pack</th>' : '';
  const travelHeader = showTravel ? '<th>Travel</th>' : '';
  const rows = computeGrid(estimate)
    .map(
      (row, index) => `
        <tr class="${index % 2 ? 'alt' : ''}">
          <td>${row.hours}</td><td>${formatMoney(row.labor)}</td>${showPacking ? `<td>${formatMoney(row.packing)}</td>` : ''}
          <td>${formatMoney(row.truckFee)}</td>${showTravel ? `<td>${formatMoney(row.travelFee)}</td>` : ''}<td>${formatMoney(row.total)}</td>
          <td>${formatMoney(row.depositPaid)}</td><td>${formatMoney(row.afterDeposit)}</td>
        </tr>`,
    )
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @page{margin:.4in}body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#07152F;font-size:12px}
    .header{display:flex;justify-content:space-between;border-bottom:2px solid #0E3A8A;padding-bottom:14px;margin-bottom:20px}
    .brand{font-size:19px;font-weight:800;color:#0E3A8A}.estimate{text-align:right}.estimate h1{font-size:24px;margin:0;color:#0E3A8A}
    h2{font-size:12px;text-transform:uppercase;letter-spacing:1.2px;color:#0E3A8A;border-bottom:1px solid rgba(14,58,138,.3);padding-bottom:5px;margin-top:20px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px}.notice{background:#EAF2FF;padding:12px;border-left:4px solid #E53935}
    table{border-collapse:collapse;width:100%;font-size:10px}th{background:#0E3A8A;color:white;padding:7px}td{padding:7px;border-bottom:1px solid #E5E7EB;text-align:right}td:first-child{text-align:center}.alt{background:rgba(100,116,139,.08)}
    .checklist{display:grid;grid-template-columns:1fr 1fr;gap:7px}.signature{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:32px}.line{border-top:1px solid #07152F;padding-top:5px;margin-top:24px}
    .footer{text-align:center;color:#64748B;margin-top:32px}.italic{font-style:italic;color:#64748B}
  </style></head><body>
    <div class="header"><div><div class="brand">MARLON MOVING SERVICES, LLC</div><div>USDOT #3470374</div><div>22054 Shaw Rd, Sterling, VA 20164</div><div>571-525-6129</div><div>marlonmovingservices@gmail.com</div><div>marlonmovingservices.com</div></div>
    <div class="estimate"><h1>ESTIMATE</h1><div>#${escapeHtml(estimate.estimateNumber)}</div><div>Date Issued: ${escapeHtml(estimate.issuedDate)}</div>${estimate.updatedCopy.isUpdatedCopy ? `<div>Updated: ${escapeHtml(estimate.updatedCopy.date)}</div>` : ''}</div></div>
    <h2>Customer Information</h2><div class="grid"><div><b>Name:</b> ${escapeHtml(estimate.contact.name)}</div><div><b>Phone:</b> ${escapeHtml(estimate.contact.phone)}</div><div><b>Email:</b> ${escapeHtml(estimate.contact.email)}</div></div>
    ${estimate.updatedCopy.isUpdatedCopy ? `<h2>Updated Copy Notice</h2><div class="notice">${escapeHtml(estimate.updatedCopy.notice)}</div>` : ''}
    <h2>Why Choose Marlon Moving Services</h2><div class="checklist"><div>✓ Licensed & insured</div><div>✓ Professional moving crews</div><div>✓ Clear arrival windows</div><div>✓ Written estimates</div><div>✓ Furniture protection</div><div>✓ Local Sterling team</div></div>
    <h2>Move Details</h2>${estimate.options.noTravelTime ? '<div class="italic">No travel time is charged on this estimate.</div>' : ''}
    <div class="grid"><div><b>Origin:</b> ${escapeHtml(estimate.addresses.origin)}</div><div><b>Destination:</b> ${escapeHtml(estimate.addresses.destination)}</div><div><b>Move date:</b> ${escapeHtml(estimate.schedule.moveDate)}</div><div><b>Arrival:</b> ${escapeHtml(estimate.schedule.arrivalWindow)}</div><div><b>Crew:</b> ${estimate.crew.size} movers</div><div><b>Truck:</b> ${escapeHtml(estimate.crew.truckSize)}</div>${travelLabel ? `<div><b>Travel Fee:</b> ${escapeHtml(travelLabel)}</div>` : ''}</div>
    <h2>Estimated Moving Costs</h2><table><thead><tr><th>Hours</th><th>Labor</th>${packingHeader}<th>Truck</th>${travelHeader}<th>Total</th><th>Deposit Paid</th><th>After Deposit</th></tr></thead><tbody>${rows}</tbody></table>
    ${showPacking ? `<h2>${escapeHtml(packing.label)} — ${formatMoney(packing.price)}</h2><p>Selected packing materials kit: ${escapeHtml(packing.label)}.</p>` : ''}
    <h2>Payment Terms</h2><p>Required deposit: ${formatMoney(estimate.deposit.requiredAmount)}. Paid: ${formatMoney(estimate.deposit.paidAmount)}. Status: ${escapeHtml(estimate.deposit.status)}.</p>
    <h2>Important Estimate Notice</h2><p>This estimate is based on the information supplied. Final charges may change if scope, inventory, access conditions, crew requirements, or service time changes.</p>
    ${estimate.notes ? `<h2>Notes</h2><p>${escapeHtml(estimate.notes)}</p>` : ''}
    <h2>Customer Approval</h2><div class="signature"><div><div class="line">Customer Signature</div><div class="line">Printed Name</div></div><div><div class="line">Date</div><div class="line">Marlon Moving Services Representative</div></div></div>
    <div class="footer">Thank you for considering Marlon Moving Services for your move.</div>
  </body></html>`;
};
