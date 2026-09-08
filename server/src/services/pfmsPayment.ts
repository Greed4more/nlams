import crypto from "crypto";

/**
 * Mock PFMS (Public Financial Management System) Direct Benefit Transfer
 * gateway — ported from Bhumitra's pfms_payment.stub.js. Built against the
 * Ministry of Finance PFMS reporting schema; no live PFMS access exists
 * without a state MoU, so this simulates the DBT confirmation receipt.
 */
export interface PfmsPaymentInput {
  proposalId: string;
  parcelId: string;
  amount: number;
}

export interface PfmsReceipt {
  status: "SUCCESS";
  pfmsTransactionId: string;
  bankReferenceNumber: string;
  disbursedAmount: number;
  beneficiaryStatus: "ACCOUNT_VALIDATED_DBT_CREDITED";
  processedAt: string;
  pfmsResponseCode: "PFMS_00_SUCCESS";
  remarks: string;
}

export async function processPfmsPayment(input: PfmsPaymentInput): Promise<PfmsReceipt> {
  const pfmsTransactionId = `PFMS2026${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
  const bankReferenceNumber = `UBIN${Math.floor(100000000 + Math.random() * 900000000)}`;

  return {
    status: "SUCCESS",
    pfmsTransactionId,
    bankReferenceNumber,
    disbursedAmount: input.amount,
    beneficiaryStatus: "ACCOUNT_VALIDATED_DBT_CREDITED",
    processedAt: new Date().toISOString(),
    pfmsResponseCode: "PFMS_00_SUCCESS",
    remarks: "Direct Benefit Transfer successfully credited under RFCTLARR Act 2013 Statutory Scheme.",
  };
}
