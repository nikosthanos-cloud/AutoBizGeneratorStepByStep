/**
 * Single package in the generated proposal (Starter, Pro, Enterprise).
 */
export interface ProposalPackage {
  name: string;
  price: number;
  currency: string;
  features: string[];
}

/**
 * JSON structure returned by generateProposal(leadId).
 */
export interface ProposalPackagesDto {
  starter: ProposalPackage;
  pro: ProposalPackage;
  enterprise: ProposalPackage;
}
