-- Enable realtime for ledger_accounts
ALTER PUBLICATION supabase_realtime ADD TABLE ledger_accounts;

-- Enable realtime for ledger_entries  
ALTER PUBLICATION supabase_realtime ADD TABLE ledger_entries;