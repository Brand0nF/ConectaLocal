CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text := COALESCE(NEW.raw_user_meta_data->>'tipo','cliente');
BEGIN
  IF t NOT IN ('cliente','trabajador') THEN t := 'cliente'; END IF;
  INSERT INTO public.profiles (id, nombre, tipo)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'nombre',''), NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), t)
  ON CONFLICT (id) DO NOTHING;
  IF lower(NEW.email) = 'conectalocaladmin@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;