-- Create user profiles table with roles
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('farmer', 'processor', 'distributor', 'retailer', 'consumer')),
  organization_name TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create batches table to store blockchain batch information
CREATE TABLE public.batches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id TEXT NOT NULL UNIQUE,
  blockchain_address TEXT,
  qr_code_data TEXT,
  current_status TEXT NOT NULL DEFAULT 'active' CHECK (current_status IN ('active', 'sold', 'locked')),
  current_owner_id UUID REFERENCES public.profiles(id),
  created_by_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create batch transactions table for the supply chain history
CREATE TABLE public.batch_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES public.batches(batch_id),
  transaction_id TEXT NOT NULL UNIQUE,
  blockchain_hash TEXT,
  previous_hash TEXT,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('farmer', 'processor', 'distributor', 'retailer', 'consumer')),
  actor_id UUID NOT NULL REFERENCES public.profiles(id),
  cost_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  data JSONB NOT NULL DEFAULT '{}',
  correction_of TEXT REFERENCES public.batch_transactions(transaction_id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for batches
CREATE POLICY "Users can view all batches" ON public.batches FOR SELECT USING (true);
CREATE POLICY "Users can create batches" ON public.batches FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = created_by_id));
CREATE POLICY "Batch owners can update batches" ON public.batches FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = current_owner_id) 
  AND current_status = 'active'
);

-- Create policies for batch transactions
CREATE POLICY "Users can view all batch transactions" ON public.batch_transactions FOR SELECT USING (true);
CREATE POLICY "Users can create batch transactions" ON public.batch_transactions FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = actor_id)
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'consumer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert demo batch data
INSERT INTO public.profiles (user_id, email, full_name, role, organization_name, phone, address) VALUES 
('00000000-0000-0000-0000-000000000001', 'farmer@demo.com', 'Rajesh Kumar', 'farmer', 'Green Valley Farm', '+91-9876543210', 'Village Rampur, District Faridabad, Haryana'),
('00000000-0000-0000-0000-000000000002', 'processor@demo.com', 'Sunita Mills Pvt Ltd', 'processor', 'Sunita Agro Processing', '+91-9876543211', 'Industrial Area Phase-1, Gurgaon, Haryana'),
('00000000-0000-0000-0000-000000000003', 'distributor@demo.com', 'Delhi Distribution Co', 'distributor', 'FreshFlow Logistics', '+91-9876543212', 'Sector 18, Noida, Uttar Pradesh'),
('00000000-0000-0000-0000-000000000004', 'retailer@demo.com', 'Fresh Mart Store', 'retailer', 'Metro Fresh Retail', '+91-9876543213', 'Connaught Place, New Delhi'),
('00000000-0000-0000-0000-000000000005', 'consumer@demo.com', 'Priya Sharma', 'consumer', NULL, '+91-9876543214', 'Lajpat Nagar, New Delhi');

-- Insert demo batch
INSERT INTO public.batches (batch_id, qr_code_data, current_status, current_owner_id, created_by_id) VALUES 
('DEMO-BATCH-2025-001', 'DEMO-BATCH-2025-001', 'sold', 
 (SELECT id FROM public.profiles WHERE email = 'consumer@demo.com'),
 (SELECT id FROM public.profiles WHERE email = 'farmer@demo.com'));

-- Insert demo transactions
INSERT INTO public.batch_transactions (batch_id, transaction_id, actor_type, actor_id, cost_price, selling_price, data) VALUES 
('DEMO-BATCH-2025-001', 'TXN-FARMER-001', 'farmer', 
 (SELECT id FROM public.profiles WHERE email = 'farmer@demo.com'),
 0.00, 25.50,
 '{"farmId": "DEMO-FARM-001", "cropType": "Organic Wheat", "harvestDate": "2025-09-01", "quantityKg": 1200, "geoLocation": "28.6139,77.2090", "gs1": {"batchOrLot": "LOT-2025-001", "countryOfOrigin": "IN", "productionDate": "2025-09-01"}, "certificates": [{"certificateId": "FSSAI-DEMO-001", "issuer": "FSSAI", "verificationHash": "0xdemo_fssai_hash_001"}, {"certificateId": "ORGANIC-DEMO-001", "issuer": "India Organic Certification Agency", "verificationHash": "0xdemo_organic_hash_001"}]}'),

('DEMO-BATCH-2025-001', 'TXN-PROCESSOR-001', 'processor',
 (SELECT id FROM public.profiles WHERE email = 'processor@demo.com'),
 25.50, 24.00,
 '{"processorId": "DEMO-PROC-001", "processTypes": ["Milling", "Cleaning", "Grading"], "inputBatch": "DEMO-BATCH-2025-001", "outputQuantityKg": 1150, "processingDate": "2025-09-05", "gs1Gtin": "8901234567890"}'),

('DEMO-BATCH-2025-001', 'TXN-DISTRIBUTOR-001', 'distributor',
 (SELECT id FROM public.profiles WHERE email = 'distributor@demo.com'),
 24.00, 26.50,
 '{"distributorId": "DEMO-DIST-001", "dispatchDate": "2025-09-08", "transportMode": "Truck", "destinationGln": "GLN-DELHI-MARKET-001", "expiryDate": "2026-01-01"}'),

('DEMO-BATCH-2025-001', 'TXN-RETAILER-001', 'retailer',
 (SELECT id FROM public.profiles WHERE email = 'retailer@demo.com'),
 26.50, 28.00,
 '{"retailerId": "DEMO-RETAIL-001", "shelfDate": "2025-09-10", "retailPrice": 30.00, "retailLocationGln": "GLN-DELHI-STORE-001"}'),

('DEMO-BATCH-2025-001', 'TXN-CONSUMER-001', 'consumer',
 (SELECT id FROM public.profiles WHERE email = 'consumer@demo.com'),
 28.00, 28.00,
 '{"purchaseDate": "2025-09-12", "paymentMode": "UPI", "consumerId": "DEMO-CONSUMER-001"}');