CREATE TABLE public.usuarios (
  id_correlativo SERIAL PRIMARY KEY,
  secreto_hash TEXT UNIQUE NOT NULL,
  genero TEXT, edad_rango TEXT, estado TEXT, municipio TEXT, parroquia TEXT,
  intereses TEXT[] NOT NULL DEFAULT '{}',
  fecha_registro TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.propuestas (
  id_propuesta SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES public.usuarios(id_correlativo) ON DELETE CASCADE,
  tipo_intencion TEXT NOT NULL,
  contenido TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'General',
  estado_propuesta TEXT NOT NULL DEFAULT 'Revision',
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.apoyos_propuestas (
  id_apoyo SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL REFERENCES public.usuarios(id_correlativo) ON DELETE CASCADE,
  id_propuesta INT NOT NULL REFERENCES public.propuestas(id_propuesta) ON DELETE CASCADE,
  voto_tipo TEXT NOT NULL,
  UNIQUE(id_usuario, id_propuesta)
);
CREATE TABLE public.votaciones_convocadas (
  id_votacion SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL, descripcion TEXT,
  alcance_geografico TEXT NOT NULL DEFAULT 'Nacional',
  estado_restriccion TEXT, municipio_restriccion TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  fecha_fin TIMESTAMPTZ NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT true
);
CREATE TABLE public.votos_finales (
  id_voto SERIAL PRIMARY KEY,
  id_votacion INT NOT NULL REFERENCES public.votaciones_convocadas(id_votacion) ON DELETE CASCADE,
  id_usuario INT NOT NULL REFERENCES public.usuarios(id_correlativo) ON DELETE CASCADE,
  opcion_seleccionada TEXT NOT NULL,
  UNIQUE(id_usuario, id_votacion)
);
GRANT ALL ON public.usuarios, public.propuestas, public.apoyos_propuestas, public.votaciones_convocadas, public.votos_finales TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.propuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apoyos_propuestas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votaciones_convocadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votos_finales ENABLE ROW LEVEL SECURITY;

INSERT INTO public.usuarios (secreto_hash, genero, edad_rango, estado, municipio, parroquia, intereses) VALUES
(encode(sha256('demo-1'::bytea),'hex'),'Mujer','26-40','Zulia','Maracaibo','Olegario Villalobos',ARRAY['Servicios','Salud']),
(encode(sha256('demo-2'::bytea),'hex'),'Hombre','19-25','Táchira','San Cristóbal','La Concordia',ARRAY['Educación','Tecnología']),
(encode(sha256('demo-3'::bytea),'hex'),'Venezx','13-18','Distrito Capital','Libertador','Catedral',ARRAY['Educación']),
(encode(sha256('demo-4'::bytea),'hex'),'Mujer','41-60','Carabobo','Valencia','San José',ARRAY['Economía']),
(encode(sha256('demo-5'::bytea),'hex'),'Hombre','+61','Zulia','San Francisco','San Francisco',ARRAY['Salud','Servicios']),
(encode(sha256('demo-6'::bytea),'hex'),'Mujer','19-25','Táchira','San Cristóbal','Pedro María Morantes',ARRAY['Tecnología','Economía']);

INSERT INTO public.propuestas (id_usuario, tipo_intencion, contenido, categoria, fecha_creacion) VALUES
(1,'Quiero','Necesitamos un horario estable de electricidad en Maracaibo; los cortes dañan neveras y medicinas.','Servicios', now()-interval '2 hours'),
(2,'Quiero','Programas de becas para jóvenes en carreras tecnológicas en San Cristóbal.','Educación', now()-interval '5 hours'),
(3,'No me gusta','Los liceos públicos no tienen agua potable en los baños.','Servicios', now()-interval '1 day'),
(4,'Quiero','Microcréditos para emprendedoras con bajos intereses.','Economía', now()-interval '1 day 3 hours'),
(5,'No me gusta','Faltan insumos básicos en el hospital universitario.','Salud', now()-interval '2 days'),
(6,'Me gusta','El nuevo punto de wifi gratuito en la plaza funciona muy bien; replicarlo.','Tecnología', now()-interval '3 days'),
(1,'Quiero','Recolección de basura dos veces por semana en mi parroquia.','Servicios', now()-interval '3 days 4 hours'),
(2,'No me gusta','El transporte público a la universidad es insuficiente en horas pico.','Servicios', now()-interval '4 days');

INSERT INTO public.apoyos_propuestas (id_usuario, id_propuesta, voto_tipo) VALUES
(2,1,'Apoyar'),(3,1,'Apoyar'),(4,1,'Apoyar'),(5,1,'Apoyar'),(6,2,'Apoyar'),(3,2,'Apoyar'),(1,5,'Apoyar'),(4,5,'Apoyar'),(2,3,'Apoyar'),(5,6,'Discrepar');

INSERT INTO public.votaciones_convocadas (titulo, descripcion, alcance_geografico, estado_restriccion, municipio_restriccion, fecha_inicio, fecha_fin, activa) VALUES
('Prioridad nacional: ¿plan de emergencia eléctrica?','Hito comunitario: más de 500 propuestas sobre electricidad. ¿Apoyas priorizar un plan nacional?','Nacional',NULL,NULL, now()-interval '2 days', now()+interval '12 days', true),
('Presupuesto escolar en Zulia','La IA detectó alta demanda de agua potable en liceos del Zulia.','Regional','Zulia',NULL, now()-interval '1 day', now()+interval '7 days', true),
('Ruta universitaria en San Cristóbal','¿Crear una ruta de transporte dedicada a la universidad?','Local','Táchira','San Cristóbal', now()-interval '1 day', now()+interval '5 days', true),
('Wifi en plazas públicas','Consulta concluida sobre ampliar puntos de wifi gratuito.','Nacional',NULL,NULL, now()-interval '30 days', now()-interval '10 days', false);

INSERT INTO public.votos_finales (id_votacion, id_usuario, opcion_seleccionada) VALUES
(4,1,'SI'),(4,2,'SI'),(4,3,'NO'),(4,4,'SI'),(4,5,'ABSTENCION'),(4,6,'SI');