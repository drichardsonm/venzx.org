CREATE TABLE public.propuesta_actividad (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_propuesta integer NOT NULL REFERENCES public.propuestas(id_propuesta) ON DELETE CASCADE,
  id_usuario integer NOT NULL REFERENCES public.usuarios(id_correlativo) ON DELETE CASCADE,
  voto_tipo text NOT NULL CHECK (voto_tipo IN ('Apoyar', 'Discrepar')),
  cambio_apoyos integer NOT NULL CHECK (cambio_apoyos IN (-1, 0, 1)),
  fecha_interaccion timestamptz
);
GRANT ALL ON public.propuesta_actividad TO service_role;
ALTER TABLE public.propuesta_actividad ENABLE ROW LEVEL SECURITY;
CREATE INDEX propuesta_actividad_propuesta_idx ON public.propuesta_actividad(id_propuesta, fecha_interaccion, id);
COMMENT ON COLUMN public.propuesta_actividad.fecha_interaccion IS 'NULL for pre-tracking reactions whose actual timestamp is unknown; never fabricate historic timestamps.';
INSERT INTO public.propuesta_actividad (id_propuesta,id_usuario,voto_tipo,cambio_apoyos,fecha_interaccion)
SELECT id_propuesta,id_usuario,voto_tipo,CASE WHEN voto_tipo='Apoyar' THEN 1 ELSE 0 END,NULL FROM public.apoyos_propuestas;
CREATE FUNCTION public.record_propuesta_actividad() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.propuesta_actividad(id_propuesta,id_usuario,voto_tipo,cambio_apoyos,fecha_interaccion)
    VALUES (NEW.id_propuesta,NEW.id_usuario,NEW.voto_tipo,CASE WHEN NEW.voto_tipo='Apoyar' THEN 1 ELSE 0 END,clock_timestamp());
  ELSIF NEW.voto_tipo IS DISTINCT FROM OLD.voto_tipo THEN
    INSERT INTO public.propuesta_actividad(id_propuesta,id_usuario,voto_tipo,cambio_apoyos,fecha_interaccion)
    VALUES (NEW.id_propuesta,NEW.id_usuario,NEW.voto_tipo,CASE WHEN NEW.voto_tipo='Apoyar' THEN 1 ELSE -1 END,clock_timestamp());
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.record_propuesta_actividad() FROM PUBLIC;
CREATE TRIGGER record_propuesta_actividad AFTER INSERT OR UPDATE ON public.apoyos_propuestas FOR EACH ROW EXECUTE FUNCTION public.record_propuesta_actividad();