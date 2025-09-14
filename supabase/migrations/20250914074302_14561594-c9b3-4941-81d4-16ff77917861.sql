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