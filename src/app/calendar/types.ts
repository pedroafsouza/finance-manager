export interface Transaction {
  id: number;
  entry_date: string;
  activity_type: string;
  ticker: string;
  lot_number?: number;
  num_shares?: number;
  share_price?: number;
  book_value?: number;
  market_value?: number;
  cash_value?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    transactions: Transaction[];
    totalValue: number;
    totalShares: number;
    activityTypes: string[];
    date: string;
  };
}

export interface ActivityColor {
  bg: string;
  border: string;
  text: string;
}

export type ActivityColorMap = Record<string, ActivityColor>;
