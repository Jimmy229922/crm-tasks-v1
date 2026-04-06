import { getLocaleFromEnvironment, getLocalizedString } from "../../../i18n/catalog";

export const STATUS_STYLES = {
  "In Progress": {
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    dot: "bg-blue-400",
  },
  IN_PROGRESS: {
    badge: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    dot: "bg-blue-400",
  },
  Pending: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  PENDING: {
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-400",
  },
  Done: {
    badge: "bg-green-500/15 text-green-300 border-green-500/30",
    dot: "bg-green-400",
  },
  DONE: {
    badge: "bg-green-500/15 text-green-300 border-green-500/30",
    dot: "bg-green-400",
  },
  Overdue: {
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
    dot: "bg-red-400",
  },
  OVERDUE: {
    badge: "bg-red-500/15 text-red-300 border-red-500/30",
    dot: "bg-red-400",
  },
  default: {
    badge: "bg-slate-500/15 text-slate-300 border-slate-500/30",
    dot: "bg-slate-300",
  },
};

export const CRM_TASK_STATUS_ENUM_OPTIONS = Object.freeze(["IN_PROGRESS", "PENDING", "DONE", "OVERDUE"]);

const CRM_TASK_STATUS_ENUM_BY_LABEL = Object.freeze({
  "In Progress": "IN_PROGRESS",
  Pending: "PENDING",
  Done: "DONE",
  Overdue: "OVERDUE",
});

const CRM_TASK_STATUS_LABEL_BY_ENUM = Object.freeze({
  IN_PROGRESS: "In Progress",
  PENDING: "Pending",
  DONE: "Done",
  OVERDUE: "Overdue",
});

const CRM_TASK_STATUS_TRANSLATION_KEY_BY_ENUM = Object.freeze({
  IN_PROGRESS: "statuses.inProgress",
  PENDING: "statuses.pending",
  DONE: "statuses.done",
  OVERDUE: "statuses.overdue",
});

export const CRM_TASK_TYPE_ENUM_BY_ID = Object.freeze({
  1: "LiveRegistrations",
  2: "DemoRegistrations",
  3: "TraderUpdate",
  4: "CustomTask",
  5: "ContactUsLeads",
  6: "Support",
  7: "TradingAccountOpening",
  8: "DemoAccountOpening",
  9: "IbOpening",
  10: "MamOpening",
  11: "InvestorOpening",
  12: "WithdrawalRequests",
  13: "ElectronicDeposits",
  14: "FundsTransfers",
  15: "InvestmentDeposits",
  16: "InvestmentWithdrawals",
  17: "KycHiveId",
  18: "LocalDeposit",
  19: "LocalWithdrawal",
  101: "MerchantRegistrations",
  111: "TypeIbReg",
  201: "WalletAccounts",
  212: "TypeWithdrawalFromRequest",
});

export const CRM_TASK_TYPE_LABEL_BY_KEY = Object.freeze({
  LiveRegistrations: "Live Registrations",
  DemoRegistrations: "Demo Registrations",
  TraderUpdate: "Trader Update",
  CustomTask: "Custom Task",
  ContactUsLeads: "Contact Us Leads",
  Support: "Support",
  TradingAccountOpening: "Trading Account Opening",
  DemoAccountOpening: "Demo Account Opening",
  IbOpening: "IB Opening",
  MamOpening: "MAM Opening",
  InvestorOpening: "Investor Opening",
  WithdrawalRequests: "Withdrawal Requests",
  ElectronicDeposits: "Electronic Deposits",
  FundsTransfers: "Funds Transfers",
  InvestmentDeposits: "Investment Deposits",
  InvestmentWithdrawals: "Investment Withdrawals",
  KycHiveId: "KYC Hive ID",
  LocalDeposit: "Local Deposit",
  LocalWithdrawal: "Local Withdrawal",
  MerchantRegistrations: "Merchant Registrations",
  TypeIbReg: "IB Registration",
  WalletAccounts: "Wallet Accounts",
  TypeWithdrawalFromRequest: "Withdrawal From Request",
});

const CRM_TASK_TYPE_TRANSLATION_KEY_BY_ENUM = Object.freeze({
  LiveRegistrations: "taskTypes.liveRegistrations",
  DemoRegistrations: "taskTypes.demoRegistrations",
  TraderUpdate: "taskTypes.traderUpdate",
  CustomTask: "taskTypes.customTask",
  ContactUsLeads: "taskTypes.contactUsLeads",
  Support: "taskTypes.support",
  TradingAccountOpening: "taskTypes.tradingAccountOpening",
  DemoAccountOpening: "taskTypes.demoAccountOpening",
  IbOpening: "taskTypes.ibOpening",
  MamOpening: "taskTypes.mamOpening",
  InvestorOpening: "taskTypes.investorOpening",
  WithdrawalRequests: "taskTypes.withdrawalRequests",
  ElectronicDeposits: "taskTypes.electronicDeposits",
  FundsTransfers: "taskTypes.fundsTransfers",
  InvestmentDeposits: "taskTypes.investmentDeposits",
  InvestmentWithdrawals: "taskTypes.investmentWithdrawals",
  KycHiveId: "taskTypes.kycHiveId",
  LocalDeposit: "taskTypes.localDeposit",
  LocalWithdrawal: "taskTypes.localWithdrawal",
  MerchantRegistrations: "taskTypes.merchantRegistrations",
  TypeIbReg: "taskTypes.ibRegistration",
  WalletAccounts: "taskTypes.walletAccounts",
  TypeWithdrawalFromRequest: "taskTypes.withdrawalFromRequest",
  Onboarding: "taskTypes.onboarding",
  "Follow-up": "taskTypes.followUp",
  "Contract Review": "taskTypes.contractReview",
  "Technical Support": "taskTypes.technicalSupport",
  "KYC Update": "taskTypes.kycUpdate",
  Escalation: "taskTypes.escalation",
});

export const TYPE_STYLES = {
  Onboarding: "bg-indigo-500/15 text-indigo-200 border-indigo-500/30",
  "Follow-up": "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  "Contract Review": "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30",
  "Technical Support": "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  "KYC Update": "bg-violet-500/15 text-violet-200 border-violet-500/30",
  Escalation: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  LiveRegistrations: "bg-indigo-500/15 text-indigo-200 border-indigo-500/30",
  DemoRegistrations: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  TraderUpdate: "bg-amber-500/15 text-amber-200 border-amber-500/30",
  CustomTask: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  ContactUsLeads: "bg-sky-500/15 text-sky-200 border-sky-500/30",
  Support: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  TradingAccountOpening: "bg-blue-500/15 text-blue-200 border-blue-500/30",
  DemoAccountOpening: "bg-cyan-500/15 text-cyan-200 border-cyan-500/30",
  IbOpening: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30",
  MamOpening: "bg-purple-500/15 text-purple-200 border-purple-500/30",
  InvestorOpening: "bg-indigo-500/15 text-indigo-200 border-indigo-500/30",
  WithdrawalRequests: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  ElectronicDeposits: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  FundsTransfers: "bg-teal-500/15 text-teal-200 border-teal-500/30",
  InvestmentDeposits: "bg-green-500/15 text-green-200 border-green-500/30",
  InvestmentWithdrawals: "bg-orange-500/15 text-orange-200 border-orange-500/30",
  KycHiveId: "bg-violet-500/15 text-violet-200 border-violet-500/30",
  LocalDeposit: "bg-emerald-500/15 text-emerald-200 border-emerald-500/30",
  LocalWithdrawal: "bg-rose-500/15 text-rose-200 border-rose-500/30",
  MerchantRegistrations: "bg-pink-500/15 text-pink-200 border-pink-500/30",
  TypeIbReg: "bg-fuchsia-500/15 text-fuchsia-200 border-fuchsia-500/30",
  WalletAccounts: "bg-blue-500/15 text-blue-200 border-blue-500/30",
  TypeWithdrawalFromRequest: "bg-red-500/15 text-red-200 border-red-500/30",
  default: "bg-slate-700 text-slate-200 border-slate-600",
};

export const UI_STATES = ["loading", "success", "empty", "error"];
export const PAGE_SIZE_OPTIONS = [5, 10, 20];

const BASE_TASKS = [
  {
    id: 1,
    client: {
      name: "Client Name A",
      email: "client.a@example.com",
      phone: "+0000000001",
      initials: "CA",
      color: "bg-indigo-500",
      company: "Company Alpha LLC",
      accountId: "ACC-1001",
      country: "UAE",
      address: "Business Bay, Dubai",
      industry: "Fintech",
      joinedAt: "Jan 2024",
    },
    type: "Onboarding",
    status: "In Progress",
    priority: "High",
    assignee: {
      name: "Assignee Name A",
      role: "Account Manager",
      initials: "AA",
      color: "bg-indigo-400",
      email: "assignee.a@example.com",
    },
    created: "Mar 15, 2026",
    due: "Apr 05, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Mar 15, 2026", note: "Initial onboarding task added." },
      { title: "Owner assigned", at: "Mar 16, 2026", note: "Assigned to Account Manager." },
      { title: "Progress updated", at: "Mar 30, 2026", note: "Waiting for final client documents." },
    ],
    actions: ["Action 1", "Action 2", "Mark Complete"],
  },
  {
    id: 2,
    client: {
      name: "Client Name B",
      email: "client.b@example.com",
      phone: "+0000000002",
      initials: "CB",
      color: "bg-purple-500",
      company: "Company Beta Trading",
      accountId: "ACC-1002",
      country: "KSA",
      address: "King Fahd Road, Riyadh",
      industry: "Trading",
      joinedAt: "Feb 2024",
    },
    type: "Follow-up",
    status: "Pending",
    priority: "Medium",
    assignee: {
      name: "Assignee Name B",
      role: "Sales Rep",
      initials: "AB",
      color: "bg-cyan-500",
      email: "assignee.b@example.com",
    },
    created: "Mar 28, 2026",
    due: "Apr 03, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Mar 28, 2026", note: "Client requested a callback." },
      { title: "Reminder sent", at: "Mar 29, 2026", note: "Follow-up reminder sent internally." },
      { title: "Awaiting action", at: "Apr 01, 2026", note: "Call to be completed by assignee." },
    ],
    actions: ["Action 1", "Action 2"],
  },
  {
    id: 3,
    client: {
      name: "Client Name C",
      email: "client.c@example.com",
      phone: "+0000000003",
      initials: "CC",
      color: "bg-blue-500",
      company: "Company Gamma Ventures",
      accountId: "ACC-1003",
      country: "Egypt",
      address: "New Cairo, Cairo",
      industry: "Investment",
      joinedAt: "Mar 2024",
    },
    type: "Contract Review",
    status: "Done",
    priority: "Low",
    assignee: {
      name: "Assignee Name C",
      role: "Legal Lead",
      initials: "AC",
      color: "bg-emerald-500",
      email: "assignee.c@example.com",
    },
    created: "Mar 10, 2026",
    due: "Mar 25, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Mar 10, 2026", note: "Review draft agreement terms." },
      { title: "Legal comments added", at: "Mar 18, 2026", note: "Risk clauses refined." },
      { title: "Task completed", at: "Mar 24, 2026", note: "Final review approved." },
    ],
    actions: ["View Summary", "Archive"],
  },
  {
    id: 4,
    client: {
      name: "Client Name D",
      email: "client.d@example.com",
      phone: "+0000000004",
      initials: "CD",
      color: "bg-emerald-500",
      company: "Company Delta Services",
      accountId: "ACC-1004",
      country: "Qatar",
      address: "West Bay, Doha",
      industry: "Technology",
      joinedAt: "Apr 2024",
    },
    type: "Technical Support",
    status: "Overdue",
    priority: "High",
    assignee: {
      name: "Assignee Name D",
      role: "Support Engineer",
      initials: "AD",
      color: "bg-green-600",
      email: "assignee.d@example.com",
    },
    created: "Mar 18, 2026",
    due: "Mar 30, 2026",
    isOverdue: true,
    timeline: [
      { title: "Task created", at: "Mar 18, 2026", note: "Urgent platform issue reported." },
      { title: "Escalated", at: "Mar 22, 2026", note: "Escalated to L2 support." },
      { title: "SLA breached", at: "Mar 30, 2026", note: "Marked overdue pending resolution." },
    ],
    actions: ["Action 1", "Escalate", "Close"],
  },
  {
    id: 5,
    client: {
      name: "Client Name E",
      email: "client.e@example.com",
      phone: "+0000000005",
      initials: "CE",
      color: "bg-violet-500",
      company: "Company Epsilon Corp",
      accountId: "ACC-1005",
      country: "Bahrain",
      address: "Seef District, Manama",
      industry: "Compliance",
      joinedAt: "May 2024",
    },
    type: "KYC Update",
    status: "In Progress",
    priority: "Medium",
    assignee: {
      name: "Assignee Name E",
      role: "Compliance Specialist",
      initials: "AE",
      color: "bg-violet-600",
      email: "assignee.e@example.com",
    },
    created: "Mar 21, 2026",
    due: "Apr 06, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Mar 21, 2026", note: "Annual KYC refresh required." },
      { title: "Document request sent", at: "Mar 23, 2026", note: "Waiting for updated ID proof." },
    ],
    actions: ["Action 1", "Action 2"],
  },
  {
    id: 6,
    client: {
      name: "Client Name F",
      email: "client.f@example.com",
      phone: "+0000000006",
      initials: "CF",
      color: "bg-teal-500",
      company: "Company Zeta Holdings",
      accountId: "ACC-1006",
      country: "Jordan",
      address: "Abdali, Amman",
      industry: "Operations",
      joinedAt: "Jun 2024",
    },
    type: "Onboarding",
    status: "Pending",
    priority: "Medium",
    assignee: {
      name: "Assignee Name F",
      role: "Operations Analyst",
      initials: "AF",
      color: "bg-teal-600",
      email: "assignee.f@example.com",
    },
    created: "Mar 24, 2026",
    due: "Apr 08, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Mar 24, 2026", note: "New account provisioning pending." },
      { title: "Awaiting documents", at: "Mar 27, 2026", note: "Pending signed onboarding form." },
    ],
    actions: ["Action 1", "Action 2"],
  },
  {
    id: 7,
    client: {
      name: "Client Name G",
      email: "client.g@example.com",
      phone: "+0000000007",
      initials: "CG",
      color: "bg-fuchsia-500",
      company: "Company Eta Group",
      accountId: "ACC-1007",
      country: "Kuwait",
      address: "Sharq, Kuwait City",
      industry: "Advisory",
      joinedAt: "Jul 2024",
    },
    type: "Escalation",
    status: "Done",
    priority: "High",
    assignee: {
      name: "Assignee Name G",
      role: "Team Lead",
      initials: "AG",
      color: "bg-rose-500",
      email: "assignee.g@example.com",
    },
    created: "Mar 05, 2026",
    due: "Mar 20, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Mar 05, 2026", note: "Escalation opened for delayed transfer." },
      { title: "Resolved", at: "Mar 18, 2026", note: "Issue resolved with client confirmation." },
    ],
    actions: ["View Summary", "Reopen"],
  },
  {
    id: 8,
    client: {
      name: "Client Name H",
      email: "client.h@example.com",
      phone: "+0000000008",
      initials: "CH",
      color: "bg-orange-500",
      company: "Company Theta Partners",
      accountId: "ACC-1008",
      country: "Oman",
      address: "Al Khuwair, Muscat",
      industry: "Relationship Management",
      joinedAt: "Aug 2024",
    },
    type: "Follow-up",
    status: "Pending",
    priority: "Low",
    assignee: {
      name: "Assignee Name H",
      role: "Relationship Manager",
      initials: "AH",
      color: "bg-orange-600",
      email: "assignee.h@example.com",
    },
    created: "Mar 26, 2026",
    due: "Apr 10, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Mar 26, 2026", note: "Client requested strategy follow-up." },
      { title: "Pending call", at: "Mar 31, 2026", note: "Scheduling call with advisor." },
    ],
    actions: ["Action 1", "Action 2"],
  },
  {
    id: 9,
    client: {
      name: "Client Name I",
      email: "client.i@example.com",
      phone: "+0000000009",
      initials: "CI",
      color: "bg-sky-500",
      company: "Company Iota Systems",
      accountId: "ACC-1009",
      country: "UAE",
      address: "JLT, Dubai",
      industry: "SaaS",
      joinedAt: "Sep 2024",
    },
    type: "Technical Support",
    status: "In Progress",
    priority: "High",
    assignee: {
      name: "Assignee Name I",
      role: "Platform Specialist",
      initials: "AI",
      color: "bg-sky-600",
      email: "assignee.i@example.com",
    },
    created: "Mar 29, 2026",
    due: "Apr 11, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Mar 29, 2026", note: "API connection issue under review." },
      { title: "Investigation started", at: "Mar 30, 2026", note: "Logs collected for diagnostics." },
    ],
    actions: ["Action 1", "Action 2", "Add Note"],
  },
  {
    id: 10,
    client: {
      name: "Client Name A",
      email: "client.a@example.com",
      phone: "+0000000001",
      initials: "CA",
      color: "bg-indigo-500",
      company: "Company Alpha LLC",
      accountId: "ACC-1001",
      country: "UAE",
      address: "Business Bay, Dubai",
      industry: "Fintech",
      joinedAt: "Jan 2024",
    },
    type: "Follow-up",
    status: "Pending",
    priority: "Medium",
    assignee: {
      name: "Assignee Name A",
      role: "Account Manager",
      initials: "AA",
      color: "bg-indigo-400",
      email: "assignee.a@example.com",
    },
    created: "Apr 01, 2026",
    due: "Apr 15, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Apr 01, 2026", note: "Quarterly relationship follow-up opened." },
      { title: "Internal note", at: "Apr 02, 2026", note: "Client requested revised onboarding timeline." },
    ],
    actions: ["Action 1", "Action 2"],
  },
  {
    id: 11,
    client: {
      name: "Client Name D",
      email: "client.d@example.com",
      phone: "+0000000004",
      initials: "CD",
      color: "bg-emerald-500",
      company: "Company Delta Services",
      accountId: "ACC-1004",
      country: "Qatar",
      address: "West Bay, Doha",
      industry: "Technology",
      joinedAt: "Apr 2024",
    },
    type: "Technical Support",
    status: "Done",
    priority: "High",
    assignee: {
      name: "Assignee Name D",
      role: "Support Engineer",
      initials: "AD",
      color: "bg-green-600",
      email: "assignee.d@example.com",
    },
    created: "Mar 01, 2026",
    due: "Mar 08, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Mar 01, 2026", note: "Environment latency issue logged." },
      { title: "Fix deployed", at: "Mar 06, 2026", note: "Patch deployed and validated with client." },
      { title: "Task completed", at: "Mar 07, 2026", note: "Client confirmed stability restored." },
    ],
    actions: ["View Summary", "Archive"],
  },
  {
    id: 12,
    client: {
      name: "Client Name I",
      email: "client.i@example.com",
      phone: "+0000000009",
      initials: "CI",
      color: "bg-sky-500",
      company: "Company Iota Systems",
      accountId: "ACC-1009",
      country: "UAE",
      address: "JLT, Dubai",
      industry: "SaaS",
      joinedAt: "Sep 2024",
    },
    type: "Escalation",
    status: "Pending",
    priority: "High",
    assignee: {
      name: "Assignee Name I",
      role: "Platform Specialist",
      initials: "AI",
      color: "bg-sky-600",
      email: "assignee.i@example.com",
    },
    created: "Apr 02, 2026",
    due: "Apr 09, 2026",
    isOverdue: false,
    timeline: [
      { title: "Escalation created", at: "Apr 02, 2026", note: "Client reported intermittent API timeout spikes." },
      { title: "Engineering assigned", at: "Apr 03, 2026", note: "Escalated to backend reliability squad." },
    ],
    actions: ["Action 1", "Escalate", "Add Note"],
  },
  {
    id: 13,
    client: {
      name: "Client Name J",
      email: "client.j@example.com",
      phone: "+0000000010",
      initials: "CJ",
      color: "bg-pink-500",
      company: "Company Kappa Markets",
      accountId: "ACC-1010",
      country: "KSA",
      address: "Olaya District, Riyadh",
      industry: "Brokerage",
      joinedAt: "Oct 2024",
    },
    type: "Onboarding",
    status: "In Progress",
    priority: "High",
    assignee: {
      name: "Assignee Name J",
      role: "Onboarding Specialist",
      initials: "AJ",
      color: "bg-pink-600",
      email: "assignee.j@example.com",
    },
    created: "Apr 03, 2026",
    due: "Apr 20, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Apr 03, 2026", note: "Enterprise onboarding checklist initiated." },
      { title: "Kickoff meeting", at: "Apr 04, 2026", note: "Stakeholders aligned on rollout plan." },
    ],
    actions: ["Action 1", "Action 2", "Mark Complete"],
  },
  {
    id: 14,
    client: {
      name: "Client Name B",
      email: "client.b@example.com",
      phone: "+0000000002",
      initials: "CB",
      color: "bg-purple-500",
      company: "Company Beta Trading",
      accountId: "ACC-1002",
      country: "KSA",
      address: "King Fahd Road, Riyadh",
      industry: "Trading",
      joinedAt: "Feb 2024",
    },
    type: "KYC Update",
    status: "In Progress",
    priority: "Medium",
    assignee: {
      name: "Assignee Name B",
      role: "Sales Rep",
      initials: "AB",
      color: "bg-cyan-500",
      email: "assignee.b@example.com",
    },
    created: "Apr 01, 2026",
    due: "Apr 12, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Apr 01, 2026", note: "Client KYC refresh required by compliance." },
      { title: "Documents partially received", at: "Apr 03, 2026", note: "Address proof still pending." },
    ],
    actions: ["Action 1", "Action 2"],
  },
  {
    id: 15,
    client: {
      name: "Client Name K",
      email: "client.k@example.com",
      phone: "+0000000011",
      initials: "CK",
      color: "bg-lime-500",
      company: "Company Lambda Capital",
      accountId: "ACC-1011",
      country: "Egypt",
      address: "Smart Village, Giza",
      industry: "Asset Management",
      joinedAt: "Nov 2024",
    },
    type: "Contract Review",
    status: "Overdue",
    priority: "High",
    assignee: {
      name: "Assignee Name K",
      role: "Legal Specialist",
      initials: "AK",
      color: "bg-lime-600",
      email: "assignee.k@example.com",
    },
    created: "Mar 20, 2026",
    due: "Mar 27, 2026",
    isOverdue: true,
    timeline: [
      { title: "Task created", at: "Mar 20, 2026", note: "Master agreement legal review requested." },
      { title: "Deadline missed", at: "Mar 27, 2026", note: "Pending final risk clause validation." },
    ],
    actions: ["Escalate", "Action 2"],
  },
  {
    id: 16,
    client: {
      name: "Client Name C",
      email: "client.c@example.com",
      phone: "+0000000003",
      initials: "CC",
      color: "bg-blue-500",
      company: "Company Gamma Ventures",
      accountId: "ACC-1003",
      country: "Egypt",
      address: "New Cairo, Cairo",
      industry: "Investment",
      joinedAt: "Mar 2024",
    },
    type: "Follow-up",
    status: "Pending",
    priority: "Low",
    assignee: {
      name: "Assignee Name C",
      role: "Legal Lead",
      initials: "AC",
      color: "bg-emerald-500",
      email: "assignee.c@example.com",
    },
    created: "Apr 04, 2026",
    due: "Apr 18, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Apr 04, 2026", note: "Post-contract relationship follow-up opened." },
      { title: "Awaiting confirmation", at: "Apr 05, 2026", note: "Waiting for client approval on addendum." },
    ],
    actions: ["Action 1", "Action 2"],
  },
  {
    id: 17,
    client: {
      name: "Client Name L",
      email: "client.l@example.com",
      phone: "+0000000012",
      initials: "CL",
      color: "bg-emerald-500",
      company: "Company Mu Advisory",
      accountId: "ACC-1012",
      country: "UAE",
      address: "Deira, Dubai",
      industry: "Advisory",
      joinedAt: "Dec 2024",
    },
    type: "Onboarding",
    status: "In Progress",
    priority: "High",
    assignee: {
      name: "Assignee Name L",
      role: "Account Manager",
      initials: "AL",
      color: "bg-blue-500",
      email: "assignee.l@example.com",
    },
    created: "Apr 05, 2026",
    due: "Apr 20, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Apr 05, 2026", note: "Client onboarding initiated." },
      { title: "Docs requested", at: "Apr 06, 2026", note: "Waiting for incorporation documents." },
    ],
    actions: ["Action 1", "Action 2"],
  },
  {
    id: 18,
    client: {
      name: "Client Name M",
      email: "client.m@example.com",
      phone: "+0000000013",
      initials: "CM",
      color: "bg-sky-500",
      company: "Company Nu Trading",
      accountId: "ACC-1013",
      country: "KSA",
      address: "Jeddah Corniche, Jeddah",
      industry: "Trading",
      joinedAt: "Dec 2024",
    },
    type: "Follow-up",
    status: "Pending",
    priority: "Medium",
    assignee: {
      name: "Assignee Name M",
      role: "Sales Rep",
      initials: "AM",
      color: "bg-cyan-500",
      email: "assignee.m@example.com",
    },
    created: "Apr 06, 2026",
    due: "Apr 14, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Apr 06, 2026", note: "Client requested product clarification." },
      { title: "Call scheduled", at: "Apr 07, 2026", note: "Follow-up call planned with sales team." },
    ],
    actions: ["Action 1", "Action 2"],
  },
  {
    id: 19,
    client: {
      name: "Client Name N",
      email: "client.n@example.com",
      phone: "+0000000014",
      initials: "CN",
      color: "bg-purple-500",
      company: "Company Xi Logistics",
      accountId: "ACC-1014",
      country: "Egypt",
      address: "Nasr City, Cairo",
      industry: "Logistics",
      joinedAt: "Jan 2025",
    },
    type: "Technical Support",
    status: "Overdue",
    priority: "High",
    assignee: {
      name: "Assignee Name N",
      role: "Support Engineer",
      initials: "AN",
      color: "bg-emerald-600",
      email: "assignee.n@example.com",
    },
    created: "Mar 30, 2026",
    due: "Apr 04, 2026",
    isOverdue: true,
    timeline: [
      { title: "Task created", at: "Mar 30, 2026", note: "Client reported integration issue." },
      { title: "Escalated", at: "Apr 02, 2026", note: "Escalated to engineering for deep investigation." },
    ],
    actions: ["Escalate", "Action 2"],
  },
  {
    id: 20,
    client: {
      name: "Client Name O",
      email: "client.o@example.com",
      phone: "+0000000015",
      initials: "CO",
      color: "bg-pink-500",
      company: "Company Omicron Finance",
      accountId: "ACC-1015",
      country: "Qatar",
      address: "The Pearl, Doha",
      industry: "Finance",
      joinedAt: "Jan 2025",
    },
    type: "Contract Review",
    status: "Done",
    priority: "Low",
    assignee: {
      name: "Assignee Name O",
      role: "Legal Lead",
      initials: "AO",
      color: "bg-violet-500",
      email: "assignee.o@example.com",
    },
    created: "Apr 01, 2026",
    due: "Apr 09, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Apr 01, 2026", note: "Agreement review requested by client." },
      { title: "Task completed", at: "Apr 08, 2026", note: "Final legal approval completed." },
    ],
    actions: ["View Summary", "Archive"],
  },
  {
    id: 21,
    client: {
      name: "Client Name P",
      email: "client.p@example.com",
      phone: "+0000000016",
      initials: "CP",
      color: "bg-blue-500",
      company: "Company Pi Holdings",
      accountId: "ACC-1016",
      country: "Bahrain",
      address: "Seef, Manama",
      industry: "Holding",
      joinedAt: "Feb 2025",
    },
    type: "KYC Update",
    status: "In Progress",
    priority: "Medium",
    assignee: {
      name: "Assignee Name P",
      role: "Compliance Specialist",
      initials: "AP",
      color: "bg-indigo-500",
      email: "assignee.p@example.com",
    },
    created: "Apr 07, 2026",
    due: "Apr 21, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Apr 07, 2026", note: "Annual KYC refresh started." },
      { title: "Docs pending", at: "Apr 08, 2026", note: "Client to submit proof of address." },
    ],
    actions: ["Action 1", "Action 2"],
  },
  {
    id: 22,
    client: {
      name: "Client Name Q",
      email: "client.q@example.com",
      phone: "+0000000017",
      initials: "CQ",
      color: "bg-teal-500",
      company: "Company Rho Group",
      accountId: "ACC-1017",
      country: "Jordan",
      address: "Shmeisani, Amman",
      industry: "Services",
      joinedAt: "Feb 2025",
    },
    type: "Escalation",
    status: "Pending",
    priority: "High",
    assignee: {
      name: "Assignee Name Q",
      role: "Team Lead",
      initials: "AQ",
      color: "bg-rose-500",
      email: "assignee.q@example.com",
    },
    created: "Apr 08, 2026",
    due: "Apr 16, 2026",
    isOverdue: false,
    timeline: [
      { title: "Escalation created", at: "Apr 08, 2026", note: "Client escalation logged for delayed response." },
      { title: "Pending review", at: "Apr 09, 2026", note: "Waiting for management action." },
    ],
    actions: ["Escalate", "Action 2"],
  },
  {
    id: 23,
    client: {
      name: "Client Name R",
      email: "client.r@example.com",
      phone: "+0000000018",
      initials: "CR",
      color: "bg-fuchsia-500",
      company: "Company Sigma Markets",
      accountId: "ACC-1018",
      country: "Oman",
      address: "Al Khuwair, Muscat",
      industry: "Brokerage",
      joinedAt: "Mar 2025",
    },
    type: "Technical Support",
    status: "In Progress",
    priority: "Medium",
    assignee: {
      name: "Assignee Name R",
      role: "Platform Specialist",
      initials: "AR",
      color: "bg-sky-600",
      email: "assignee.r@example.com",
    },
    created: "Apr 09, 2026",
    due: "Apr 22, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Apr 09, 2026", note: "Platform timeout issue reported." },
      { title: "Work in progress", at: "Apr 10, 2026", note: "Logs collected and analyzed." },
    ],
    actions: ["Action 1", "Action 2"],
  },
  {
    id: 24,
    client: {
      name: "Client Name S",
      email: "client.s@example.com",
      phone: "+0000000019",
      initials: "CS",
      color: "bg-lime-500",
      company: "Company Tau Ventures",
      accountId: "ACC-1019",
      country: "UAE",
      address: "Abu Dhabi Corniche, Abu Dhabi",
      industry: "Investment",
      joinedAt: "Mar 2025",
    },
    type: "Onboarding",
    status: "Pending",
    priority: "Low",
    assignee: {
      name: "Assignee Name S",
      role: "Operations Analyst",
      initials: "AS",
      color: "bg-teal-600",
      email: "assignee.s@example.com",
    },
    created: "Apr 10, 2026",
    due: "Apr 25, 2026",
    isOverdue: false,
    timeline: [
      { title: "Task created", at: "Apr 10, 2026", note: "Onboarding checklist prepared." },
      { title: "Pending kickoff", at: "Apr 11, 2026", note: "Client kickoff call awaiting confirmation." },
    ],
    actions: ["Action 1", "Action 2"],
  },
];

const CLIENT_ALIAS_BY_EMAIL = new Map();
const ASSIGNEE_ALIAS_BY_EMAIL = new Map();

const CLIENT_PROFILES = [
  { name: "Ahmed Youssef", email: "ahmed.youssef@innovatech.com", phone: "+20 100 123 4567" },
  { name: "Nour El-Din", email: "nour.eldin@futurecorp.com", phone: "+20 111 234 5678" },
  { name: "Laila Mahmoud", email: "laila.mahmoud@visionary-designs.com", phone: "+20 112 345 6789" },
  { name: "Hassan Ali", email: "hassan.ali@logistics-pro.com", phone: "+20 113 456 7890" },
  { name: "Fatima Zahra", email: "fatima.zahra@edutech-solutions.com", phone: "+20 114 567 8901" },
  { name: "Tariq Mansour", email: "tariq.mansour@marketbridge.com", phone: "+20 115 678 9012" },
  { name: "Mona Ibrahim", email: "mona.ibrahim@nextwave-holdings.com", phone: "+20 116 789 0123" },
  { name: "Omar Khaled", email: "omar.khaled@globalventures.com", phone: "+20 117 890 1234" },
  { name: "Sara Nabil", email: "sara.nabil@finaxisgroup.com", phone: "+20 118 901 2345" },
  { name: "Youssef Adel", email: "youssef.adel@prime-consulting.com", phone: "+20 119 012 3456" },
  { name: "Hana Mostafa", email: "hana.mostafa@bluehorizon.ai", phone: "+20 120 123 4567" },
  { name: "Karim Samir", email: "karim.samir@orioncapital.co", phone: "+20 121 234 5678" },
];

const ASSIGNEE_PROFILES = [
  { name: "Sarah Ahmed", email: "sarah.ahmed@crm-team.com" },
  { name: "Omar Khaled", email: "omar.khaled@crm-team.com" },
  { name: "Mona Hassan", email: "mona.hassan@crm-team.com" },
  { name: "Yara Nasser", email: "yara.nasser@crm-team.com" },
  { name: "Mahmoud Tarek", email: "mahmoud.tarek@crm-team.com" },
  { name: "Lina Adel", email: "lina.adel@crm-team.com" },
  { name: "Hadi Emad", email: "hadi.emad@crm-team.com" },
  { name: "Nora Fathy", email: "nora.fathy@crm-team.com" },
  { name: "Ali Samy", email: "ali.samy@crm-team.com" },
  { name: "Mariam Salah", email: "mariam.salah@crm-team.com" },
  { name: "Amr Wagdy", email: "amr.wagdy@crm-team.com" },
  { name: "Dina Sherif", email: "dina.sherif@crm-team.com" },
];

function getStableAliasIndex(map, key) {
  if (!map.has(key)) {
    map.set(key, map.size + 1);
  }

  return map.get(key);
}

function getInitials(fullName) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function getProfileFromList(list, index) {
  return list[(index - 1) % list.length];
}

export const MOCK_TASKS = BASE_TASKS.map((task) => {
  const clientIndex = getStableAliasIndex(CLIENT_ALIAS_BY_EMAIL, task.client.email);
  const assigneeIndex = getStableAliasIndex(ASSIGNEE_ALIAS_BY_EMAIL, task.assignee.email);

  const clientProfile = getProfileFromList(CLIENT_PROFILES, clientIndex);
  const assigneeProfile = getProfileFromList(ASSIGNEE_PROFILES, assigneeIndex);

  return {
    ...task,
    client: {
      ...task.client,
      ...clientProfile,
      initials: getInitials(clientProfile.name),
      accountId: `c${clientIndex}`,
    },
    assignee: {
      ...task.assignee,
      ...assigneeProfile,
      initials: getInitials(assigneeProfile.name),
    },
  };
});

const CUSTOM_TASKS_STORAGE_KEY = "crmTasksV1CustomTasks";

function getStoredCustomTasks() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CUSTOM_TASKS_STORAGE_KEY);
    const parsed = rawValue ? JSON.parse(rawValue) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (task) =>
        task
        && (typeof task.id === "number" || typeof task.id === "string")
        && task.client
        && typeof task.client.email === "string"
    );
  } catch {
    return [];
  }
}

function getAllTasks() {
  return [...getStoredCustomTasks(), ...MOCK_TASKS];
}

function normalizeTaskStatus(status) {
  if (status === null || status === undefined) {
    return "";
  }

  const normalized = String(status).trim();
  if (!normalized) {
    return "";
  }

  if (CRM_TASK_STATUS_LABEL_BY_ENUM[normalized]) {
    return normalized;
  }

  return CRM_TASK_STATUS_ENUM_BY_LABEL[normalized] || normalized;
}

export function getStatusLabel(status) {
  const normalized = normalizeTaskStatus(status);
  const translationKey = CRM_TASK_STATUS_TRANSLATION_KEY_BY_ENUM[normalized];

  if (!translationKey) {
    return String(status || "");
  }

  return getLocalizedString(translationKey, {
    locale: getLocaleFromEnvironment(),
    fallback: CRM_TASK_STATUS_LABEL_BY_ENUM[normalized] || String(status || ""),
  });
}

function toIsoString(dateValue) {
  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }

  return parsed.toISOString();
}

export function formatIsoDateForDisplay(isoDate) {
  const parsed = new Date(isoDate);

  if (Number.isNaN(parsed.getTime())) {
    return getLocalizedString("common.na", {
      locale: getLocaleFromEnvironment(),
      fallback: "N/A",
    });
  }

  const locale = getLocaleFromEnvironment() === "ar" ? "ar-EG" : "en-US";

  return parsed.toLocaleDateString(locale, {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function mapTaskToListItem(task) {
  const taskType = getTaskTypeKeyFromTask(task);
  const status = normalizeTaskStatus(task.status);

  return {
    id: task.id,
    client: {
      name: task.client?.name || "N/A",
      email: task.client?.email || "N/A",
    },
    taskType,
    status,
    assignee: {
      name: task.assignee?.name || "N/A",
      role: task.assignee?.role || "N/A",
      initials: task.assignee?.initials || "NA",
      color: task.assignee?.color || "bg-slate-500",
    },
    createdAt: toIsoString(task.created),
    dueDate: toIsoString(task.due),
  };
}

function filterListItems(items, search, status, taskType) {
  const normalizedSearch = String(search || "").trim().toLowerCase();
  const normalizedStatus = normalizeTaskStatus(status);
  const normalizedType = normalizeTaskTypeKey(taskType);

  return items.filter((item) => {
    const byStatus = normalizedStatus ? item.status === normalizedStatus : true;
    const byType = normalizedType ? item.taskType === normalizedType : true;

    const searchBlob = `${item.client.name} ${item.client.email} ${item.assignee.name} ${item.assignee.role} ${item.taskType}`.toLowerCase();
    const bySearch = normalizedSearch ? searchBlob.includes(normalizedSearch) : true;

    return byStatus && byType && bySearch;
  });
}

export function listCrmTasksLocal(params = {}) {
  const requestedPage = Number(params.page) || 1;
  const requestedPerPage = Number(params.perPage) || 20;
  const page = Math.max(1, requestedPage);
  const perPage = Math.max(1, requestedPerPage);

  const items = getAllTasks().map(mapTaskToListItem);
  const filtered = filterListItems(items, params.search, params.status, params.taskType);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const normalizedPage = Math.min(page, totalPages);
  const start = (normalizedPage - 1) * perPage;
  const paginatedItems = filtered.slice(start, start + perPage);

  return {
    items: paginatedItems,
    page: normalizedPage,
    perPage,
    totalItems,
    totalPages,
  };
}

export function fetchCrmTasksLocal(params = {}) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(listCrmTasksLocal(params));
    }, 220);
  });
}

export function getAllCrmTaskTypeKeys() {
  return Array.from(new Set(getAllTasks().map((task) => getTaskTypeKeyFromTask(task)).filter(Boolean)));
}

export function getMetrics(tasks) {
  return [
    { label: "Total Tasks", count: tasks.length, color: "bg-slate-300" },
    {
      label: "In Progress",
      count: tasks.filter((task) => normalizeTaskStatus(task.status) === "IN_PROGRESS").length,
      color: "bg-blue-500",
    },
    {
      label: "Overdue",
      count: tasks.filter((task) => normalizeTaskStatus(task.status) === "OVERDUE" || task.isOverdue).length,
      color: "bg-red-500",
    },
    {
      label: "Completed",
      count: tasks.filter((task) => normalizeTaskStatus(task.status) === "DONE").length,
      color: "bg-green-500",
    },
  ];
}

export function getStatusClasses(status) {
  return STATUS_STYLES[status] || STATUS_STYLES[normalizeTaskStatus(status)] || STATUS_STYLES.default;
}

export function getTypeClasses(type) {
  return TYPE_STYLES[type] || TYPE_STYLES.default;
}

function getRawTaskType(task) {
  return task?.typeId ?? task?.taskType ?? task?.type ?? "";
}

export function normalizeTaskTypeKey(rawType) {
  if (rawType === null || rawType === undefined) {
    return "";
  }

  if (typeof rawType === "number") {
    return CRM_TASK_TYPE_ENUM_BY_ID[rawType] || String(rawType);
  }

  const normalized = String(rawType).trim();
  if (!normalized) {
    return "";
  }

  if (/^\d+$/.test(normalized)) {
    return CRM_TASK_TYPE_ENUM_BY_ID[Number(normalized)] || normalized;
  }

  return normalized;
}

export function getTaskTypeLabel(rawType) {
  const typeKey = normalizeTaskTypeKey(rawType);

  if (!typeKey) {
    return getLocalizedString("common.na", {
      locale: getLocaleFromEnvironment(),
      fallback: "N/A",
    });
  }

  const translationKey = CRM_TASK_TYPE_TRANSLATION_KEY_BY_ENUM[typeKey];
  const fallback = CRM_TASK_TYPE_LABEL_BY_KEY[typeKey] || typeKey;

  if (!translationKey) {
    return fallback;
  }

  return getLocalizedString(translationKey, {
    locale: getLocaleFromEnvironment(),
    fallback,
  });
}

export function getTaskTypeKeyFromTask(task) {
  return normalizeTaskTypeKey(getRawTaskType(task));
}

export function getTaskTypeLabelFromTask(task) {
  return getTaskTypeLabel(getRawTaskType(task));
}

export function getSuggestions(tasks, searchTerm) {
  const normalized = searchTerm.trim().toLowerCase();
  const uniqueClients = Array.from(new Map(tasks.map((task) => [task.client.email, task.client])).values());

  if (!normalized) {
    return uniqueClients.slice(0, 5);
  }

  return uniqueClients
    .filter((client) => {
      const fullText = `${client.name} ${client.email} ${client.phone} ${client.company}`.toLowerCase();
      return fullText.includes(normalized);
    })
    .slice(0, 5);
}

export function filterTasks(tasks, searchTerm, selectedType, selectedStatus) {
  const normalized = searchTerm.trim().toLowerCase();
  const normalizedSelectedStatus = normalizeTaskStatus(selectedStatus);

  return tasks.filter((task) => {
    const taskTypeKey = getTaskTypeKeyFromTask(task);
    const taskTypeLabel = getTaskTypeLabel(taskTypeKey);

    const byType = selectedType ? taskTypeKey === selectedType : true;
    const byStatus = normalizedSelectedStatus ? normalizeTaskStatus(task.status) === normalizedSelectedStatus : true;

    const searchBlob = `${task.client.name} ${task.client.email} ${task.client.phone} ${task.client.company} ${task.assignee.name} ${taskTypeLabel}`.toLowerCase();
    const bySearch = normalized ? searchBlob.includes(normalized) : true;

    return byType && byStatus && bySearch;
  });
}

export function getTaskById(taskId) {
  return getAllTasks().find((task) => String(task.id) === String(taskId));
}

export function getTasksByClientEmail(email) {
  return getAllTasks().filter((task) => task.client.email === email);
}
