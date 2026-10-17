
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre text NOT NULL DEFAULT '',
  tipo text NOT NULL DEFAULT 'cliente' CHECK (tipo IN ('cliente','trabajador')),
  creado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE TABLE public.oficios (
  id serial PRIMARY KEY,
  nombre text NOT NULL UNIQUE,
  icono text NOT NULL DEFAULT 'wrench'
);
CREATE TABLE public.sectores (
  id serial PRIMARY KEY,
  nombre text NOT NULL UNIQUE
);
GRANT SELECT ON public.oficios, public.sectores TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.oficios, public.sectores TO authenticated;
GRANT ALL ON public.oficios, public.sectores TO service_role;
GRANT USAGE ON SEQUENCE public.oficios_id_seq, public.sectores_id_seq TO authenticated;
ALTER TABLE public.oficios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.oficios FOR SELECT USING (true);
CREATE POLICY "public read" ON public.sectores FOR SELECT USING (true);
CREATE POLICY "admin write" ON public.oficios FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin write" ON public.sectores FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.trabajadores (
  id serial PRIMARY KEY,
  user_id uuid UNIQUE,
  nombre text NOT NULL CHECK (char_length(nombre) BETWEEN 2 AND 100),
  whatsapp text NOT NULL CHECK (whatsapp ~ '^569[0-9]{8}$'),
  oficio_id int NOT NULL REFERENCES public.oficios(id),
  sector_id int NOT NULL REFERENCES public.sectores(id),
  tarifa text NOT NULL CHECK (char_length(tarifa) BETWEEN 1 AND 80),
  descripcion text NOT NULL CHECK (char_length(descripcion) BETWEEN 1 AND 200),
  foto_url text,
  disponible boolean NOT NULL DEFAULT true,
  destacado boolean NOT NULL DEFAULT false,
  creado_en timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trabajadores TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.trabajadores TO authenticated;
GRANT ALL ON public.trabajadores TO service_role;
GRANT USAGE ON SEQUENCE public.trabajadores_id_seq TO authenticated;
ALTER TABLE public.trabajadores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.trabajadores FOR SELECT USING (true);
CREATE POLICY "own insert" ON public.trabajadores FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "own or admin update" ON public.trabajadores FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own or admin delete" ON public.trabajadores FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.proteger_destacado() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(),'admin') THEN
    IF TG_OP = 'INSERT' THEN NEW.destacado := false;
    ELSIF NEW.destacado IS DISTINCT FROM OLD.destacado OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'No autorizado';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_proteger_destacado BEFORE INSERT OR UPDATE ON public.trabajadores FOR EACH ROW EXECUTE FUNCTION public.proteger_destacado();

CREATE TABLE public.resenas (
  id serial PRIMARY KEY,
  trabajador_id int NOT NULL REFERENCES public.trabajadores(id) ON DELETE CASCADE,
  usuario_id uuid,
  autor_nombre text NOT NULL DEFAULT 'Cliente',
  estrellas smallint NOT NULL CHECK (estrellas BETWEEN 1 AND 5),
  comentario text NOT NULL DEFAULT '' CHECK (char_length(comentario) <= 300),
  creado_en timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trabajador_id, usuario_id)
);
GRANT SELECT ON public.resenas TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.resenas TO authenticated;
GRANT ALL ON public.resenas TO service_role;
GRANT USAGE ON SEQUENCE public.resenas_id_seq TO authenticated;
ALTER TABLE public.resenas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON public.resenas FOR SELECT USING (true);
CREATE POLICY "client insert" ON public.resenas FOR INSERT TO authenticated WITH CHECK (
  usuario_id = auth.uid()
  AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.tipo = 'cliente')
  AND NOT EXISTS (SELECT 1 FROM public.trabajadores t WHERE t.id = trabajador_id AND t.user_id = auth.uid())
);
CREATE POLICY "own update" ON public.resenas FOR UPDATE TO authenticated USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
CREATE POLICY "own or admin delete" ON public.resenas FOR DELETE TO authenticated USING (usuario_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t text := COALESCE(NEW.raw_user_meta_data->>'tipo','cliente');
BEGIN
  IF t NOT IN ('cliente','trabajador') THEN t := 'cliente'; END IF;
  INSERT INTO public.profiles (id, nombre, tipo)
  VALUES (NEW.id, COALESCE(NULLIF(NEW.raw_user_meta_data->>'nombre',''), NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), t)
  ON CONFLICT (id) DO NOTHING;
  IF lower(NEW.email) = 'admin@conectalocal.cl' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

INSERT INTO public.oficios (id, nombre, icono) VALUES
(1,'Gasfitería','droplets'),(2,'Electricidad','zap'),(3,'Pintura','paint-roller'),(4,'Jardinería','sprout'),
(5,'Carpintería','hammer'),(6,'Cerrajería','key-round'),(7,'Mueblista','armchair'),(8,'Mecánico','car');
SELECT setval('public.oficios_id_seq', 8);
INSERT INTO public.sectores (id, nombre) VALUES
(1,'Temuco'),(2,'Labranza'),(3,'Pedro de Valdivia'),(4,'Padre las Casas'),(5,'Fundo El Carmen'),(6,'Pueblo Nuevo'),(7,'Centro'),(8,'Amanecer'),(9,'Santa Rosa');
SELECT setval('public.sectores_id_seq', 9);
INSERT INTO public.trabajadores (id, nombre, whatsapp, oficio_id, sector_id, tarifa, descripcion, disponible, destacado, creado_en) VALUES
(1,'Marcelo Vidal','56900000001',1,1,'Desde $15.000 la visita','Filtraciones, destape de cañerías e instalación de grifería.',true,true,'2026-10-01 23:10:54+00'),
(2,'Carla Núñez','56900000002',2,1,'Desde $18.000 la visita','Tableros, enchufes, luminarias y corte de luz.',true,false,'2026-10-01 23:10:54+00'),
(3,'Iván Soto','56900000003',3,2,'$8.000 por hora','Pintura interior y exterior, reparación de muros.',false,false,'2026-10-01 23:10:54+00'),
(4,'Patricia Reyes','56900000004',4,4,'$7.000 por hora','Poda, mantención de jardines y riego.',true,false,'2026-10-01 23:10:54+00'),
(5,'Hugo Contreras','56900000005',5,3,'Presupuesto sin costo','Muebles a medida, puertas y reparaciones de madera.',true,false,'2026-10-01 23:10:54+00'),
(6,'Daniela Fuentes','56900000006',6,1,'Desde $20.000','Apertura de puertas, cambio de chapas y llaves.',false,false,'2026-10-01 23:10:54+00'),
(7,'Juan Pedro','56969192903',2,4,'Desde $15.000 la visita','Arreglos de casas, electrodomésticos entre otras cosas más.',true,false,'2026-10-02 02:01:47+00');
SELECT setval('public.trabajadores_id_seq', 7);
INSERT INTO public.resenas (id, trabajador_id, autor_nombre, estrellas, comentario, creado_en) VALUES
(1,1,'Nicolas Rivera',5,'Excelente trabajo, muy puntual y ordenado. Lo recomiendo totalmente.','2026-10-02 02:53:52+00'),
(2,2,'Nicolas Rivera',4,'Buen trabajo, aunque se demoró un poco más de lo acordado.','2026-10-02 02:53:52+00'),
(3,7,'Nicolas Rivera',5,'Muy buen trabajador, cumplió con lo que dijo, aunque se demoró un poco más de lo establecido.','2026-10-02 03:06:40+00'),
(4,1,'Federico',1,'No me gustó el trabajo realizado, se demoró en llegar y no realizó lo pedido de buena manera.','2026-10-06 00:04:14+00');
SELECT setval('public.resenas_id_seq', 4);

CREATE POLICY "fotos public read" ON storage.objects FOR SELECT USING (bucket_id = 'fotos');
CREATE POLICY "fotos own upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'fotos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "fotos own update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'fotos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "fotos own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'fotos' AND (storage.foldername(name))[1] = auth.uid()::text);
