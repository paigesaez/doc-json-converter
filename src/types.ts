export type Conversion = {
  main_topic: string;
  sub_topics: string[];
  edge_cases: string[];
};

export type SubmitPayload = {
  json: Conversion;
  meta: {
    source_hash: string;
    submitted_at: string;
    app_version: string;
  };
};

export type SubmitResponse = {
  sheet_url?: string;
};